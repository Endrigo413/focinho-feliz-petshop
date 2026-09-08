/* =========================================================
   Focinho Feliz — cabeçalho e rodapé compartilhados
   Injeta o header em #ff-header e o footer em #ff-footer de cada página.
   ========================================================= */
(function () {
  "use strict";

  const CATEGORIAS = [
    { slug: "racao", nome: "Ração", emoji: "🍖" },
    { slug: "petisco", nome: "Petiscos", emoji: "🦴" },
    { slug: "higiene", nome: "Higiene", emoji: "🧴" },
    { slug: "brinquedo", nome: "Brinquedos", emoji: "🎾" },
    { slug: "acessorio", nome: "Acessórios", emoji: "🎒" },
    { slug: "saude", nome: "Farmácia", emoji: "💊" },
    { slug: "jardinagem", nome: "Jardinagem", emoji: "🌱" },
    { slug: "aquarismo", nome: "Aquarismo", emoji: "🐠" }
  ];

  const AVISOS = [
    "🚚 Frete grátis acima de R$ 199 em Taubaté (raio de 40 km)",
    "🏬 Retire de graça em qualquer uma das nossas 5 lojas",
    "🩺 Primeira consulta veterinária com 20% de desconto",
    "🌱 Novidades na seção de Jardinagem toda semana"
  ];

  const navAtiva = document.body.dataset.nav || "";
  const esc = (s) => (window.FF ? FF.escape(s) : s);

  function linksCategoria(prefixoClasse) {
    return CATEGORIAS.map(
      (c) =>
        `<a class="${prefixoClasse}${navAtiva === c.slug ? " is-active" : ""}" href="/produtos?categoria=${c.slug}">` +
        `<span aria-hidden="true">${c.emoji}</span> ${c.nome}</a>`
    ).join("");
  }

  function construirHeader() {
    return `
    <div class="topbar">
      <div class="wrap topbar__inner">
        <p class="topbar__aviso" id="ffAviso">${AVISOS[0]}</p>
        <div class="topbar__links">
          <a href="/lojas">Lojas</a><span>·</span>
          <a href="/servicos">Serviços</a><span>·</span>
          <a href="/blog">Blog</a>
        </div>
      </div>
    </div>

    <header class="masthead">
      <div class="wrap masthead__inner">
        <button class="icon-btn masthead__menu" id="ffMenuAbrir" aria-label="Abrir menu" aria-expanded="false">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>

        <a class="brand" href="/">
          <svg class="brand__mark" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M24 27c-6.5 0-13 5.1-13 10.4 0 2.6 2.1 4.1 5 3.6 2.6-.5 5.1-1.7 8-1.7s5.4 1.2 8 1.7c2.9.5 5-1 5-3.6C37 32.1 30.5 27 24 27Z" fill="currentColor"/>
            <ellipse cx="12.5" cy="18" rx="4.3" ry="5.4" fill="currentColor"/><ellipse cx="35.5" cy="18" rx="4.3" ry="5.4" fill="currentColor"/>
            <ellipse cx="19.5" cy="10.5" rx="3.6" ry="4.6" fill="currentColor"/><ellipse cx="28.5" cy="10.5" rx="3.6" ry="4.6" fill="currentColor"/>
          </svg>
          <span class="brand__text">Focinho Feliz</span>
        </a>

        <form class="busca" action="/produtos" method="get" role="search">
          <input type="search" name="busca" placeholder="Busque por ração, brinquedo, planta…" aria-label="Buscar produtos" />
          <button type="submit" aria-label="Buscar">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </form>

        <div class="masthead__acoes">
          <div class="conta" id="ffConta">
            <a class="conta__entrar" href="/conta/entrar">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" fill="none" stroke="currentColor" stroke-width="2"/></svg>
              <span>Entrar</span>
            </a>
          </div>

          <a class="carrinho-btn" href="/carrinho" aria-label="Carrinho">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6h15l-1.6 9h-11L6 3H3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="20" r="1.5" fill="currentColor"/><circle cx="18" cy="20" r="1.5" fill="currentColor"/></svg>
            <span class="carrinho-btn__contador" data-cart-count>0</span>
          </a>
        </div>
      </div>

      <nav class="catnav" aria-label="Categorias">
        <div class="wrap catnav__inner">
          ${linksCategoria("catnav__link")}
          <a class="catnav__link${navAtiva === "servicos" ? " is-active" : ""}" href="/servicos">🩺 Serviços</a>
        </div>
      </nav>
    </header>

    <div class="drawer" id="ffDrawer" aria-hidden="true">
      <div class="drawer__head">
        <span class="brand__text">Focinho Feliz</span>
        <button class="icon-btn" id="ffMenuFechar" aria-label="Fechar menu">✕</button>
      </div>
      <div class="drawer__conta" id="ffDrawerConta"></div>
      <p class="drawer__titulo">Categorias</p>
      ${linksCategoria("drawer__link")}
      <p class="drawer__titulo">Mais</p>
      <a class="drawer__link" href="/servicos">🩺 Serviços</a>
      <a class="drawer__link" href="/lojas">📍 Nossas lojas</a>
      <a class="drawer__link" href="/blog">📰 Blog</a>
    </div>
    <div class="scrim" id="ffScrim" hidden></div>`;
  }

  function construirFooter() {
    const cats = CATEGORIAS.map((c) => `<li><a href="/produtos?categoria=${c.slug}">${c.nome}</a></li>`).join("");
    return `
    <div class="wrap footer__inner">
      <div class="footer__col footer__brand">
        <span class="brand__text">Focinho Feliz</span>
        <p>Pet shop, clínica veterinária e jardinagem. Loja de bairro em Taubaté desde 2014.</p>
        <p class="footer__contato">📞 (12) 3621-1010 · ✉️ contato@focinhofeliz.com.br</p>
      </div>
      <div class="footer__col">
        <h4>Categorias</h4>
        <ul>${cats}</ul>
      </div>
      <div class="footer__col">
        <h4>Institucional</h4>
        <ul>
          <li><a href="/servicos">Serviços da clínica</a></li>
          <li><a href="/lojas">Nossas lojas</a></li>
          <li><a href="/blog">Blog</a></li>
          <li><a href="/conta/painel">Minha conta</a></li>
        </ul>
      </div>
      <div class="footer__col">
        <h4>Entrega</h4>
        <ul>
          <li>Saímos da FATEC Taubaté</li>
          <li>Entregamos em até 40 km</li>
          <li>Frete grátis acima de R$ 199</li>
          <li>Retirada nas lojas sem custo</li>
        </ul>
      </div>
    </div>
    <div class="wrap footer__base">
      <span>© <span id="ffAno"></span> Focinho Feliz Pet Shop &amp; Clínica</span>
      <span class="footer__pgto">Pix · Cartão · Boleto</span>
    </div>`;
  }

  /* --------------------------- comportamento --------------------------- */
  function montarConta() {
    const box = document.getElementById("ffConta");
    const boxDrawer = document.getElementById("ffDrawerConta");
    if (!box) return;
    const u = window.FF && FF.usuario;

    if (u) {
      const primeiro = esc(u.nome.split(" ")[0]);
      const admin = u.papel === "admin";
      box.innerHTML = `
        <button class="conta__trigger" id="ffContaTrigger" aria-haspopup="menu" aria-expanded="false">
          <span class="conta__avatar">${esc((u.nome[0] || "?").toUpperCase())}</span>
          <span class="conta__nome">${primeiro}${admin ? ' <span class="tag-admin">ADMIN</span>' : ""}</span>
        </button>
        <div class="conta__menu" id="ffContaMenu" hidden>
          <p class="conta__email">${esc(u.email)}</p>
          <a href="/conta/painel">Meus pedidos</a>
          <a href="/conta/painel#dados">Meus dados e endereços</a>
          ${admin ? '<a href="/admin" class="conta__admin">⚙️ Painel administrativo</a>' : ""}
          <button type="button" id="ffSair">Sair</button>
        </div>`;
      const trig = document.getElementById("ffContaTrigger");
      const menu = document.getElementById("ffContaMenu");
      trig.addEventListener("click", () => {
        const aberto = menu.hidden;
        menu.hidden = !aberto;
        trig.setAttribute("aria-expanded", String(aberto));
      });
      document.addEventListener("click", (e) => {
        if (!box.contains(e.target)) menu.hidden = true;
      });
      document.getElementById("ffSair").addEventListener("click", () => {
        FF.limparSessao();
        location.href = "/";
      });
      if (boxDrawer) {
        boxDrawer.innerHTML = `
          <p class="drawer__ola">Olá, ${primeiro} ${admin ? '<span class="tag-admin">ADMIN</span>' : ""}</p>
          <a class="drawer__link" href="/conta/painel">Meus pedidos</a>
          ${admin ? '<a class="drawer__link" href="/admin">⚙️ Painel administrativo</a>' : ""}
          <button class="drawer__link drawer__sair" type="button" data-sair>Sair</button>`;
        const b = boxDrawer.querySelector("[data-sair]");
        if (b) b.addEventListener("click", () => { FF.limparSessao(); location.href = "/"; });
      }
    } else {
      box.innerHTML = `
        <a class="conta__entrar" href="/conta/entrar">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          <span>Entrar</span>
        </a>`;
      if (boxDrawer) {
        boxDrawer.innerHTML = `
          <a class="btn btn--primary btn--bloco" href="/conta/entrar">Entrar</a>
          <a class="btn btn--linha btn--bloco" href="/conta/criar">Criar conta</a>`;
      }
    }
  }

  function atualizarCarrinho() {
    const n = window.FFCart ? FFCart.contar() : 0;
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      el.textContent = n;
      el.hidden = n === 0;
    });
  }

  function wireDrawer() {
    const drawer = document.getElementById("ffDrawer");
    const scrim = document.getElementById("ffScrim");
    const abrir = document.getElementById("ffMenuAbrir");
    const fechar = document.getElementById("ffMenuFechar");
    if (!drawer) return;
    const setAberto = (v) => {
      drawer.classList.toggle("is-aberto", v);
      drawer.setAttribute("aria-hidden", String(!v));
      scrim.hidden = !v;
      abrir.setAttribute("aria-expanded", String(v));
      document.body.classList.toggle("trava-scroll", v);
    };
    abrir.addEventListener("click", () => setAberto(true));
    fechar.addEventListener("click", () => setAberto(false));
    scrim.addEventListener("click", () => setAberto(false));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setAberto(false);
    });
  }

  function rotacionarAviso() {
    const el = document.getElementById("ffAviso");
    if (!el) return;
    let i = 0;
    setInterval(() => {
      i = (i + 1) % AVISOS.length;
      el.style.opacity = "0";
      setTimeout(() => {
        el.textContent = AVISOS[i];
        el.style.opacity = "1";
      }, 250);
    }, 4500);
  }

  function init() {
    const h = document.getElementById("ff-header");
    const f = document.getElementById("ff-footer");
    if (h) h.innerHTML = construirHeader();
    if (f) {
      f.className = "footer";
      f.innerHTML = construirFooter();
      const ano = document.getElementById("ffAno");
      if (ano) ano.textContent = new Date().getFullYear();
    }
    montarConta();
    atualizarCarrinho();
    wireDrawer();
    rotacionarAviso();

    document.addEventListener("ff:sessao", montarConta);
    document.addEventListener("ff:carrinho", atualizarCarrinho);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
