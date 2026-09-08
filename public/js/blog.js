/* Blog — lista */
(function () {
  "use strict";
  const esc = (s) => FF.escape(s);
  let dados = null;
  let filtro = "";

  function render() {
    document.getElementById("filtroBlog").innerHTML =
      `<button class="chip" data-cat="">Todos</button>` +
      dados.categorias.map((c) => `<button class="chip" data-cat="${esc(c)}">${esc(c)}</button>`).join("");
    document.querySelectorAll("#filtroBlog [data-cat]").forEach((b) => {
      if (b.dataset.cat === filtro) { b.style.background = "var(--teal)"; b.style.color = "#fff"; }
      b.addEventListener("click", () => { filtro = b.dataset.cat; render(); });
    });

    const posts = filtro ? dados.posts.filter((p) => p.categoria === filtro) : dados.posts;
    document.getElementById("grade").innerHTML = posts
      .map(
        (p) => `
      <a class="blog-card" href="/blog/${esc(p.slug)}">
        <div class="blog-card__capa" style="background:${esc(p.cor)}22">${esc(p.emoji)}</div>
        <div class="blog-card__corpo">
          <span class="blog-card__cat">${esc(p.categoria)}</span>
          <h3 class="blog-card__titulo">${esc(p.titulo)}</h3>
          <p class="blog-card__resumo">${esc(p.resumo)}</p>
          <span class="blog-card__meta">${esc(p.autor)} · ${new Date(p.publicadoEm).toLocaleDateString("pt-BR")} · 💬 ${p.totalComentarios}</span>
        </div>
      </a>`
      )
      .join("");
  }

  async function init() {
    try {
      dados = await FF.api("/blog");
      render();
    } catch (e) {
      document.getElementById("grade").innerHTML = '<p class="vazio">Não foi possível carregar o blog.</p>';
    }
  }
  init();
})();
