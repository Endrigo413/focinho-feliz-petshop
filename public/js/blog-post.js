/* Blog — artigo + comentários (opiniões) */
(function () {
  "use strict";
  const esc = (s) => FF.escape(s);
  const slug = decodeURIComponent(location.pathname.replace(/^\/blog\//, "")) || FF.query("slug");
  let post = null;
  let nota = 0;

  function renderComentarios() {
    const logado = FF.estaLogado();
    const cs = post.comentarios || [];
    return `
    <section class="comentarios">
      <h2>Opiniões dos leitores (${cs.length})</h2>
      ${
        cs.length
          ? cs
              .map(
                (c) => `
        <div class="comentario">
          <div class="comentario__topo">
            <span class="comentario__nome">${esc(c.nome)}</span>
            <span class="comentario__data">${new Date(c.criadoEm).toLocaleDateString("pt-BR")}${c.nota ? " · " + "★".repeat(c.nota) : ""}</span>
          </div>
          <p style="margin:0">${esc(c.texto)}</p>
        </div>`
              )
              .join("")
          : '<p style="color:var(--ink-soft)">Seja o primeiro a comentar.</p>'
      }
      ${
        logado
          ? `
        <form class="form-comentario" id="formCmt">
          <p style="font-weight:700;margin:0 0 8px">Deixe sua opinião</p>
          <div class="nota-estrelas" id="notaEstrelas" role="radiogroup" aria-label="Sua nota">
            ${[1, 2, 3, 4, 5].map((n) => `<span data-n="${n}">★</span>`).join("")}
          </div>
          <label class="campo" style="margin-top:8px">Comentário
            <textarea name="texto" required placeholder="O que você achou deste artigo?"></textarea>
          </label>
          <button class="btn btn--primary" type="submit">Publicar</button>
          <p class="form-msg" id="msgCmt"></p>
        </form>`
          : `<div class="form-comentario"><p style="margin:0">Faça <a href="/conta/entrar?redirect=${encodeURIComponent(location.pathname)}">login</a> para deixar sua opinião.</p></div>`
      }
    </section>`;
  }

  function render() {
    document.title = post.titulo + " — Blog Focinho Feliz";
    document.getElementById("artigo").innerHTML = `
      <div class="artigo__capa" style="background:linear-gradient(135deg,${esc(post.cor)},${esc(post.cor)}bb)">${esc(post.emoji)}</div>
      <span class="blog-card__cat">${esc(post.categoria)}</span>
      <h1>${esc(post.titulo)}</h1>
      <p class="artigo__meta">Por ${esc(post.autor)} · ${new Date(post.publicadoEm).toLocaleDateString("pt-BR")}</p>
      <div class="artigo__corpo">${post.conteudo.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
      ${renderComentarios()}
      <p style="margin-top:32px"><a class="btn btn--suave" href="/blog">← Voltar para o blog</a></p>`;

    const estrelas = document.getElementById("notaEstrelas");
    if (estrelas) {
      estrelas.querySelectorAll("span").forEach((s) => {
        s.addEventListener("click", () => {
          nota = Number(s.dataset.n);
          estrelas.querySelectorAll("span").forEach((x) => x.classList.toggle("on", Number(x.dataset.n) <= nota));
        });
      });
    }
    const form = document.getElementById("formCmt");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const texto = form.texto.value.trim();
        const msg = document.getElementById("msgCmt");
        msg.textContent = "Enviando…";
        msg.className = "form-msg info";
        try {
          await FF.api(`/blog/${encodeURIComponent(post.slug)}/comentarios`, { method: "POST", body: { texto, nota: nota || undefined } });
          FF.toast("Opinião publicada!", "ok");
          await carregar();
        } catch (err) {
          msg.textContent = err.message;
          msg.className = "form-msg erro";
        }
      });
    }
  }

  async function carregar() {
    try {
      post = await FF.api("/blog/" + encodeURIComponent(slug));
      render();
    } catch (e) {
      document.getElementById("artigo").innerHTML = '<div class="vazio"><div class="vazio__emoji">📰</div><p>Post não encontrado.</p><a class="btn btn--primary" href="/blog">Ver o blog</a></div>';
    }
  }
  carregar();
  document.addEventListener("ff:sessao", () => { if (post) render(); });
})();
