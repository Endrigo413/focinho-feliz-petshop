/* Páginas de conta: entrar / criar / confirmar / recuperar */
(function () {
  "use strict";
  const pagina = document.body.dataset.conta;
  const redirect = FF.query("redirect") || "/conta/painel";
  const msg = (id, txt, cls) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = txt;
      el.className = "form-msg" + (cls ? " " + cls : "");
    }
  };

  function irLogado() {
    location.href = redirect.startsWith("/") ? redirect : "/conta/painel";
  }

  // Já logado? manda direto pro painel (exceto na tela de confirmar).
  if (FF.estaLogado() && pagina !== "confirmar") irLogado();

  /* ---------------- ENTRAR ---------------- */
  if (pagina === "entrar") {
    document.getElementById("formConta").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      msg("msg", "Entrando…", "info");
      try {
        const r = await FF.api("/auth/login", { method: "POST", body: { email: f.email.value, senha: f.senha.value } });
        FF.definirSessao(r);
        FF.toast(r.admin ? "Modo administrador" : "Bem-vindo(a)!", "ok");
        irLogado();
      } catch (err) {
        if (err.dados && err.dados.detalhes && err.dados.detalhes.precisaConfirmar) {
          location.href = "/conta/confirmar?email=" + encodeURIComponent(f.email.value) + "&redirect=" + encodeURIComponent(redirect);
        } else {
          msg("msg", err.message, "erro");
        }
      }
    });
  }

  /* ---------------- CRIAR ---------------- */
  if (pagina === "criar") {
    document.getElementById("formConta").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      msg("msg", "Criando conta…", "info");
      try {
        const r = await FF.api("/auth/register", {
          method: "POST",
          body: { nome: f.nome.value, email: f.email.value, telefone: f.telefone.value, senha: f.senha.value }
        });
        const q = new URLSearchParams({ email: r.email || f.email.value, redirect });
        if (r.codigoDev) q.set("codigoDev", r.codigoDev);
        location.href = "/conta/confirmar?" + q.toString();
      } catch (err) {
        msg("msg", err.message, "erro");
      }
    });
  }

  /* ---------------- CONFIRMAR ---------------- */
  if (pagina === "confirmar") {
    const email = FF.query("email") || "";
    const codigoDev = FF.query("codigoDev");
    const form = document.getElementById("formConta");
    form.email.value = email;
    document.getElementById("alvoEmail").textContent = email || "seu e-mail";
    if (codigoDev) {
      const dica = document.createElement("p");
      dica.className = "dica-dev";
      dica.textContent = "Modo de teste — seu código é " + codigoDev;
      form.appendChild(dica);
      form.codigo.value = codigoDev;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg("msg", "Confirmando…", "info");
      try {
        const r = await FF.api("/auth/verify-email", { method: "POST", body: { email, codigo: form.codigo.value } });
        FF.definirSessao(r);
        FF.toast("Conta confirmada!", "ok");
        irLogado();
      } catch (err) {
        msg("msg", err.message, "erro");
      }
    });

    document.getElementById("reenviar").addEventListener("click", async () => {
      msg("msg", "Reenviando…", "info");
      try {
        const r = await FF.api("/auth/resend-code", { method: "POST", body: { email, proposito: "confirmar_email" } });
        msg("msg", "Novo código enviado." + (r.codigoDev ? " (teste: " + r.codigoDev + ")" : ""), "ok");
        if (r.codigoDev) form.codigo.value = r.codigoDev;
      } catch (err) {
        msg("msg", err.message, "erro");
      }
    });
  }

  /* ---------------- RECUPERAR ---------------- */
  if (pagina === "recuperar") {
    const fEmail = document.getElementById("formEmail");
    const fNova = document.getElementById("formNova");

    fEmail.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg("msg1", "Enviando…", "info");
      try {
        const r = await FF.api("/auth/forgot-password", { method: "POST", body: { email: fEmail.email.value } });
        fNova.email.value = fEmail.email.value;
        fEmail.hidden = true;
        fNova.hidden = false;
        msg("msg2", "Se houver conta para esse e-mail, enviamos um código." + (r.codigoDev ? " (teste: " + r.codigoDev + ")" : ""), "info");
        if (r.codigoDev) fNova.codigo.value = r.codigoDev;
      } catch (err) {
        msg("msg1", err.message, "erro");
      }
    });

    fNova.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg("msg2", "Redefinindo…", "info");
      try {
        const r = await FF.api("/auth/reset-password", {
          method: "POST",
          body: { email: fNova.email.value, codigo: fNova.codigo.value, novaSenha: fNova.novaSenha.value }
        });
        FF.definirSessao(r);
        FF.toast("Senha alterada!", "ok");
        irLogado();
      } catch (err) {
        msg("msg2", err.message, "erro");
      }
    });
  }
})();
