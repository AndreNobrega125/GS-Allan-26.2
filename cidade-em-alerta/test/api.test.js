// Testes automatizados (sem dependências extras): node:test + fetch nativo.
// Rodam sem MongoDB, usando uma coleção em memória que imita o que o server.js usa.
const test = require("node:test");
const assert = require("node:assert");
const { app, validar, definirColecao } = require("../server");

class ColecaoFake {
  constructor() { this.docs = []; }
  async insertOne(d) {
    const _id = String(this.docs.length + 1);
    this.docs.push({ _id, ...d });
    return { insertedId: _id };
  }
  find() {
    const docs = this.docs;
    return { sort: () => ({ toArray: async () => [...docs].reverse() }) };
  }
  async countDocuments() { return this.docs.length; }
  aggregate(pipeline) {
    const campo = pipeline[0].$group._id.slice(1);
    const docs = this.docs;
    return {
      toArray: async () => {
        const m = new Map();
        for (const d of docs) m.set(d[campo], (m.get(d[campo]) || 0) + 1);
        return [...m].map(([_id, quantidade]) => ({ _id, quantidade })).sort((a, b) => b.quantidade - a.quantidade);
      },
    };
  }
}

const valido = { titulo: "Buraco na Av. Paulista", categoria: "Buraco na via", prioridade: "Alta", bairro: "Bela Vista" };

let server, base, fake;

test.before(async () => {
  fake = new ColecaoFake();
  definirColecao(fake);
  await new Promise((r) => { server = app.listen(0, "127.0.0.1", r); });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());
test.beforeEach(() => { fake.docs = []; definirColecao(fake); });

const post = (corpo, raw) =>
  fetch(`${base}/api/ocorrencias`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ?? JSON.stringify(corpo),
  });

test("validar: aceita registro válido e normaliza espaços", () => {
  const { erros, dados } = validar({ ...valido, titulo: "  Buraco  " });
  assert.deepStrictEqual(erros, []);
  assert.strictEqual(dados.titulo, "Buraco");
});

test("validar: rejeita valores fora da lista e tamanhos inválidos", () => {
  assert.ok(validar({}).erros.length >= 4);
  assert.ok(validar({ ...valido, categoria: "Qualquer" }).erros.includes("Categoria inválida."));
  assert.ok(validar({ ...valido, prioridade: "Urgente" }).erros.includes("Prioridade inválida."));
  assert.ok(validar({ ...valido, descricao: "x".repeat(301) }).erros.length === 1);
});

test("GET /api/opcoes devolve categorias e prioridades", async () => {
  const r = await fetch(`${base}/api/opcoes`);
  const j = await r.json();
  assert.strictEqual(r.status, 200);
  assert.ok(j.categorias.includes("Iluminação"));
  assert.deepStrictEqual(j.prioridades, ["Baixa", "Média", "Alta"]);
});

test("POST válido: 201, mensagem de confirmação e grava no banco", async () => {
  const r = await post(valido);
  const j = await r.json();
  assert.strictEqual(r.status, 201);
  assert.match(j.mensagem, /sucesso/i);
  assert.strictEqual(fake.docs.length, 1);
  assert.ok(fake.docs[0].criadoEm instanceof Date);
});

test("POST inválido: 400, mensagem de erro e nada é gravado", async () => {
  for (const corpo of [
    {},
    { ...valido, titulo: "ab" },
    { ...valido, categoria: "Inexistente" },
    { ...valido, prioridade: "" },
    { ...valido, bairro: "x" },
    { ...valido, descricao: "x".repeat(301) },
    { ...valido, categoria: { $ne: 1 } }, // tentativa de injeção NoSQL
    { ...valido, titulo: ["a", "b", "c"] },
  ]) {
    const r = await post(corpo);
    const j = await r.json();
    assert.strictEqual(r.status, 400, JSON.stringify(corpo));
    assert.ok(j.erro);
  }
  assert.strictEqual(fake.docs.length, 0);
});

test("POST com JSON malformado: 400 limpo, sem stack trace", async () => {
  const r = await post(null, "{bad");
  const texto = await r.text();
  assert.strictEqual(r.status, 400);
  assert.deepStrictEqual(JSON.parse(texto), { erro: "JSON inválido." });
  assert.ok(!texto.includes("at "));
});

test("POST com corpo gigante: 413", async () => {
  const r = await post({ ...valido, descricao: "x".repeat(20000) });
  assert.strictEqual(r.status, 413);
});

test("Texto com HTML é guardado como texto (o front usa textContent)", async () => {
  await post({ ...valido, titulo: "<script>alert(1)</script>" });
  const lista = await (await fetch(`${base}/api/ocorrencias`)).json();
  assert.strictEqual(lista[0].titulo, "<script>alert(1)</script>");
});

test("GET /api/ocorrencias lista os registros", async () => {
  await post(valido);
  await post({ ...valido, titulo: "Poste apagado", categoria: "Iluminação", prioridade: "Média", bairro: "Mooca" });
  const j = await (await fetch(`${base}/api/ocorrencias`)).json();
  assert.strictEqual(j.length, 2);
  assert.strictEqual(j[0].titulo, "Poste apagado");
});

test("GET /api/indicadores: total, resumo por categoria/prioridade e % alta", async () => {
  await post(valido);
  await post({ ...valido, titulo: "Outro buraco", bairro: "Mooca" });
  await post({ ...valido, titulo: "Poste apagado", categoria: "Iluminação", prioridade: "Baixa" });
  const j = await (await fetch(`${base}/api/indicadores`)).json();
  assert.strictEqual(j.total, 3);
  assert.deepStrictEqual(j.porCategoria[0], { nome: "Buraco na via", quantidade: 2 });
  assert.deepStrictEqual(j.porPrioridade[0], { nome: "Alta", quantidade: 2 });
  assert.strictEqual(j.percentualAlta, 67);
});

test("GET /api/indicadores sem registros: zeros, sem divisão por zero", async () => {
  const j = await (await fetch(`${base}/api/indicadores`)).json();
  assert.strictEqual(j.total, 0);
  assert.strictEqual(j.percentualAlta, 0);
  assert.deepStrictEqual(j.porCategoria, []);
});

test("Rota inexistente: 404 em JSON na API e página 404 no site", async () => {
  const a = await fetch(`${base}/api/nada`);
  assert.strictEqual(a.status, 404);
  assert.deepStrictEqual(await a.json(), { erro: "Rota não encontrada." });
  const p = await fetch(`${base}/xyz`);
  assert.strictEqual(p.status, 404);
  assert.match(await p.text(), /404/);
});

test("Páginas do site são servidas", async () => {
  for (const rota of ["/", "/registros.html"]) {
    assert.strictEqual((await fetch(`${base}${rota}`)).status, 200, rota);
  }
});

test("Falha no banco: 500 com mensagem genérica, sem vazar detalhes", async () => {
  definirColecao({
    find: () => { throw new Error("segredo-interno-do-banco"); },
    countDocuments: async () => { throw new Error("segredo-interno-do-banco"); },
    insertOne: async () => { throw new Error("segredo-interno-do-banco"); },
  });
  for (const [metodo, rota] of [["GET", "/api/ocorrencias"], ["GET", "/api/indicadores"]]) {
    const r = await fetch(`${base}${rota}`, { method: metodo });
    const t = await r.text();
    assert.strictEqual(r.status, 500);
    assert.ok(!t.includes("segredo-interno"));
  }
  const r = await post(valido);
  assert.strictEqual(r.status, 500);
  assert.ok(!(await r.text()).includes("segredo-interno"));
});
