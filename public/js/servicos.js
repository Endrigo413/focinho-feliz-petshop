/* Serviços da clínica + agendamento */
(function () {
  "use strict";
  const esc = (s) => FF.escape(s);
  const ICONES = { bath: "🛁", scissors: "✂️", stethoscope: "🩺", syringe: "💉", home: "🏠", target: "🎯", car: "🚕" };
  const ROT_CAT = { estetica: "Estética", saude: "Saúde", hospedagem: "Hospedagem", comportamento: "Comportamento", conveniencia: "Conveniência" };
  let servicos = [];
  let filtro = "";

  function formatDur(m) {
    if (m >= 1440) return "Diária";
    if (m >= 60) return `${Math.round(m / 60)}h`;
    return `${m} min`;
  }

  function render() {
    const cats = [...new Set(servicos.map((s) => s.categoria))];
    document.getElementById("filtroServicos").innerHTML =
      `<button class="chip ${!filtro ? "is-ativo" : ""}" data-cat="">Todos</button>` +
      cats.map((c) => `<button class="chip ${filtro === c ? "is-ativo" : ""}" data-cat="${c}">${esc(ROT_CAT[c] || c)}</button>`).join("");
    document.querySelectorAll("#filtroServicos [data-cat]").forEach((b) => {
      b.addEventListener("click", () => { filtro = b.dataset.cat; render(); });
      if (b.dataset.cat === filtro) b.style.background = "var(--teal)", (b.style.color = "#fff");
    });

    const lista = filtro ? servicos.filter((s) => s.categoria === filtro) : servicos;
    document.getElementById("grade").innerHTML = lista
      .map(
        (s) => `
      <article class="servico-card">
        <div class="servico-card__icone">${ICONES[s.icone] || "🐾"}</div>
        <h3>${esc(s.nome)}</h3>
        <p>${esc(s.descricao)}</p>
        <div class="servico-card__meta">
          <span>⏱ ${formatDur(s.duracaoMin)}</span>
          <span class="servico-card__preco">${FF.dinheiro(s.preco)}</span>
        </div>
        <button class="btn btn--linha btn--bloco" data-agendar="${s.id}">Agendar</button>
      </article>`
      )
      .join("");
    document.querySelectorAll("[data-agendar]").forEach((b) => b.addEventListener("click", () => abrir(b.dataset.agendar)));
  }

  const modal = document.getElementById("modalAgendar");
  const form = document.getElementById("formAgendar");
  const msg = document.getElementById("msgAgendar");

  function abrir(servicoId) {
    if (!FF.exigirLogin()) return;
    const s = servicos.find((x) => x.id === servicoId);
    if (!s) return;
    document.getElementById("modalTitulo").textContent = "Agendar: " + s.nome;
    form.servicoId.value = servicoId;
    msg.textContent = "";
    msg.className = "form-msg";
    if (FF.usuario) {
      form.nome.value = FF.usuario.nome || "";
      form.telefone.value = FF.usuario.telefone || "";
    }
    form.data.min = new Date().toISOString().slice(0, 10);
    modal.hidden = false;
    document.body.classList.add("trava-scroll");
  }
  function fechar() {
    modal.hidden = true;
    document.body.classList.remove("trava-scroll");
  }
  modal.querySelectorAll("[data-fechar]").forEach((b) => b.addEventListener("click", fechar));
  modal.addEventListener("click", (e) => { if (e.target === modal) fechar(); });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form).entries());
    msg.textContent = "Enviando…";
    msg.className = "form-msg info";
    try {
      const r = await FF.api("/appointments", {
        method: "POST",
        body: {
          cliente: { nome: d.nome, telefone: d.telefone },
          servicoId: d.servicoId,
          pet: { nome: d.petNome, especie: d.petEspecie },
          data: d.data,
          horario: d.horario,
          observacoes: d.observacoes
        }
      });
      msg.textContent = `Agendamento ${r.id} enviado! Vamos confirmar por telefone.`;
      msg.className = "form-msg ok";
      form.reset();
      setTimeout(fechar, 2200);
    } catch (err) {
      msg.textContent = err.message;
      msg.className = "form-msg erro";
    }
  });

  async function init() {
    try {
      servicos = (await FF.api("/services")).servicos || [];
      render();
    } catch (e) {
      document.getElementById("grade").innerHTML = '<p class="vazio">Não foi possível carregar os serviços.</p>';
    }
  }
  init();
})();
