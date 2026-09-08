/* =========================================================
   Focinho Feliz — autenticação no front-end
   Cadastro, login, confirmação por código e redefinição de senha.
   Expõe window.FFAuth para o main.js.
   ========================================================= */
(function () {
  "use strict";

  const STORAGE_KEY = "focinhofeliz_auth";

  const state = {
    token: null,
    usuario: null,
    alvoEmail: null, // e-mail em fluxo de confirmação/redefinição
    acaoPendente: null // callback a rodar após o login
  };

  /* ---------------------------- storage ---------------------------- */
  function carregar() {
    try {
      const bruto = localStorage.getItem(STORAGE_KEY);
      if (!bruto) return;
      const dados = JSON.parse(bruto);
      state.token = dados.token || null;
      state.usuario = dados.usuario || null;
    } catch {
      state.token = null;
      state.usuario = null;
    }
  }
  function persistir() {
    try {
      if (state.token) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ token: state.token, usuario: state.usuario })
        );
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* modo privado: segue só em memória */
    }
  }

  /* ------------------------------ API ------------------------------ */
  async function api(caminho, { method = "GET", body, auth = false } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (auth && state.token) headers.Authorization = `Bearer ${state.token}`;

    const res = await fetch(`/api${caminho}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const dados = await res.json().catch(() => ({}));
    if (!res.ok) {
      const erro = new Error(dados.erro || "Não foi possível concluir a operação.");
      erro.dados = dados;
      erro.status = res.status;
      throw erro;
    }
    return dados;
  }

  /* --------------------------- elementos --------------------------- */
  const el = {};
  function cachearElementos() {
    el.modal = document.getElementById("authModal");
    el.titulo = document.getElementById("authTitle");
    el.paineis = [...document.querySelectorAll("#authModal [data-panel]")];
    el.adminBar = document.getElementById("adminBar");
    el.btnEntrar = document.getElementById("btnEntrar");
    el.menuConta = document.getElementById("accountMenu");
    el.nomeConta = document.getElementById("accountName");
    el.inicialConta = document.getElementById("accountInitial");
    el.emailConta = document.getElementById("accountEmail");
    el.badgeAdmin = document.getElementById("accountAdminBadge");
    el.dropdown = document.getElementById("accountDropdown");
    el.trigger = document.getElementById("accountTrigger");
  }

  /* ----------------------------- UI ------------------------------- */
  const TITULOS = {
    login: "Entrar",
    cadastro: "Criar conta",
    codigo: "Confirme seu e-mail",
    esqueci: "Recuperar senha",
    redefinir: "Definir nova senha"
  };

  function limparFeedbacks() {
    el.paineis.forEach((p) => {
      const fb = p.querySelector("[data-feedback]");
      if (fb) {
        fb.textContent = "";
        fb.className = "modal__feedback";
      }
    });
  }

  function mostrarPainel(nome) {
    limparFeedbacks();
    el.paineis.forEach((p) => {
      p.hidden = p.dataset.panel !== nome;
    });
    if (el.titulo) el.titulo.textContent = TITULOS[nome] || "Acessar";
    document.querySelectorAll("#authModal [data-alvo-email]").forEach((n) => {
      n.textContent = state.alvoEmail || "seu e-mail";
    });
    const primeiro = el.modal.querySelector(`[data-panel="${nome}"] input`);
    if (primeiro) setTimeout(() => primeiro.focus(), 50);
  }

  function feedback(painel, mensagem, tipo) {
    const fb = el.modal.querySelector(`[data-panel="${painel}"] [data-feedback]`);
    if (!fb) return;
    fb.textContent = mensagem;
    fb.className = "modal__feedback" + (tipo ? " " + tipo : "");
  }

  function dicaCodigoDev(painel, resp) {
    if (resp && resp.codigoDev) {
      feedback(painel, `Modo dev — seu código é ${resp.codigoDev}`, "info");
    }
  }

  function abrir(nome = "login") {
    if (!el.modal.open) {
      el.modal.showModal();
      requestAnimationFrame(() => el.modal.classList.add("modal--visible"));
    }
    mostrarPainel(nome);
  }
  function fechar() {
    el.modal.classList.remove("modal--visible");
    setTimeout(() => {
      if (el.modal.open) el.modal.close();
    }, 180);
  }

  function renderConta() {
    const logado = !!state.token && !!state.usuario;
    if (el.btnEntrar) el.btnEntrar.hidden = logado;
    if (el.menuConta) el.menuConta.hidden = !logado;
    if (el.adminBar) el.adminBar.hidden = !(logado && state.usuario.papel === "admin");

    if (logado) {
      const u = state.usuario;
      if (el.nomeConta) el.nomeConta.textContent = u.nome.split(" ")[0];
      if (el.inicialConta) el.inicialConta.textContent = (u.nome[0] || "?").toUpperCase();
      if (el.emailConta) el.emailConta.textContent = u.email;
      if (el.badgeAdmin) el.badgeAdmin.hidden = u.papel !== "admin";
    }
    if (el.dropdown) el.dropdown.hidden = true;
  }

  function aplicarSessao(resp) {
    state.token = resp.accessToken;
    state.usuario = resp.usuario;
    persistir();
    renderConta();

    document.dispatchEvent(new CustomEvent("ff:auth-change", { detail: { usuario: state.usuario } }));

    if (resp.admin) {
      toast("Você entrou no modo administrador.");
    } else {
      toast(`Bem-vindo(a), ${state.usuario.nome.split(" ")[0]}!`);
    }

    fechar();

    const acao = state.acaoPendente;
    state.acaoPendente = null;
    if (typeof acao === "function") setTimeout(acao, 150);
  }

  function sair() {
    state.token = null;
    state.usuario = null;
    persistir();
    renderConta();
    document.dispatchEvent(new CustomEvent("ff:auth-change", { detail: { usuario: null } }));
    toast("Você saiu da sua conta.");
  }

  function toast(msg) {
    if (typeof window.showToast === "function") window.showToast(msg);
  }

  /* ----------------------- exigir login (gate) --------------------- */
  function exigirLogin(callback) {
    if (state.token && state.usuario) {
      if (typeof callback === "function") callback();
      return true;
    }
    state.acaoPendente = typeof callback === "function" ? callback : null;
    abrir("login");
    feedback("login", "Entre ou crie uma conta para continuar.", "info");
    return false;
  }

  /* --------------------------- handlers --------------------------- */
  function ligarFormularios() {
    // navegação entre painéis
    el.modal.querySelectorAll("[data-goto]").forEach((b) => {
      b.addEventListener("click", () => {
        const destino = b.dataset.goto;
        if (destino === "reenviar") return reenviar();
        mostrarPainel(destino);
      });
    });

    el.modal.querySelectorAll("[data-close-modal]").forEach((b) => {
      b.addEventListener("click", fechar);
    });

    // Esc fecha nativamente o <dialog>: limpa a classe de animação.
    el.modal.addEventListener("close", () => el.modal.classList.remove("modal--visible"));

    on("login", async (dados) => {
      try {
        const resp = await api("/auth/login", { method: "POST", body: dados });
        aplicarSessao(resp);
      } catch (err) {
        if (err.dados && err.dados.detalhes && err.dados.detalhes.precisaConfirmar) {
          state.alvoEmail = err.dados.detalhes.email || dados.email;
          mostrarPainel("codigo");
          feedback("codigo", "Sua conta ainda não foi confirmada. Digite o código enviado por e-mail.", "info");
        } else {
          feedback("login", err.message, "error");
        }
      }
    });

    on("cadastro", async (dados) => {
      try {
        const resp = await api("/auth/register", { method: "POST", body: dados });
        state.alvoEmail = resp.email || dados.email;
        mostrarPainel("codigo");
        feedback("codigo", `Enviamos um código para ${state.alvoEmail}.`, "info");
        dicaCodigoDev("codigo", resp);
      } catch (err) {
        feedback("cadastro", err.message, "error");
      }
    });

    on("codigo", async (dados) => {
      try {
        const resp = await api("/auth/verify-email", {
          method: "POST",
          body: { email: state.alvoEmail, codigo: dados.codigo }
        });
        aplicarSessao(resp);
      } catch (err) {
        feedback("codigo", err.message, "error");
      }
    });

    on("esqueci", async (dados) => {
      try {
        const resp = await api("/auth/forgot-password", { method: "POST", body: dados });
        state.alvoEmail = dados.email;
        mostrarPainel("redefinir");
        feedback("redefinir", `Se houver conta para ${dados.email}, enviamos um código.`, "info");
        dicaCodigoDev("redefinir", resp);
      } catch (err) {
        feedback("esqueci", err.message, "error");
      }
    });

    on("redefinir", async (dados) => {
      try {
        const resp = await api("/auth/reset-password", {
          method: "POST",
          body: { email: state.alvoEmail, codigo: dados.codigo, novaSenha: dados.novaSenha }
        });
        aplicarSessao(resp);
      } catch (err) {
        feedback("redefinir", err.message, "error");
      }
    });
  }

  async function reenviar() {
    if (!state.alvoEmail) return;
    try {
      const resp = await api("/auth/resend-code", {
        method: "POST",
        body: { email: state.alvoEmail, proposito: "confirmar_email" }
      });
      feedback("codigo", "Novo código enviado.", "info");
      dicaCodigoDev("codigo", resp);
    } catch (err) {
      feedback("codigo", err.message, "error");
    }
  }

  function on(painel, handler) {
    const form = el.modal.querySelector(`form[data-panel="${painel}"]`);
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const dados = Object.fromEntries(new FormData(form).entries());
      handler(dados);
    });
  }

  /* --------------------- menu da conta no header ------------------- */
  function ligarMenuConta() {
    if (el.btnEntrar) el.btnEntrar.addEventListener("click", () => abrir("login"));
    if (el.trigger) {
      el.trigger.addEventListener("click", () => {
        el.dropdown.hidden = !el.dropdown.hidden;
      });
    }
    const btnSair = document.getElementById("btnSair");
    if (btnSair) btnSair.addEventListener("click", sair);

    const btnConta = document.getElementById("btnMinhaConta");
    if (btnConta) {
      btnConta.addEventListener("click", () => {
        el.dropdown.hidden = true;
        if (typeof window.abrirMinhaConta === "function") window.abrirMinhaConta();
      });
    }

    document.addEventListener("click", (e) => {
      if (el.menuConta && !el.menuConta.contains(e.target) && el.dropdown) {
        el.dropdown.hidden = true;
      }
    });
  }

  /* ----------------------- valida sessão salva -------------------- */
  async function revalidarSessao() {
    if (!state.token) return;
    try {
      const perfil = await api("/users/profile", { auth: true });
      state.usuario = perfil;
      persistir();
      renderConta();
      document.dispatchEvent(new CustomEvent("ff:auth-change", { detail: { usuario: perfil } }));
    } catch (err) {
      if (err.status === 401) sair();
    }
  }

  /* ------------------------------ init ---------------------------- */
  function init() {
    cachearElementos();
    if (!el.modal) return;
    carregar();
    ligarFormularios();
    ligarMenuConta();
    renderConta();
    revalidarSessao();
  }

  // API pública
  window.FFAuth = {
    estaLogado: () => !!state.token && !!state.usuario,
    ehAdmin: () => !!state.usuario && state.usuario.papel === "admin",
    usuario: () => state.usuario,
    token: () => state.token,
    headers: () => (state.token ? { Authorization: `Bearer ${state.token}` } : {}),
    exigirLogin,
    abrir,
    sair,
    api
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
