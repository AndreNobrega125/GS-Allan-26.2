const path = require("path");
const express = require("express");
const { MongoClient } = require("mongodb");

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const DB_NAME = "cidade_em_alerta";

const CATEGORIAS = ["Buraco na via", "Iluminação", "Lixo/Entulho", "Calçada/Acessibilidade", "Alagamento", "Outro"];
const PRIORIDADES = ["Baixa", "Média", "Alta"];

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let colecao; // coleção "ocorrencias"

// Valida e normaliza os campos recebidos do formulário.
function validar(body) {
  const erros = [];
  const titulo = String(body.titulo || "").trim();
  const categoria = String(body.categoria || "").trim();
  const prioridade = String(body.prioridade || "").trim();
  const bairro = String(body.bairro || "").trim();
  const descricao = String(body.descricao || "").trim();

  if (titulo.length < 3 || titulo.length > 100) erros.push("Título deve ter entre 3 e 100 caracteres.");
  if (!CATEGORIAS.includes(categoria)) erros.push("Categoria inválida.");
  if (!PRIORIDADES.includes(prioridade)) erros.push("Prioridade inválida.");
  if (bairro.length < 2 || bairro.length > 60) erros.push("Bairro deve ter entre 2 e 60 caracteres.");
  if (descricao.length > 300) erros.push("Descrição deve ter no máximo 300 caracteres.");

  return { erros, dados: { titulo, categoria, prioridade, bairro, descricao } };
}

// Opções do formulário (mantém front e back sincronizados).
app.get("/api/opcoes", (req, res) => {
  res.json({ categorias: CATEGORIAS, prioridades: PRIORIDADES });
});

// GET: lista os registros (mais recentes primeiro).
app.get("/api/ocorrencias", async (req, res) => {
  try {
    const lista = await colecao.find().sort({ criadoEm: -1 }).toArray();
    res.json(lista);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro ao consultar os registros." });
  }
});

// POST: valida e grava um novo registro.
app.post("/api/ocorrencias", async (req, res) => {
  const { erros, dados } = validar(req.body || {});
  if (erros.length) return res.status(400).json({ erro: erros.join(" ") });
  try {
    const registro = { ...dados, criadoEm: new Date() };
    const r = await colecao.insertOne(registro);
    res.status(201).json({ mensagem: "Ocorrência registrada com sucesso!", id: r.insertedId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro ao salvar o registro." });
  }
});

// GET: indicadores (total + resumo por categoria e por prioridade).
app.get("/api/indicadores", async (req, res) => {
  try {
    const total = await colecao.countDocuments();
    const agrupar = (campo) =>
      colecao.aggregate([{ $group: { _id: `$${campo}`, quantidade: { $sum: 1 } } }, { $sort: { quantidade: -1 } }]).toArray();
    const [porCategoria, porPrioridade] = await Promise.all([agrupar("categoria"), agrupar("prioridade")]);
    const altas = porPrioridade.find((p) => p._id === "Alta");
    res.json({
      total,
      porCategoria: porCategoria.map((x) => ({ nome: x._id, quantidade: x.quantidade })),
      porPrioridade: porPrioridade.map((x) => ({ nome: x._id, quantidade: x.quantidade })),
      percentualAlta: total ? Math.round(((altas ? altas.quantidade : 0) / total) * 100) : 0,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro ao calcular os indicadores." });
  }
});

// 404 para rotas inexistentes.
app.use((req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ erro: "Rota não encontrada." });
  res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});

async function iniciar() {
  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    colecao = client.db(DB_NAME).collection("ocorrencias");
    console.log("MongoDB conectado.");
    app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
  } catch (e) {
    console.error("Não foi possível conectar ao MongoDB. Verifique se ele está rodando / MONGODB_URI.");
    console.error(e.message);
    process.exit(1);
  }
}

iniciar();
