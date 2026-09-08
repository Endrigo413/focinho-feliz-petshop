/* Detalhe do produto */
(function () {
  "use strict";
  const esc = (s) => FF.escape(s);
  const id = FF.query("id");
  let quantidade = 1;
  let produto = null;

  const NOMES_CAT = { racao: "Ração", petisco: "Petiscos", higiene: "Higiene & Beleza", brinquedo: "Brinquedos", acessorio: "Acessórios", saude: "Farmácia", jardinagem: "Jardinagem", aquarismo: "Aquarismo" };

  function render() {
    const p = produto;
    const emPromo = p.precoPromocional != null && p.precoPromocional < p.preco;
    const preco = FF.precoEfetivo(p);
    const esgotado = p.estoque <= 0;
    const parcela = preco / 3;

    document.title = p.nome + " — Focinho Feliz";
    document.getElementById("breadcrumb").innerHTML =
      `<a href="/">Início</a> · <a href="/produtos">Produtos</a> · <a href="/produtos?categoria=${p.categoria}">${esc(NOMES_CAT[p.categoria] || p.categoria)}</a> · ${esc(p.nome)}`;

    document.getElementById("conteudo").innerHTML = `
    <div class="produto-det">
      <div class="produto-det__fig" style="background:${esc(p.cor)}18">${esc(p.emoji || "🐾")}</div>
      <div>
        <div class="produto-det__marca">${esc(p.marca || "")}</div>
        <h1>${esc(p.nome)}</h1>
        <div class="estrelas">${FF.estrelas(p.avaliacao)}<span class="estrelas__txt">${p.avaliacao || 0} · ${p.numAvaliacoes || 0} avaliações</span></div>

        <div class="produto-det__preco-box">
          ${emPromo ? `<div><span class="produto-det__de">${FF.dinheiro(p.preco)}</span> <span class="pill pill--promo">-${Math.round((1 - p.precoPromocional / p.preco) * 100)}%</span></div>` : ""}
          <div class="produto-det__por">${FF.dinheiro(preco)}</div>
          <div class="produto-det__parcela">ou 3x de ${FF.dinheiro(parcela)} sem juros · Pix com desconto</div>
        </div>

        <div style="display:flex;align-items:center;flex-wrap:wrap;gap:12px">
          <div class="produto-det__qtd">
            <button id="menos" aria-label="Diminuir">−</button>
            <span id="qtd">1</span>
            <button id="mais" aria-label="Aumentar">+</button>
          </div>
          <button class="btn ${esgotado ? "btn--suave" : "btn--primary"}" id="add" ${esgotado ? "disabled" : ""}>
            ${esgotado ? "Produto indisponível" : "Adicionar ao carrinho"}
          </button>
        </div>

        <div class="produto-det__meta">
          <span>📦 ${esgotado ? "Sem estoque no momento" : p.estoque <= 10 ? `Apenas ${p.estoque} em estoque` : "Em estoque"}</span>
          <span>🚚 Entrega em até 40 km da FATEC Taubaté · frete grátis acima de R$ 199</span>
          <span>🏬 Retirada grátis nas lojas de Taubaté</span>
          <span>🏷️ Seção: <a href="/produtos?categoria=${p.categoria}&subcategoria=${encodeURIComponent(p.subcategoria || "")}">${esc(p.subcategoria || NOMES_CAT[p.categoria])}</a></span>
        </div>

        <div class="produto-det__desc">
          <h3>Descrição</h3>
          <p>${esc(p.descricao)}</p>
          ${p.tags && p.tags.length ? `<div class="loja-card__servicos">${p.tags.map((t) => `<span class="pill pill--neutro">${esc(t)}</span>`).join("")}</div>` : ""}
        </div>
      </div>
    </div>`;

    const qtdEl = document.getElementById("qtd");
    document.getElementById("menos").onclick = () => { quantidade = Math.max(1, quantidade - 1); qtdEl.textContent = quantidade; };
    document.getElementById("mais").onclick = () => { quantidade = Math.min(p.estoque || 99, quantidade + 1); qtdEl.textContent = quantidade; };
    const add = document.getElementById("add");
    if (add && !esgotado) {
      add.onclick = () => {
        FFCart.adicionar(p, quantidade);
        FF.toast("Adicionado ao carrinho", "ok");
        add.textContent = "No carrinho ✓";
        setTimeout(() => (add.textContent = "Adicionar ao carrinho"), 1400);
      };
    }
  }

  async function initRelacionados() {
    try {
      const { produtos } = await FF.api(`/products/${encodeURIComponent(id)}/relacionados`);
      if (produtos && produtos.length) {
        document.getElementById("secRelacionados").hidden = false;
        FFUI.gradeProdutos(document.getElementById("relacionados"), produtos);
      }
    } catch (e) {}
  }

  async function init() {
    if (!id) { document.getElementById("conteudo").innerHTML = '<p class="vazio">Produto não informado.</p>'; return; }
    try {
      produto = await FF.api("/products/" + encodeURIComponent(id));
      render();
      initRelacionados();
    } catch (e) {
      document.getElementById("conteudo").innerHTML = '<div class="vazio"><div class="vazio__emoji">🔍</div><p>Produto não encontrado.</p><a class="btn btn--primary" href="/produtos">Ver catálogo</a></div>';
    }
  }
  init();
})();
