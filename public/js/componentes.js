/* =========================================================
   Focinho Feliz — componentes compartilhados de UI
   window.FFUI.gradeProdutos(container, produtos)
   ========================================================= */
(function () {
  "use strict";
  const esc = (s) => FF.escape(s);

  function cardProduto(p) {
    const emPromo = p.precoPromocional != null && p.precoPromocional < p.preco;
    const preco = FF.precoEfetivo(p);
    const esgotado = p.estoque <= 0;
    const selos = [];
    if (emPromo) {
      const off = Math.round((1 - p.precoPromocional / p.preco) * 100);
      selos.push(`<span class="pill pill--promo">-${off}%</span>`);
    }
    if (p.destaque && !esgotado) selos.push('<span class="pill pill--destaque">Destaque</span>');
    if (esgotado) selos.push('<span class="pill pill--esgotado">Esgotado</span>');

    return `
    <article class="card-produto" data-id="${esc(p.id)}">
      <div class="card-produto__selos">${selos.join("")}</div>
      <a class="card-produto__link" href="/produto?id=${encodeURIComponent(p.id)}">
        <div class="card-produto__fig" style="background:${esc(p.cor || "#F3ECDD")}22">${esc(p.emoji || "🐾")}</div>
        <div class="card-produto__corpo">
          <span class="card-produto__marca">${esc(p.marca || "")}</span>
          <h3 class="card-produto__nome">${esc(p.nome)}</h3>
          <div class="estrelas" title="${p.avaliacao || 0} de 5">${FF.estrelas(p.avaliacao)}<span class="estrelas__txt">(${p.numAvaliacoes || 0})</span></div>
          <div class="card-produto__precos">
            ${emPromo ? `<span class="card-produto__de">${FF.dinheiro(p.preco)}</span>` : ""}
            <div class="card-produto__por">${FF.dinheiro(preco)} ${emPromo ? "" : "<small>à vista</small>"}</div>
          </div>
        </div>
      </a>
      <div class="card-produto__acao">
        <button class="btn ${esgotado ? "btn--suave" : "btn--primary"} btn--pequeno btn--bloco" data-add ${esgotado ? "disabled" : ""}>
          ${esgotado ? "Indisponível" : "Adicionar"}
        </button>
      </div>
    </article>`;
  }

  function gradeProdutos(container, produtos) {
    if (!container) return;
    if (!produtos || !produtos.length) {
      container.innerHTML = '<div class="vazio"><div class="vazio__emoji">🐾</div><p>Nenhum produto encontrado com esses filtros.</p></div>';
      container.className = "";
      return;
    }
    container.className = "grade-produtos";
    container.innerHTML = produtos.map(cardProduto).join("");
    const mapa = {};
    produtos.forEach((p) => (mapa[p.id] = p));
    container.querySelectorAll("[data-add]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const card = btn.closest(".card-produto");
        const p = mapa[card.dataset.id];
        if (!p) return;
        FFCart.adicionar(p, 1);
        FF.toast(`${p.nome.slice(0, 40)}${p.nome.length > 40 ? "…" : ""} no carrinho`, "ok");
        btn.textContent = "Adicionado ✓";
        setTimeout(() => (btn.textContent = "Adicionar"), 1200);
      });
    });
  }

  window.FFUI = { cardProduto, gradeProdutos };
})();
