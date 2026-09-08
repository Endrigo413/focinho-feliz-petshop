/* Lojas + centro de distribuição */
(function () {
  "use strict";
  const esc = (s) => FF.escape(s);
  const mapa = document.getElementById("mapa");

  function focar(l) {
    mapa.src = `https://maps.google.com/maps?q=${l.lat},${l.lng}&z=15&output=embed`;
  }

  function card(l) {
    const cd = l.tipo === "cd";
    return `
    <div class="loja-card ${cd ? "loja-card--cd" : ""}">
      <span class="loja-card__tipo">${cd ? "Centro de Distribuição" : "Loja"}</span>
      <h3>${esc(l.nome)}</h3>
      <p class="loja-card__linha">📍 ${esc(l.endereco)}</p>
      <p class="loja-card__linha">✉️ CEP ${esc(l.cep)} · ${esc(l.bairro)}</p>
      <p class="loja-card__linha">📞 ${esc(l.telefone)}</p>
      <p class="loja-card__linha">🕑 ${esc(l.horario)}</p>
      <div class="loja-card__servicos">
        ${(l.servicos || []).map((s) => `<span class="pill pill--neutro">${esc(s)}</span>`).join("")}
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <a class="loja-card__mapa" href="${esc(l.mapsUrl)}" target="_blank" rel="noopener">🗺️ Abrir no Google Maps ↗</a>
        <button class="loja-card__mapa" data-focar style="background:none;border:none;cursor:pointer;color:var(--teal)">📌 Ver aqui no mapa</button>
      </div>
    </div>`;
  }

  async function init() {
    try {
      const { lojas, centroDistribuicao } = await FF.api("/stores");
      const todos = [centroDistribuicao, ...lojas].filter(Boolean);
      focar(centroDistribuicao || lojas[0]);
      const el = document.getElementById("grade");
      el.innerHTML = todos.map(card).join("");
      el.querySelectorAll(".loja-card").forEach((cardEl, i) => {
        const b = cardEl.querySelector("[data-focar]");
        if (b) b.addEventListener("click", () => { focar(todos[i]); mapa.scrollIntoView({ behavior: "smooth", block: "center" }); });
      });
    } catch (e) {
      document.getElementById("grade").innerHTML = '<p class="vazio">Não foi possível carregar as lojas.</p>';
    }
  }
  init();
})();
