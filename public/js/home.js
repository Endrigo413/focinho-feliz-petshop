/* Home */
(function () {
  "use strict";
  const esc = (s) => FF.escape(s);

  const CATS = [
    { slug: "racao", nome: "Ração", emoji: "🍖" },
    { slug: "petisco", nome: "Petiscos", emoji: "🦴" },
    { slug: "higiene", nome: "Higiene", emoji: "🧴" },
    { slug: "brinquedo", nome: "Brinquedos", emoji: "🎾" },
    { slug: "acessorio", nome: "Acessórios", emoji: "🎒" },
    { slug: "saude", nome: "Farmácia", emoji: "💊" },
    { slug: "jardinagem", nome: "Jardinagem", emoji: "🌱" },
    { slug: "aquarismo", nome: "Aquarismo", emoji: "🐠" }
  ];

  async function initHero() {
    const el = document.getElementById("heroPrincipal");
    let banners = [];
    try {
      banners = (await FF.api("/banners")).banners || [];
    } catch (e) {}
    if (!banners.length) {
      banners = [{ titulo: "Bem-vindo ao Focinho Feliz", subtitulo: "Tudo para o seu pet, com entrega em Taubaté.", ctaLabel: "Ver produtos", ctaLink: "/produtos", cor: "#1F4B43", corFim: "#2E6B5E", emoji: "🐾" }];
    }
    el.innerHTML = `
      <div class="hero__slides" id="heroSlides">
        ${banners
          .map(
            (b, i) => `
          <div class="hero__slide ${i === 0 ? "is-ativo" : ""}" style="background:linear-gradient(120deg,${esc(b.cor)},${esc(b.corFim || b.cor)})">
            <h2>${esc(b.titulo)}</h2>
            <p>${esc(b.subtitulo || "")}</p>
            <a class="btn btn--marigold" href="${esc(b.ctaLink || "/produtos")}">${esc(b.ctaLabel || "Comprar")}</a>
            <span class="hero__emoji" aria-hidden="true">${esc(b.emoji || "")}</span>
          </div>`
          )
          .join("")}
      </div>
      <div class="hero__dots" id="heroDots">
        ${banners.map((_, i) => `<button class="${i === 0 ? "is-ativo" : ""}" data-i="${i}" aria-label="Banner ${i + 1}"></button>`).join("")}
      </div>`;

    const slides = [...el.querySelectorAll(".hero__slide")];
    const dots = [...el.querySelectorAll(".hero__dots button")];
    let atual = 0;
    const ir = (i) => {
      slides[atual].classList.remove("is-ativo");
      dots[atual].classList.remove("is-ativo");
      atual = (i + slides.length) % slides.length;
      slides[atual].classList.add("is-ativo");
      dots[atual].classList.add("is-ativo");
    };
    dots.forEach((d) => d.addEventListener("click", () => ir(Number(d.dataset.i))));
    if (slides.length > 1) setInterval(() => ir(atual + 1), 6000);
  }

  async function initPromoCards() {
    const el = document.getElementById("faixaPromo");
    try {
      const { promocoes } = await FF.api("/banners");
      el.innerHTML = (promocoes || [])
        .map(
          (p) => `
        <a class="promo-card" href="${esc(p.link || "/produtos")}">
          <span class="promo-card__emoji">${esc(p.emoji || "🏷️")}</span>
          <span>
            <span class="promo-card__selo">${esc(p.selo || "")}</span>
            <span class="promo-card__titulo">${esc(p.titulo)}</span><br>
            <span class="promo-card__desc">${esc(p.descricao || "")}</span>
          </span>
        </a>`
        )
        .join("");
    } catch (e) {
      el.hidden = true;
    }
  }

  async function initCategorias() {
    const el = document.getElementById("tilesCategoria");
    let dados = [];
    try {
      dados = (await FF.api("/categories")).categorias || [];
    } catch (e) {}
    const mapa = {};
    dados.forEach((c) => (mapa[c.slug] = c));
    el.innerHTML = CATS.map((c) => {
      const info = mapa[c.slug] || {};
      return `
      <a class="tile-categoria" href="/produtos?categoria=${c.slug}">
        <div class="tile-categoria__emoji">${c.emoji}</div>
        <div class="tile-categoria__nome">${c.nome}</div>
        <div class="tile-categoria__qtd">${info.totalProdutos || 0} produtos</div>
      </a>`;
    }).join("");
  }

  async function initGrade(id, query) {
    const el = document.getElementById(id);
    try {
      const { produtos } = await FF.api("/products?" + query);
      FFUI.gradeProdutos(el, produtos);
    } catch (e) {
      el.innerHTML = '<p class="vazio">Não foi possível carregar os produtos.</p>';
    }
  }

  async function initBlog() {
    const el = document.getElementById("blogHome");
    try {
      const { posts } = await FF.api("/blog");
      el.innerHTML = posts
        .slice(0, 3)
        .map(
          (p) => `
        <a class="blog-card" href="/blog/${esc(p.slug)}">
          <div class="blog-card__capa" style="background:${esc(p.cor)}22">${esc(p.emoji)}</div>
          <div class="blog-card__corpo">
            <span class="blog-card__cat">${esc(p.categoria)}</span>
            <h3 class="blog-card__titulo">${esc(p.titulo)}</h3>
            <p class="blog-card__resumo">${esc(p.resumo)}</p>
            <span class="blog-card__meta">${esc(p.autor)} · ${p.totalComentarios} comentário(s)</span>
          </div>
        </a>`
        )
        .join("");
    } catch (e) {
      el.closest(".secao").hidden = true;
    }
  }

  async function initLojas() {
    const el = document.getElementById("lojasHome");
    try {
      const { lojas } = await FF.api("/stores");
      el.innerHTML = lojas
        .slice(0, 3)
        .map(
          (l) => `
        <div class="loja-card">
          <span class="loja-card__tipo">Loja</span>
          <h3>${esc(l.nome)}</h3>
          <p class="loja-card__linha">📍 ${esc(l.endereco)}</p>
          <p class="loja-card__linha">🕑 ${esc(l.horario)}</p>
          <a class="loja-card__mapa" href="${esc(l.mapsUrl)}" target="_blank" rel="noopener">Abrir no Google Maps ↗</a>
        </div>`
        )
        .join("");
    } catch (e) {
      el.closest(".secao").hidden = true;
    }
  }

  initHero();
  initPromoCards();
  initCategorias();
  initGrade("gradePromocoes", "promo=1&ordenar=relevancia&porPagina=10");
  initGrade("gradeDestaques", "ordenar=avaliacao&porPagina=10");
  initBlog();
  initLojas();
})();
