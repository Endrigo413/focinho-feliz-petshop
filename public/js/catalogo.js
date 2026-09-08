/* Catálogo com filtros */
(function () {
  "use strict";
  const esc = (s) => FF.escape(s);
  const $ = (id) => document.getElementById(id);

  const CATS = [
    { slug: "racao", nome: "Ração", emoji: "🍖" },
    { slug: "petisco", nome: "Petiscos", emoji: "🦴" },
    { slug: "higiene", nome: "Higiene & Beleza", emoji: "🧴" },
    { slug: "brinquedo", nome: "Brinquedos", emoji: "🎾" },
    { slug: "acessorio", nome: "Acessórios", emoji: "🎒" },
    { slug: "saude", nome: "Farmácia", emoji: "💊" },
    { slug: "jardinagem", nome: "Jardinagem", emoji: "🌱" },
    { slug: "aquarismo", nome: "Aquarismo", emoji: "🐠" }
  ];

  let categorias = [];
  const params = new URLSearchParams(location.search);
  function multi(k) {
    return (params.get(k) || "").split(",").filter(Boolean);
  }

  function lerFiltros() {
    return {
      categoria: params.get("categoria") || "",
      subcategoria: multi("subcategoria"),
      especie: params.get("especie") || "",
      marca: multi("marca"),
      precoMin: params.get("precoMin") || "",
      precoMax: params.get("precoMax") || "",
      promo: params.get("promo") === "1",
      avaliacaoMin: params.get("avaliacaoMin") || "",
      ordenar: params.get("ordenar") || "relevancia",
      pagina: parseInt(params.get("pagina"), 10) || 1,
      busca: params.get("busca") || ""
    };
  }

  function escreverURL(f) {
    const q = new URLSearchParams();
    if (f.busca) q.set("busca", f.busca);
    if (f.categoria) q.set("categoria", f.categoria);
    if (f.subcategoria.length) q.set("subcategoria", f.subcategoria.join(","));
    if (f.especie) q.set("especie", f.especie);
    if (f.marca.length) q.set("marca", f.marca.join(","));
    if (f.precoMin) q.set("precoMin", f.precoMin);
    if (f.precoMax) q.set("precoMax", f.precoMax);
    if (f.promo) q.set("promo", "1");
    if (f.avaliacaoMin) q.set("avaliacaoMin", f.avaliacaoMin);
    if (f.ordenar && f.ordenar !== "relevancia") q.set("ordenar", f.ordenar);
    if (f.pagina > 1) q.set("pagina", f.pagina);
    history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : ""));
    [...params.keys()].forEach((k) => params.delete(k));
    for (const [k, v] of q) params.set(k, v);
  }

  function apiQuery(f) {
    const q = new URLSearchParams();
    q.set("porPagina", "30");
    if (f.busca) q.set("busca", f.busca);
    if (f.categoria) q.set("categoria", f.categoria);
    if (f.subcategoria.length) q.set("subcategoria", f.subcategoria[0]); // API filtra uma; usamos client p/ várias
    if (f.especie) q.set("especie", f.especie);
    if (f.marca.length) q.set("marca", f.marca.join(","));
    if (f.precoMin) q.set("precoMin", f.precoMin);
    if (f.precoMax) q.set("precoMax", f.precoMax);
    if (f.promo) q.set("promo", "1");
    if (f.avaliacaoMin) q.set("avaliacaoMin", f.avaliacaoMin);
    if (f.ordenar) q.set("ordenar", f.ordenar);
    q.set("pagina", f.pagina);
    return q.toString();
  }

  function renderSidebar(f, facetas) {
    // seções
    $("fSecoes").innerHTML = CATS.map(
      (c) => `<label class="filtros__check">
        <input type="radio" name="secao" value="${c.slug}" ${f.categoria === c.slug ? "checked" : ""}>
        ${c.emoji} ${c.nome}</label>`
    ).join("") + `<label class="filtros__check"><input type="radio" name="secao" value="" ${!f.categoria ? "checked" : ""}> Todas as seções</label>`;

    // subcategorias
    const cat = categorias.find((c) => c.slug === f.categoria);
    const grpSub = $("grpSub");
    if (cat && cat.subcategorias && cat.subcategorias.length) {
      grpSub.hidden = false;
      $("fSub").innerHTML = cat.subcategorias
        .map(
          (s) => `<label class="filtros__check"><input type="checkbox" name="sub" value="${esc(s)}" ${f.subcategoria.includes(s) ? "checked" : ""}> ${esc(s)}</label>`
        )
        .join("");
    } else {
      grpSub.hidden = true;
    }

    // espécie
    $("fEspecie").innerHTML = [
      ["", "Todos"],
      ["cachorro", "🐕 Cães"],
      ["gato", "🐈 Gatos"]
    ]
      .map(
        ([v, l]) => `<label class="filtros__check"><input type="radio" name="especie" value="${v}" ${f.especie === v ? "checked" : ""}> ${l}</label>`
      )
      .join("");

    // marcas
    $("fMarca").innerHTML = (facetas.marcas || [])
      .map(
        (m) => `<label class="filtros__check"><input type="checkbox" name="marca" value="${esc(m)}" ${f.marca.includes(m) ? "checked" : ""}> ${esc(m)}</label>`
      )
      .join("") || '<span style="font-size:.82rem;color:var(--ink-soft)">—</span>';

    $("fPrecoMin").value = f.precoMin;
    $("fPrecoMax").value = f.precoMax;
    $("fPromo").checked = f.promo;
    $("fAval").checked = f.avaliacaoMin === "4";
    $("ordenar").value = f.ordenar;
  }

  function renderChips(f) {
    const chips = [];
    if (f.busca) chips.push(["busca", `Busca: "${f.busca}"`]);
    if (f.categoria) chips.push(["categoria", CATS.find((c) => c.slug === f.categoria)?.nome || f.categoria]);
    f.subcategoria.forEach((s) => chips.push(["sub:" + s, s]));
    if (f.especie) chips.push(["especie", f.especie === "gato" ? "Gatos" : "Cães"]);
    f.marca.forEach((m) => chips.push(["marca:" + m, m]));
    if (f.precoMin || f.precoMax) chips.push(["preco", `R$ ${f.precoMin || 0}–${f.precoMax || "∞"}`]);
    if (f.promo) chips.push(["promo", "Em oferta"]);
    if (f.avaliacaoMin) chips.push(["aval", "4★+"]);

    $("chips").innerHTML = chips
      .map(([k, l]) => `<span class="chip">${esc(l)} <button data-chip="${esc(k)}" aria-label="Remover">×</button></span>`)
      .join("");
    $("chips").querySelectorAll("[data-chip]").forEach((b) => {
      b.addEventListener("click", () => removerChip(b.dataset.chip));
    });
  }

  function removerChip(k) {
    const f = lerFiltros();
    if (k === "busca") f.busca = "";
    else if (k === "categoria") { f.categoria = ""; f.subcategoria = []; }
    else if (k === "especie") f.especie = "";
    else if (k === "preco") { f.precoMin = ""; f.precoMax = ""; }
    else if (k === "promo") f.promo = false;
    else if (k === "aval") f.avaliacaoMin = "";
    else if (k.startsWith("sub:")) f.subcategoria = f.subcategoria.filter((s) => s !== k.slice(4));
    else if (k.startsWith("marca:")) f.marca = f.marca.filter((m) => m !== k.slice(6));
    f.pagina = 1;
    escreverURL(f);
    carregar();
  }

  function coletarDaSidebar() {
    const f = lerFiltros();
    f.categoria = document.querySelector('input[name="secao"]:checked')?.value || "";
    f.subcategoria = [...document.querySelectorAll('input[name="sub"]:checked')].map((i) => i.value);
    f.especie = document.querySelector('input[name="especie"]:checked')?.value || "";
    f.marca = [...document.querySelectorAll('input[name="marca"]:checked')].map((i) => i.value);
    f.precoMin = $("fPrecoMin").value;
    f.precoMax = $("fPrecoMax").value;
    f.promo = $("fPromo").checked;
    f.avaliacaoMin = $("fAval").checked ? "4" : "";
    f.ordenar = $("ordenar").value;
    f.pagina = 1;
    return f;
  }

  function renderPaginacao(f, paginas) {
    const el = $("paginacao");
    if (paginas <= 1) { el.innerHTML = ""; return; }
    const btns = [];
    btns.push(`<button ${f.pagina === 1 ? "disabled" : ""} data-pg="${f.pagina - 1}">‹</button>`);
    for (let p = 1; p <= paginas; p++) {
      if (p === 1 || p === paginas || Math.abs(p - f.pagina) <= 1) {
        btns.push(`<button class="${p === f.pagina ? "is-ativo" : ""}" data-pg="${p}">${p}</button>`);
      } else if (Math.abs(p - f.pagina) === 2) {
        btns.push(`<span style="align-self:center;padding:0 4px">…</span>`);
      }
    }
    btns.push(`<button ${f.pagina === paginas ? "disabled" : ""} data-pg="${f.pagina + 1}">›</button>`);
    el.innerHTML = btns.join("");
    el.querySelectorAll("[data-pg]").forEach((b) => {
      b.addEventListener("click", () => {
        const nf = lerFiltros();
        nf.pagina = Number(b.dataset.pg);
        escreverURL(nf);
        carregar();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  async function carregar() {
    const f = lerFiltros();
    const cat = CATS.find((c) => c.slug === f.categoria);
    document.title = (cat ? cat.nome : "Produtos") + " — Focinho Feliz";
    $("tituloCatalogo").textContent = f.busca ? `Resultados para "${f.busca}"` : cat ? cat.nome : "Todos os produtos";
    $("breadcrumb").innerHTML = `<a href="/">Início</a> · <a href="/produtos">Produtos</a>${cat ? " · " + esc(cat.nome) : ""}`;
    $("grade").innerHTML = '<p class="vazio">Carregando produtos…</p>';

    try {
      const dados = await FF.api("/products?" + apiQuery(f));
      let produtos = dados.produtos;
      // filtro client-side de múltiplas subcategorias
      if (f.subcategoria.length > 1) produtos = produtos.filter((p) => f.subcategoria.includes(p.subcategoria));

      renderSidebar(f, dados.facetas || {});
      renderChips(f);
      $("contagem").textContent = `${dados.total} produto${dados.total === 1 ? "" : "s"}`;
      FFUI.gradeProdutos($("grade"), produtos);
      renderPaginacao(f, dados.paginas);
    } catch (e) {
      $("grade").innerHTML = '<p class="vazio">Erro ao carregar os produtos.</p>';
    }
  }

  function wire() {
    $("fSecoes").addEventListener("change", () => {
      const f = coletarDaSidebar();
      f.subcategoria = [];
      escreverURL(f);
      carregar();
    });
    ["fSub", "fEspecie", "fMarca"].forEach((id) => {
      $(id).addEventListener("change", () => { escreverURL(coletarDaSidebar()); carregar(); });
    });
    $("aplicarFiltros").addEventListener("click", () => { escreverURL(coletarDaSidebar()); carregar(); fecharPainel(); });
    $("limparFiltros").addEventListener("click", () => {
      history.replaceState(null, "", location.pathname);
      [...params.keys()].forEach((k) => params.delete(k));
      carregar();
    });
    $("ordenar").addEventListener("change", () => {
      const f = lerFiltros();
      f.ordenar = $("ordenar").value;
      f.pagina = 1;
      escreverURL(f);
      carregar();
    });

    // painel mobile
    const filtros = $("filtros");
    const scrim = $("scrimFiltros");
    const abrir = () => { filtros.classList.add("is-aberto"); scrim.hidden = false; $("fecharFiltros").style.display = ""; document.body.classList.add("trava-scroll"); };
    var fecharPainel = () => { filtros.classList.remove("is-aberto"); scrim.hidden = true; document.body.classList.remove("trava-scroll"); };
    $("abrirFiltros").addEventListener("click", abrir);
    $("fecharFiltros").addEventListener("click", fecharPainel);
    scrim.addEventListener("click", fecharPainel);
    window.fecharPainel = fecharPainel;
  }

  async function init() {
    try {
      categorias = (await FF.api("/categories")).categorias || [];
    } catch (e) {}
    wire();
    carregar();
  }
  init();
})();
