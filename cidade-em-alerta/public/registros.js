function celula(tr, texto, classe) {
  const td = document.createElement("td");
  if (classe) {
    const span = document.createElement("span");
    span.className = "tag " + classe;
    span.textContent = texto;
    td.appendChild(span);
  } else {
    td.textContent = texto; // textContent evita injeção de HTML
  }
  tr.appendChild(td);
}

function listar(ul, itens) {
  ul.innerHTML = "";
  if (!itens.length) { ul.innerHTML = "<li>Sem dados</li>"; return; }
  itens.forEach((i) => {
    const li = document.createElement("li");
    li.textContent = `${i.nome}: ${i.quantidade}`;
    ul.appendChild(li);
  });
}

async function carregar() {
  const msg = document.getElementById("msg");
  try {
    const [rl, ri] = await Promise.all([fetch("/api/ocorrencias"), fetch("/api/indicadores")]);
    if (!rl.ok || !ri.ok) throw new Error();
    const lista = await rl.json();
    const ind = await ri.json();

    document.getElementById("total").textContent = ind.total;
    document.getElementById("percAlta").textContent = ind.percentualAlta + "%";
    listar(document.getElementById("porCategoria"), ind.porCategoria);
    listar(document.getElementById("porPrioridade"), ind.porPrioridade);

    const corpo = document.getElementById("corpo");
    corpo.innerHTML = "";
    if (!lista.length) {
      msg.textContent = "Nenhuma ocorrência cadastrada ainda.";
      msg.className = "msg ok";
      return;
    }
    lista.forEach((o) => {
      const tr = document.createElement("tr");
      celula(tr, new Date(o.criadoEm).toLocaleString("pt-BR"));
      celula(tr, o.titulo);
      celula(tr, o.categoria);
      celula(tr, o.prioridade, o.prioridade);
      celula(tr, o.bairro);
      corpo.appendChild(tr);
    });
  } catch {
    msg.textContent = "Erro ao carregar os dados. O servidor/MongoDB está rodando?";
    msg.className = "msg erro";
  }
}

carregar();
