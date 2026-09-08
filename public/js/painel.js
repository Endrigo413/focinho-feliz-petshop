/* Painel do cliente */
(function () {
  "use strict";
  const esc = (s) => FF.escape(s);
  if (!FF.exigirLogin()) return;

  let perfil = null;

  function abrirAba(nome) {
    document.querySelectorAll(".painel__nav button[data-aba]").forEach((b) => b.classList.toggle("is-ativo", b.dataset.aba === nome));
    document.getElementById("abaPedidos").hidden = nome !== "pedidos";
    document.getElementById("abaDados").hidden = nome !== "dados";
    if (location.hash.replace("#", "") !== nome) history.replaceState(null, "", "#" + nome);
  }

  async function carregarPedidos() {
    const el = document.getElementById("abaPedidos");
    try {
      const { pedidos } = await FF.api("/orders");
      if (!pedidos.length) {
        el.innerHTML = '<div class="vazio"><div class="vazio__emoji">🛍️</div><p>Você ainda não fez pedidos.</p><a class="btn btn--primary" href="/produtos">Começar a comprar</a></div>';
        return;
      }
      el.innerHTML = pedidos
        .map((p) => {
          const st = FF.slug(p.status);
          return `
        <div class="pedido-card">
          <div class="pedido-card__topo">
            <span class="pedido-card__id">${esc(p.id)}</span>
            <span class="status status--${st}">${esc(p.status)}</span>
          </div>
          <div class="pedido-card__itens">${new Date(p.criadoEm).toLocaleDateString("pt-BR")} · ${p.itens.map((i) => `${i.quantidade}× ${esc(i.nome)}`).join(" · ")}</div>
          ${p.rastreamento ? `<div class="pedido-card__itens">📦 Rastreio: ${esc(p.rastreamento.codigo)} (${esc(p.rastreamento.transportadora)})</div>` : ""}
          ${
            p.pagamento && p.pagamento.pix && p.status === "aguardando pagamento"
              ? `<div class="pedido-card__itens">💠 Pix copia-e-cola: <code style="word-break:break-all">${esc(p.pagamento.pix.copiaECola)}</code></div>`
              : ""
          }
          <div class="pedido-card__pe"><span>Total</span><span>${FF.dinheiro(p.total)}</span></div>
        </div>`;
        })
        .join("");
    } catch (e) {
      el.innerHTML = '<p class="vazio">Erro ao carregar pedidos.</p>';
    }
  }

  function renderDados() {
    const el = document.getElementById("abaDados");
    const ends = perfil.enderecos || [];
    el.innerHTML = `
      <div class="form-card form-card--largo" style="margin:0 0 20px">
        <h3>Seus dados</h3>
        <form id="formDados">
          <label class="campo">Nome<input name="nome" value="${esc(perfil.nome || "")}" required /></label>
          <label class="campo">Telefone<input name="telefone" value="${esc(perfil.telefone || "")}" placeholder="(12) 90000-0000" /></label>
          <p class="form-card__sub" style="margin:0">E-mail: ${esc(perfil.email)}</p>
          <button class="btn btn--primary" type="submit" style="margin-top:12px">Salvar dados</button>
          <p class="form-msg" id="msgDados"></p>
        </form>
      </div>

      <div class="form-card form-card--largo" style="margin:0">
        <h3>Endereços de entrega</h3>
        <div id="listaEnd">${ends.map(endCard).join("") || '<p style="color:var(--ink-soft)">Nenhum endereço cadastrado.</p>'}</div>
        <form id="formEnd" style="margin-top:14px">
          <div class="campo-linha">
            <label class="campo">Apelido<input name="apelido" placeholder="Casa, Trabalho…" /></label>
            <label class="campo">CEP<input name="cep" placeholder="12010-000" /></label>
          </div>
          <div class="campo-linha">
            <label class="campo">Logradouro<input name="logradouro" /></label>
            <label class="campo">Número<input name="numero" /></label>
          </div>
          <div class="campo-linha">
            <label class="campo">Bairro<input name="bairro" /></label>
            <label class="campo">Cidade<input name="cidade" value="Taubaté" /></label>
          </div>
          <label class="campo">UF<input name="uf" value="SP" maxlength="2" style="max-width:80px" /></label>
          <button class="btn btn--linha" type="submit">Adicionar endereço</button>
          <p class="form-msg" id="msgEnd"></p>
        </form>
      </div>`;

    document.getElementById("formDados").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      const m = document.getElementById("msgDados");
      m.textContent = "Salvando…";
      m.className = "form-msg info";
      try {
        perfil = await FF.api("/users/profile", { method: "PUT", body: { nome: f.nome.value, telefone: f.telefone.value } });
        FF.revalidar();
        m.textContent = "Dados salvos.";
        m.className = "form-msg ok";
      } catch (err) {
        m.textContent = err.message;
        m.className = "form-msg erro";
      }
    });

    document.getElementById("formEnd").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      const novo = Object.fromEntries(new FormData(f).entries());
      const m = document.getElementById("msgEnd");
      m.textContent = "Salvando…";
      m.className = "form-msg info";
      try {
        perfil = await FF.api("/users/profile", { method: "PUT", body: { enderecos: [...(perfil.enderecos || []), novo] } });
        renderDados();
      } catch (err) {
        m.textContent = err.message;
        m.className = "form-msg erro";
      }
    });

    el.querySelectorAll("[data-rem-end]").forEach((b) => {
      b.addEventListener("click", async () => {
        const i = Number(b.dataset.remEnd);
        perfil = await FF.api("/users/profile", { method: "PUT", body: { enderecos: (perfil.enderecos || []).filter((_, k) => k !== i) } });
        renderDados();
      });
    });
  }

  function endCard(e, i) {
    return `<div class="end-card">
      <strong>${esc(e.apelido || "Endereço")}</strong> — ${esc(e.logradouro || "")}, ${esc(e.numero || "s/n")}
      · ${esc(e.bairro || "")}, ${esc(e.cidade || "")}/${esc(e.uf || "")} · CEP ${esc(e.cep || "")}
      <button class="carrinho__remover" data-rem-end="${i}" style="margin-left:8px">remover</button>
    </div>`;
  }

  async function init() {
    try {
      perfil = await FF.api("/users/profile");
    } catch (e) {
      return;
    }
    document.getElementById("ola").textContent = "Olá, " + (perfil.nome.split(" ")[0] || "cliente");
    if (perfil.papel === "admin") document.getElementById("linkAdmin").style.display = "block";

    document.querySelectorAll(".painel__nav button[data-aba]").forEach((b) => b.addEventListener("click", () => abrirAba(b.dataset.aba)));
    document.getElementById("sair").addEventListener("click", () => { FF.limparSessao(); location.href = "/"; });

    carregarPedidos();
    renderDados();
    abrirAba(location.hash.replace("#", "") === "dados" ? "dados" : "pedidos");
  }
  init();
})();
