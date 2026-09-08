/* Painel administrativo */
(function () {
  "use strict";
  const esc = (s) => FF.escape(s);
  const $ = (id) => document.getElementById(id);
  const conteudo = $("adminConteudo");

  const CATS = [
    { slug: "racao", nome: "Ração" }, { slug: "petisco", nome: "Petiscos" },
    { slug: "higiene", nome: "Higiene & Beleza" }, { slug: "brinquedo", nome: "Brinquedos" },
    { slug: "acessorio", nome: "Acessórios" }, { slug: "saude", nome: "Farmácia" },
    { slug: "jardinagem", nome: "Jardinagem" }, { slug: "aquarismo", nome: "Aquarismo" }
  ];
  let categorias = [];

  /* --------------------------- modal --------------------------- */
  function modal(titulo, corpoHtml, aoAbrir) {
    const host = $("modalHost");
    host.innerHTML = `
    <div class="modal-scrim" id="mScrim">
      <div class="modal-box">
        <div class="modal-box__head"><h2>${esc(titulo)}</h2><button class="modal-box__fechar" id="mFechar">✕</button></div>
        <div id="mCorpo">${corpoHtml}</div>
      </div>
    </div>`;
    const fechar = () => (host.innerHTML = "");
    $("mFechar").onclick = fechar;
    $("mScrim").onclick = (e) => { if (e.target.id === "mScrim") fechar(); };
    if (aoAbrir) aoAbrir(fechar);
    return fechar;
  }

  /* --------------------------- abas --------------------------- */
  const ABAS = { visao: renderVisao, produtos: renderProdutos, pedidos: renderPedidos, agenda: renderAgenda, blog: renderBlog, banners: renderBanners };

  function irAba(nome) {
    if (!ABAS[nome]) nome = "visao";
    document.querySelectorAll("#adminNav button").forEach((b) => b.classList.toggle("is-ativo", b.dataset.aba === nome));
    history.replaceState(null, "", "#" + nome);
    conteudo.innerHTML = '<p class="vazio">Carregando…</p>';
    ABAS[nome]();
  }

  /* ===================== VISÃO GERAL ===================== */
  async function renderVisao() {
    const o = await FF.api("/admin/overview");
    const cards = [
      ["Produtos ativos", o.produtos.ativos],
      ["Em promoção", o.produtos.emPromocao],
      ["Sem estoque", o.produtos.semEstoque],
      ["Pedidos", o.pedidos.total],
      ["Aguardando pagamento", o.pedidos.aguardandoPagamento],
      ["Receita", FF.dinheiro(o.pedidos.receita)],
      ["Clientes", o.clientes],
      ["Comentários no blog", o.comentariosBlog]
    ];
    conteudo.innerHTML = `
    <div class="admin__head"><h1>Visão geral</h1></div>
    <div class="stat-grade">
      ${cards.map(([l, n]) => `<div class="stat-card"><div class="stat-card__n">${esc(n)}</div><div class="stat-card__l">${esc(l)}</div></div>`).join("")}
    </div>
    <h3>Produtos por seção</h3>
    <div class="stat-grade">
      ${CATS.map((c) => `<div class="stat-card"><div class="stat-card__n">${o.produtos.porCategoria[c.slug] || 0}</div><div class="stat-card__l">${esc(c.nome)}</div></div>`).join("")}
    </div>
    <h3 style="margin-top:24px">Últimos pedidos</h3>
    <div class="tabela-wrap"><table class="tabela">
      <thead><tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Status</th><th>Data</th></tr></thead>
      <tbody>${o.ultimosPedidos
        .map((p) => `<tr><td>${esc(p.id)}</td><td>${esc(p.cliente || "-")}</td><td>${FF.dinheiro(p.total)}</td><td><span class="status status--${FF.slug(p.status)}">${esc(p.status)}</span></td><td>${new Date(p.criadoEm).toLocaleDateString("pt-BR")}</td></tr>`)
        .join("") || '<tr><td colspan="5">Nenhum pedido ainda.</td></tr>'}</tbody>
    </table></div>`;
  }

  /* ===================== PRODUTOS ===================== */
  let filtroProd = { categoria: "", busca: "" };

  async function renderProdutos() {
    conteudo.innerHTML = `
    <div class="admin__head">
      <h1>Produtos</h1>
      <button class="btn btn--primary" id="novoProd">＋ Novo produto</button>
    </div>
    <div class="admin__barra">
      <select id="fpCat"><option value="">Todas as seções</option>${CATS.map((c) => `<option value="${c.slug}">${esc(c.nome)}</option>`).join("")}</select>
      <input id="fpBusca" placeholder="Buscar por nome ou marca…" />
      <button class="btn btn--suave btn--pequeno" id="fpAplicar">Filtrar</button>
      <span style="color:var(--ink-soft);font-size:.85rem" id="fpContagem"></span>
    </div>
    <div class="tabela-wrap" id="tabelaProd"><p class="vazio">Carregando…</p></div>`;

    $("fpCat").value = filtroProd.categoria;
    $("fpBusca").value = filtroProd.busca;
    $("novoProd").onclick = () => formProduto(null);
    $("fpAplicar").onclick = () => {
      filtroProd = { categoria: $("fpCat").value, busca: $("fpBusca").value };
      carregarProdutos();
    };
    $("fpBusca").addEventListener("keydown", (e) => { if (e.key === "Enter") $("fpAplicar").click(); });
    carregarProdutos();
  }

  async function carregarProdutos() {
    const q = new URLSearchParams({ incluirInativos: "1", porPagina: "120", ordenar: "nome" });
    if (filtroProd.categoria) q.set("categoria", filtroProd.categoria);
    if (filtroProd.busca) q.set("busca", filtroProd.busca);
    const dados = await FF.api("/products?" + q);
    $("fpContagem").textContent = dados.total + " produto(s)";
    $("tabelaProd").innerHTML = `<table class="tabela">
      <thead><tr><th></th><th>Nome</th><th>Seção</th><th>Marca</th><th>Preço</th><th>Estoque</th><th>Status</th><th></th></tr></thead>
      <tbody>${dados.produtos
        .map(
          (p) => `<tr>
        <td style="font-size:1.4rem">${esc(p.emoji || "🐾")}</td>
        <td><strong>${esc(p.nome)}</strong><br><span style="color:var(--ink-soft);font-size:.8rem">${esc(p.subcategoria || "")}</span></td>
        <td>${esc((CATS.find((c) => c.slug === p.categoria) || {}).nome || p.categoria)}</td>
        <td>${esc(p.marca || "")}</td>
        <td>${p.precoPromocional != null ? `<s style="color:var(--ink-soft)">${FF.dinheiro(p.preco)}</s> ${FF.dinheiro(p.precoPromocional)}` : FF.dinheiro(p.preco)}</td>
        <td>${p.estoque}</td>
        <td>${p.ativo === false ? '<span class="pill pill--esgotado">inativo</span>' : '<span class="pill pill--ok">ativo</span>'}</td>
        <td class="acoes">
          <button class="btn-icone" data-editar="${esc(p.id)}">✏️</button>
          ${p.ativo === false
            ? `<button class="btn-icone" data-reativar="${esc(p.id)}">↩︎</button>`
            : `<button class="btn-icone btn-icone--perigo" data-remover="${esc(p.id)}">🗑</button>`}
        </td>
      </tr>`
        )
        .join("")}</tbody></table>`;

    const mapa = {};
    dados.produtos.forEach((p) => (mapa[p.id] = p));
    $("tabelaProd").querySelectorAll("[data-editar]").forEach((b) => (b.onclick = () => formProduto(mapa[b.dataset.editar])));
    $("tabelaProd").querySelectorAll("[data-remover]").forEach((b) => (b.onclick = async () => {
      if (!confirm("Desativar este produto? Ele sai do catálogo, mas o histórico é preservado.")) return;
      await FF.api("/products/" + b.dataset.remover, { method: "DELETE" });
      FF.toast("Produto desativado", "ok");
      carregarProdutos();
    }));
    $("tabelaProd").querySelectorAll("[data-reativar]").forEach((b) => (b.onclick = async () => {
      await FF.api("/products/" + b.dataset.reativar + "/reativar", { method: "POST" });
      FF.toast("Produto reativado", "ok");
      carregarProdutos();
    }));
  }

  function formProduto(p) {
    const ed = !!p;
    const cat = p ? p.categoria : "racao";
    const secao = categorias.find((c) => c.slug === cat);
    const subs = (secao && secao.subcategorias) || [];
    modal(ed ? "Editar produto" : "Novo produto", `
      <form id="formP" style="display:grid;gap:10px">
        <label class="campo">Nome<input name="nome" value="${p ? esc(p.nome) : ""}" required></label>
        <div class="campo-linha">
          <label class="campo">Seção
            <select name="categoria" id="pCat">${CATS.map((c) => `<option value="${c.slug}" ${cat === c.slug ? "selected" : ""}>${esc(c.nome)}</option>`).join("")}</select>
          </label>
          <label class="campo">Tipo (subcategoria)
            <input name="subcategoria" id="pSub" list="pSubList" value="${p ? esc(p.subcategoria || "") : subs[0] || ""}">
            <datalist id="pSubList">${subs.map((s) => `<option value="${esc(s)}">`).join("")}</datalist>
          </label>
        </div>
        <div class="campo-linha">
          <label class="campo">Marca<input name="marca" value="${p ? esc(p.marca || "") : ""}"></label>
          <label class="campo">Para
            <select name="especie">
              ${["todos", "cachorro", "gato", "peixe"].map((e) => `<option value="${e}" ${p && p.especie === e ? "selected" : ""}>${e === "todos" ? "Todos" : e[0].toUpperCase() + e.slice(1)}</option>`).join("")}
            </select>
          </label>
        </div>
        <div class="campo-linha">
          <label class="campo">Preço (R$)<input name="preco" type="number" step="0.01" min="0" value="${p ? p.preco : ""}" required></label>
          <label class="campo">Preço promocional (opcional)<input name="precoPromocional" type="number" step="0.01" min="0" value="${p && p.precoPromocional != null ? p.precoPromocional : ""}"></label>
        </div>
        <div class="campo-linha">
          <label class="campo">Estoque<input name="estoque" type="number" min="0" value="${p ? p.estoque : "0"}" required></label>
          <label class="campo">Emoji / ícone<input name="emoji" maxlength="4" value="${p ? esc(p.emoji || "") : ""}" placeholder="🐾"></label>
        </div>
        <label class="campo">Descrição<textarea name="descricao">${p ? esc(p.descricao || "") : ""}</textarea></label>
        <label class="campo">Tags (separadas por vírgula)<input name="tags" value="${p && p.tags ? esc(p.tags.join(", ")) : ""}"></label>
        <label class="filtros__check"><input type="checkbox" name="destaque" ${p && p.destaque ? "checked" : ""}> Produto em destaque</label>
        <button class="btn btn--primary btn--bloco" type="submit">${ed ? "Salvar alterações" : "Cadastrar produto"}</button>
        <p class="form-msg" id="mMsg"></p>
      </form>
    `, (fechar) => {
      $("pCat").addEventListener("change", () => {
        const s = categorias.find((c) => c.slug === $("pCat").value);
        const lista = (s && s.subcategorias) || [];
        $("pSubList").innerHTML = lista.map((x) => `<option value="${esc(x)}">`).join("");
        $("pSub").value = lista[0] || "";
      });
      $("formP").addEventListener("submit", async (e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(e.target).entries());
        d.destaque = e.target.destaque.checked;
        d.preco = Number(d.preco);
        d.estoque = Number(d.estoque);
        d.precoPromocional = d.precoPromocional === "" ? null : Number(d.precoPromocional);
        const m = $("mMsg");
        m.textContent = "Salvando…";
        m.className = "form-msg info";
        try {
          if (ed) await FF.api("/products/" + p.id, { method: "PUT", body: d });
          else await FF.api("/products", { method: "POST", body: d });
          FF.toast(ed ? "Produto atualizado" : "Produto cadastrado", "ok");
          fechar();
          carregarProdutos();
        } catch (err) {
          m.textContent = err.message;
          m.className = "form-msg erro";
        }
      });
    });
  }

  /* ===================== PEDIDOS ===================== */
  async function renderPedidos() {
    const dados = await FF.api("/admin/orders");
    conteudo.innerHTML = `
    <div class="admin__head"><h1>Pedidos (${dados.total})</h1></div>
    <div class="tabela-wrap"><table class="tabela">
      <thead><tr><th>Pedido</th><th>Cliente</th><th>Itens</th><th>Total</th><th>Pagto</th><th>Status</th><th>Data</th></tr></thead>
      <tbody>${dados.pedidos
        .map(
          (p) => `<tr>
        <td>${esc(p.id)}</td>
        <td>${esc((p.cliente && p.cliente.nome) || "-")}<br><span style="color:var(--ink-soft);font-size:.78rem">${esc((p.cliente && p.cliente.telefone) || "")}</span></td>
        <td>${p.itens.reduce((s, i) => s + i.quantidade, 0)} un.</td>
        <td>${FF.dinheiro(p.total)}</td>
        <td>${esc(p.formaPagamento || "-")} · ${esc((p.pagamento && p.pagamento.status) || "-")}</td>
        <td>
          <select data-status="${esc(p.id)}" class="ordenar-sel" style="font-size:.78rem;padding:4px 6px">
            ${dados.statusPossiveis.map((s) => `<option ${p.status === s ? "selected" : ""}>${esc(s)}</option>`).join("")}
          </select>
        </td>
        <td>${new Date(p.criadoEm).toLocaleDateString("pt-BR")}</td>
      </tr>`
        )
        .join("") || '<tr><td colspan="7">Nenhum pedido.</td></tr>'}</tbody>
    </table></div>`;

    conteudo.querySelectorAll("[data-status]").forEach((sel) => {
      sel.addEventListener("change", async () => {
        try {
          await FF.api("/admin/orders/" + sel.dataset.status + "/status", { method: "PATCH", body: { status: sel.value } });
          FF.toast("Status atualizado", "ok");
        } catch (err) {
          FF.toast(err.message, "erro");
        }
      });
    });
  }

  /* ===================== AGENDAMENTOS ===================== */
  async function renderAgenda() {
    const dados = await FF.api("/admin/appointments");
    conteudo.innerHTML = `
    <div class="admin__head"><h1>Agendamentos (${dados.total})</h1></div>
    <div class="tabela-wrap"><table class="tabela">
      <thead><tr><th>ID</th><th>Cliente</th><th>Pet</th><th>Serviço</th><th>Data</th><th>Horário</th><th>Status</th></tr></thead>
      <tbody>${dados.agendamentos
        .map(
          (a) => `<tr><td>${esc(a.id)}</td><td>${esc(a.cliente.nome)}<br><span style="color:var(--ink-soft);font-size:.78rem">${esc(a.cliente.telefone)}</span></td>
          <td>${esc(a.pet.nome)} (${esc(a.pet.especie)})</td><td>${esc(a.servico.nome)}</td>
          <td>${esc(a.data)}</td><td>${esc(a.horario)}</td><td>${esc(a.status)}</td></tr>`
        )
        .join("") || '<tr><td colspan="7">Nenhum agendamento.</td></tr>'}</tbody>
    </table></div>`;
  }

  /* ===================== BLOG ===================== */
  async function renderBlog() {
    const [{ posts }, { comentarios }] = await Promise.all([FF.api("/blog"), FF.api("/blog/comentarios")]);
    conteudo.innerHTML = `
    <div class="admin__head"><h1>Blog</h1><button class="btn btn--primary" id="novoPost">＋ Novo post</button></div>
    <div class="tabela-wrap"><table class="tabela">
      <thead><tr><th></th><th>Título</th><th>Categoria</th><th>Publicado</th><th>Comentários</th><th></th></tr></thead>
      <tbody>${posts
        .map(
          (p) => `<tr><td style="font-size:1.3rem">${esc(p.emoji)}</td><td><strong>${esc(p.titulo)}</strong></td><td>${esc(p.categoria)}</td>
          <td>${new Date(p.publicadoEm).toLocaleDateString("pt-BR")}</td><td>${p.totalComentarios}</td>
          <td class="acoes"><a class="btn-icone" href="/blog/${esc(p.slug)}" target="_blank">👁</a>
          <button class="btn-icone" data-editpost="${esc(p.slug)}">✏️</button>
          <button class="btn-icone btn-icone--perigo" data-delpost="${esc(p.id)}">🗑</button></td></tr>`
        )
        .join("")}</tbody>
    </table></div>

    <h3 style="margin-top:28px">Moderação de comentários (${comentarios.length})</h3>
    <div class="tabela-wrap"><table class="tabela">
      <thead><tr><th>Post</th><th>Autor</th><th>Comentário</th><th>Nota</th><th>Data</th><th></th></tr></thead>
      <tbody>${comentarios
        .map(
          (c) => `<tr><td>${esc(c.postTitulo)}</td><td>${esc(c.nome)}</td><td>${esc(c.texto)}</td><td>${c.nota ? "★".repeat(c.nota) : "-"}</td>
          <td>${new Date(c.criadoEm).toLocaleDateString("pt-BR")}</td>
          <td><button class="btn-icone btn-icone--perigo" data-delcmt="${esc(c.id)}">Excluir</button></td></tr>`
        )
        .join("") || '<tr><td colspan="6">Nenhum comentário.</td></tr>'}</tbody>
    </table></div>`;

    const postMap = {};
    posts.forEach((p) => (postMap[p.slug] = p));
    $("novoPost").onclick = () => formPost(null);
    conteudo.querySelectorAll("[data-editpost]").forEach((b) => (b.onclick = async () => {
      const full = await FF.api("/blog/" + b.dataset.editpost);
      formPost(full);
    }));
    conteudo.querySelectorAll("[data-delpost]").forEach((b) => (b.onclick = async () => {
      if (!confirm("Excluir este post e seus comentários?")) return;
      await FF.api("/blog/" + b.dataset.delpost, { method: "DELETE" });
      FF.toast("Post excluído", "ok");
      renderBlog();
    }));
    conteudo.querySelectorAll("[data-delcmt]").forEach((b) => (b.onclick = async () => {
      await FF.api("/blog/comentarios/" + b.dataset.delcmt, { method: "DELETE" });
      FF.toast("Comentário excluído", "ok");
      renderBlog();
    }));
  }

  function formPost(p) {
    const ed = !!p;
    modal(ed ? "Editar post" : "Novo post", `
      <form id="formPost" style="display:grid;gap:10px">
        <label class="campo">Título<input name="titulo" value="${p ? esc(p.titulo) : ""}" required></label>
        <div class="campo-linha">
          <label class="campo">Categoria<input name="categoria" value="${p ? esc(p.categoria) : "Dicas"}"></label>
          <label class="campo">Emoji<input name="emoji" maxlength="4" value="${p ? esc(p.emoji) : "📝"}"></label>
        </div>
        <label class="campo">Autor<input name="autor" value="${p ? esc(p.autor) : "Equipe Focinho Feliz"}"></label>
        <label class="campo">Resumo<input name="resumo" value="${p ? esc(p.resumo) : ""}"></label>
        <label class="campo">Conteúdo (um parágrafo por linha em branco)
          <textarea name="conteudo" rows="8">${p ? esc((p.conteudo || []).join("\n\n")) : ""}</textarea>
        </label>
        <button class="btn btn--primary btn--bloco" type="submit">${ed ? "Salvar" : "Publicar"}</button>
        <p class="form-msg" id="pMsg"></p>
      </form>
    `, (fechar) => {
      $("formPost").addEventListener("submit", async (e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(e.target).entries());
        const m = $("pMsg");
        m.textContent = "Salvando…";
        m.className = "form-msg info";
        try {
          if (ed) await FF.api("/blog/" + p.id, { method: "PUT", body: d });
          else await FF.api("/blog", { method: "POST", body: d });
          FF.toast("Post salvo", "ok");
          fechar();
          renderBlog();
        } catch (err) {
          m.textContent = err.message;
          m.className = "form-msg erro";
        }
      });
    });
  }

  /* ===================== BANNERS / PROMOÇÕES ===================== */
  async function renderBanners() {
    const { banners, promocoes } = await FF.api("/banners/admin");
    conteudo.innerHTML = `
    <div class="admin__head"><h1>Banners &amp; Promoções</h1></div>

    <h3>Banners da home <button class="btn btn--suave btn--pequeno" id="novoBan">＋ Novo</button></h3>
    <div class="tabela-wrap"><table class="tabela">
      <thead><tr><th>Título</th><th>CTA</th><th>Link</th><th>Ativo</th><th></th></tr></thead>
      <tbody>${banners
        .map(
          (b) => `<tr><td><span style="font-size:1.2rem">${esc(b.emoji || "")}</span> ${esc(b.titulo)}</td><td>${esc(b.ctaLabel || "")}</td><td>${esc(b.ctaLink || "")}</td>
          <td>${b.ativo === false ? "não" : "sim"}</td>
          <td class="acoes"><button class="btn-icone" data-editban="${esc(b.id)}">✏️</button><button class="btn-icone btn-icone--perigo" data-delban="${esc(b.id)}">🗑</button></td></tr>`
        )
        .join("")}</tbody>
    </table></div>

    <h3 style="margin-top:24px">Cards de promoção <button class="btn btn--suave btn--pequeno" id="novoPromo">＋ Novo</button></h3>
    <div class="tabela-wrap"><table class="tabela">
      <thead><tr><th>Selo</th><th>Título</th><th>Link</th><th></th></tr></thead>
      <tbody>${promocoes
        .map(
          (p) => `<tr><td>${esc(p.selo || "")}</td><td>${esc(p.emoji || "")} ${esc(p.titulo)}</td><td>${esc(p.link || "")}</td>
          <td class="acoes"><button class="btn-icone" data-editpromo="${esc(p.id)}">✏️</button><button class="btn-icone btn-icone--perigo" data-delpromo="${esc(p.id)}">🗑</button></td></tr>`
        )
        .join("")}</tbody>
    </table></div>`;

    const bm = {}, pm = {};
    banners.forEach((b) => (bm[b.id] = b));
    promocoes.forEach((p) => (pm[p.id] = p));
    $("novoBan").onclick = () => formBanner(null);
    $("novoPromo").onclick = () => formPromo(null);
    conteudo.querySelectorAll("[data-editban]").forEach((b) => (b.onclick = () => formBanner(bm[b.dataset.editban])));
    conteudo.querySelectorAll("[data-editpromo]").forEach((b) => (b.onclick = () => formPromo(pm[b.dataset.editpromo])));
    conteudo.querySelectorAll("[data-delban]").forEach((b) => (b.onclick = async () => { await FF.api("/banners/banner/" + b.dataset.delban, { method: "DELETE" }); renderBanners(); }));
    conteudo.querySelectorAll("[data-delpromo]").forEach((b) => (b.onclick = async () => { await FF.api("/banners/promocao/" + b.dataset.delpromo, { method: "DELETE" }); renderBanners(); }));
  }

  function formBanner(b) {
    modal(b ? "Editar banner" : "Novo banner", `
      <form id="fBan" style="display:grid;gap:10px">
        <label class="campo">Título<input name="titulo" value="${b ? esc(b.titulo) : ""}" required></label>
        <label class="campo">Subtítulo<input name="subtitulo" value="${b ? esc(b.subtitulo || "") : ""}"></label>
        <div class="campo-linha">
          <label class="campo">Texto do botão<input name="ctaLabel" value="${b ? esc(b.ctaLabel || "") : ""}"></label>
          <label class="campo">Link<input name="ctaLink" value="${b ? esc(b.ctaLink || "/produtos") : "/produtos"}"></label>
        </div>
        <div class="campo-linha">
          <label class="campo">Emoji<input name="emoji" maxlength="4" value="${b ? esc(b.emoji || "") : "🐾"}"></label>
          <label class="campo">Cor (hex)<input name="cor" value="${b ? esc(b.cor || "#1F4B43") : "#1F4B43"}"></label>
        </div>
        <label class="campo">Cor final do degradê<input name="corFim" value="${b ? esc(b.corFim || "#2E6B5E") : "#2E6B5E"}"></label>
        <label class="filtros__check"><input type="checkbox" name="ativo" ${!b || b.ativo !== false ? "checked" : ""}> Ativo</label>
        <button class="btn btn--primary btn--bloco" type="submit">Salvar</button>
      </form>
    `, (fechar) => {
      $("fBan").addEventListener("submit", async (e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(e.target).entries());
        d.ativo = e.target.ativo.checked;
        d.tipo = "hero";
        try {
          if (b) await FF.api("/banners/banner/" + b.id, { method: "PUT", body: d });
          else await FF.api("/banners/banner", { method: "POST", body: d });
          FF.toast("Banner salvo", "ok");
          fechar();
          renderBanners();
        } catch (err) { FF.toast(err.message, "erro"); }
      });
    });
  }

  function formPromo(p) {
    modal(p ? "Editar promoção" : "Nova promoção", `
      <form id="fPromo" style="display:grid;gap:10px">
        <div class="campo-linha">
          <label class="campo">Selo<input name="selo" value="${p ? esc(p.selo || "") : "-10%"}"></label>
          <label class="campo">Emoji<input name="emoji" maxlength="4" value="${p ? esc(p.emoji || "") : "🏷️"}"></label>
        </div>
        <label class="campo">Título<input name="titulo" value="${p ? esc(p.titulo) : ""}" required></label>
        <label class="campo">Descrição<input name="descricao" value="${p ? esc(p.descricao || "") : ""}"></label>
        <label class="campo">Link<input name="link" value="${p ? esc(p.link || "/produtos") : "/produtos"}"></label>
        <label class="filtros__check"><input type="checkbox" name="ativo" ${!p || p.ativo !== false ? "checked" : ""}> Ativo</label>
        <button class="btn btn--primary btn--bloco" type="submit">Salvar</button>
      </form>
    `, (fechar) => {
      $("fPromo").addEventListener("submit", async (e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(e.target).entries());
        d.ativo = e.target.ativo.checked;
        try {
          if (p) await FF.api("/banners/promocao/" + p.id, { method: "PUT", body: d });
          else await FF.api("/banners/promocao", { method: "POST", body: d });
          FF.toast("Promoção salva", "ok");
          fechar();
          renderBanners();
        } catch (err) { FF.toast(err.message, "erro"); }
      });
    });
  }

  /* --------------------------- init --------------------------- */
  async function init() {
    if (!FF.token) {
      location.href = "/conta/entrar?redirect=/admin";
      return;
    }
    try {
      const perfil = await FF.api("/users/profile");
      if (perfil.papel !== "admin") {
        conteudo.innerHTML = '<div class="vazio"><div class="vazio__emoji">🔒</div><p>Acesso restrito a administradores.</p><a class="btn btn--primary" href="/">Voltar à loja</a></div>';
        return;
      }
    } catch (e) {
      location.href = "/conta/entrar?redirect=/admin";
      return;
    }

    try {
      categorias = (await FF.api("/categories")).categorias || [];
    } catch (e) {}

    document.querySelectorAll("#adminNav button").forEach((b) => b.addEventListener("click", () => irAba(b.dataset.aba)));
    $("adminSair").addEventListener("click", (e) => { e.preventDefault(); FF.limparSessao(); location.href = "/"; });
    irAba(location.hash.replace("#", "") || "visao");
  }

  init().catch((e) => {
    conteudo.innerHTML = '<p class="vazio">Erro: ' + esc(e.message) + "</p>";
  });
})();
