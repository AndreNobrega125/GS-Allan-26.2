const form = document.getElementById("form");
const msg = document.getElementById("msg");

function mostrar(texto, tipo) {
  msg.textContent = texto;
  msg.className = "msg " + tipo;
}

function preencher(select, itens) {
  itens.forEach((i) => {
    const o = document.createElement("option");
    o.value = i;
    o.textContent = i;
    select.appendChild(o);
  });
}

async function carregarOpcoes() {
  const r = await fetch("/api/opcoes");
  const op = await r.json();
  preencher(document.getElementById("categoria"), op.categorias);
  preencher(document.getElementById("prioridade"), op.prioridades);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const dados = Object.fromEntries(new FormData(form).entries());
  try {
    const r = await fetch("/api/ocorrencias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    const json = await r.json();
    if (r.ok) {
      mostrar(json.mensagem, "ok");
      form.reset();
    } else {
      mostrar(json.erro || "Erro ao enviar.", "erro");
    }
  } catch {
    mostrar("Falha de conexão com o servidor.", "erro");
  }
});

carregarOpcoes();
