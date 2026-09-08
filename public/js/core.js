/* =========================================================
   Focinho Feliz — núcleo do front-end (window.FF)
   Sessão do usuário, chamadas à API e utilitários.
   Carregado antes de todos os outros scripts.
   ========================================================= */
(function () {
  "use strict";

  const CHAVE = "focinhofeliz_sessao";
  const estado = { token: null, usuario: null };

  try {
    const s = JSON.parse(localStorage.getItem(CHAVE) || "null");
    if (s && s.token) {
      estado.token = s.token;
      estado.usuario = s.usuario || null;
    }
  } catch (e) {
    /* modo privado: só em memória */
  }

  function persistir() {
    try {
      if (estado.token) {
        localStorage.setItem(CHAVE, JSON.stringify({ token: estado.token, usuario: estado.usuario }));
      } else {
        localStorage.removeItem(CHAVE);
      }
    } catch (e) {}
  }

  function emitir() {
    document.dispatchEvent(new CustomEvent("ff:sessao", { detail: { usuario: estado.usuario } }));
  }

  async function api(caminho, opcoes) {
    opcoes = opcoes || {};
    const headers = Object.assign({}, opcoes.headers || {});
    if (opcoes.body !== undefined) headers["Content-Type"] = "application/json";
    if (estado.token) headers.Authorization = "Bearer " + estado.token;

    const res = await fetch("/api" + caminho, {
      method: opcoes.method || "GET",
      headers,
      body: opcoes.body !== undefined ? JSON.stringify(opcoes.body) : undefined
    });

    let dados = null;
    try {
      dados = await res.json();
    } catch (e) {}

    if (!res.ok) {
      const erro = new Error((dados && dados.erro) || "Erro " + res.status + " na requisição.");
      erro.dados = dados;
      erro.status = res.status;
      if (res.status === 401) limparSessao();
      throw erro;
    }
    return dados;
  }

  function definirSessao(resposta) {
    estado.token = resposta.accessToken;
    estado.usuario = resposta.usuario;
    persistir();
    emitir();
  }

  function limparSessao() {
    estado.token = null;
    estado.usuario = null;
    persistir();
    emitir();
  }

  async function revalidar() {
    if (!estado.token) return;
    try {
      const perfil = await api("/users/profile");
      estado.usuario = perfil;
      persistir();
      emitir();
    } catch (e) {
      /* api() já limpa a sessão em 401 */
    }
  }

  function urlAtual() {
    return encodeURIComponent(location.pathname + location.search);
  }

  const FF = {
    api,
    definirSessao,
    limparSessao,
    revalidar,
    get token() {
      return estado.token;
    },
    get usuario() {
      return estado.usuario;
    },
    estaLogado: () => !!estado.token && !!estado.usuario,
    ehAdmin: () => !!estado.usuario && estado.usuario.papel === "admin",

    exigirLogin() {
      if (estado.token) return true;
      location.href = "/conta/entrar?redirect=" + urlAtual();
      return false;
    },
    exigirAdmin() {
      if (estado.token && estado.usuario && estado.usuario.papel === "admin") return true;
      location.href = "/conta/entrar?redirect=" + urlAtual();
      return false;
    },

    dinheiro: (v) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),

    precoEfetivo: (p) =>
      p && p.precoPromocional != null && p.precoPromocional < p.preco ? p.precoPromocional : (p ? p.preco : 0),

    slug: (s) =>
      String(s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),

    estrelas(nota) {
      const n = Math.round((Number(nota) || 0) * 2) / 2;
      let s = "";
      for (let i = 1; i <= 5; i++) s += i <= n ? "★" : i - 0.5 === n ? "⯨" : "☆";
      return s;
    },

    query(nome) {
      return new URLSearchParams(location.search).get(nome);
    },

    escape(s) {
      const d = document.createElement("div");
      d.textContent = String(s == null ? "" : s);
      return d.innerHTML;
    },

    toast(mensagem, tipo) {
      let cont = document.getElementById("ff-toasts");
      if (!cont) {
        cont = document.createElement("div");
        cont.id = "ff-toasts";
        cont.className = "toasts";
        document.body.appendChild(cont);
      }
      const t = document.createElement("div");
      t.className = "toast" + (tipo ? " toast--" + tipo : "");
      t.textContent = mensagem;
      cont.appendChild(t);
      requestAnimationFrame(() => t.classList.add("is-visible"));
      setTimeout(() => {
        t.classList.remove("is-visible");
        setTimeout(() => t.remove(), 300);
      }, 3200);
    }
  };

  window.FF = FF;
  document.addEventListener("DOMContentLoaded", revalidar);
})();
