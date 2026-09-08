/* Carrinho + frete + checkout */
(function () {
  "use strict";
  const esc = (s) => FF.escape(s);
  const cont = document.getElementById("conteudo");
  let modoCheckout = false;
  let perfil = null;

  function precoUnit(i) {
    return i.precoPromocional != null && i.precoPromocional < i.preco ? i.precoPromocional : i.preco;
  }
  function maskCep(v) {
    const d = String(v || "").replace(/\D/g, "").slice(0, 8);
    return d.length > 5 ? d.slice(0, 5) + "-" + d.slice(5) : d;
  }

  function render() {
    const itens = FFCart.itens();
    const frete = FFCart.frete();

    if (!itens.length) {
      cont.innerHTML = '<div class="vazio"><div class="vazio__emoji">🛒</div><p>Seu carrinho está vazio.</p><a class="btn btn--primary" href="/produtos">Ver produtos</a></div>';
      return;
    }

    const subtotal = FFCart.subtotal();
    const freteVal = frete && frete.entregavel ? frete.valor : 0;
    const total = subtotal + freteVal;
    const logado = FF.estaLogado();
    const podeFechar = frete && frete.entregavel;

    cont.innerHTML = `
    <div class="carrinho">
      <div>
        ${itens
          .map(
            (i) => `
          <div class="carrinho__item" data-id="${esc(i.id)}">
            <div class="carrinho__fig" style="background:${esc(i.cor)}22">${esc(i.emoji)}</div>
            <div>
              <div class="carrinho__marca">${esc(i.marca || "")}</div>
              <div class="carrinho__nome">${esc(i.nome)}</div>
              <div class="carrinho__qtd">
                <button data-dec aria-label="Menos">−</button><span>${i.quantidade}</span><button data-inc aria-label="Mais">+</button>
              </div>
              <button class="carrinho__remover" data-rem>Remover</button>
            </div>
            <div class="carrinho__preco">${FF.dinheiro(precoUnit(i) * i.quantidade)}</div>
          </div>`
          )
          .join("")}
        <a class="btn btn--suave btn--pequeno" href="/produtos">← Continuar comprando</a>
      </div>

      <aside class="resumo">
        <h3>Resumo</h3>

        <div class="frete-box">
          <strong style="font-size:.9rem">Calcular frete e entrega</strong>
          <p class="frete-box__origem">Saímos da FATEC Taubaté · entregamos em até 40 km · R$ 0,59/km</p>
          <form class="frete-box__linha" id="formFrete">
            <input id="cep" placeholder="Seu CEP" value="${frete ? maskCep(frete.cep) : ""}" inputmode="numeric" maxlength="9" />
            <button class="btn btn--suave btn--pequeno" type="submit">Calcular</button>
          </form>
          <p class="frete-box__res ${frete ? (frete.entregavel ? "ok" : "erro") : ""}" id="resFrete" ${frete ? "" : "hidden"}>
            ${frete ? (frete.entregavel ? `✓ ${esc(frete.local)} — ~${frete.distanciaKm} km. Frete ${FF.dinheiro(frete.valor)} · ${frete.prazoDiasUteis} dia(s) útil(eis).` : `✗ ${esc(frete.mensagem || "Fora da área de entrega.")}`) : ""}
          </p>
        </div>

        <div class="resumo__linha"><span>Subtotal</span><span>${FF.dinheiro(subtotal)}</span></div>
        <div class="resumo__linha"><span>Frete</span><span>${podeFechar ? FF.dinheiro(freteVal) : "—"}</span></div>
        <div class="resumo__total"><span>Total</span><span>${FF.dinheiro(total)}</span></div>

        ${
          modoCheckout && logado && podeFechar
            ? formCheckout()
            : `<button class="btn btn--primary btn--bloco" id="btnFechar" ${!podeFechar ? "disabled" : ""} style="margin-top:14px">
                 ${logado ? "Finalizar compra" : "Entrar para finalizar"}
               </button>
               ${!podeFechar ? '<p class="frete-box__origem" style="text-align:center;margin-top:8px">Calcule o frete para um CEP atendido.</p>' : ""}`
        }
      </aside>
    </div>`;

    wire();
  }

  function formCheckout() {
    const ends = (perfil && perfil.enderecos) || [];
    return `
    <form id="formCheckout" style="margin-top:14px;display:grid;gap:10px">
      <p style="font-weight:700;margin:0">Dados da entrega</p>
      <label class="campo">Nome<input name="nome" value="${esc((perfil && perfil.nome) || "")}" required></label>
      <label class="campo">Telefone<input name="telefone" value="${esc((perfil && perfil.telefone) || "")}" placeholder="(12) 90000-0000" required></label>
      <label class="campo">Endereço de entrega
        <input name="endereco" list="ends" placeholder="Rua, número, bairro" required
          value="${ends[0] ? esc(`${ends[0].logradouro || ""}, ${ends[0].numero || ""} - ${ends[0].bairro || ""}`) : ""}">
      </label>
      <datalist id="ends">${ends.map((e) => `<option value="${esc(`${e.logradouro || ""}, ${e.numero || ""} - ${e.bairro || ""}`)}">`).join("")}</datalist>
      <label class="campo">Forma de pagamento
        <select name="pagamento"><option value="pix">Pix</option><option value="cartao">Cartão</option><option value="boleto">Boleto</option></select>
      </label>
      <button class="btn btn--primary btn--bloco" type="submit">Confirmar pedido</button>
      <button class="btn btn--suave btn--pequeno" type="button" id="cancelarCheckout">Voltar</button>
      <p class="form-msg" id="msgCheckout"></p>
    </form>`;
  }

  function wire() {
    cont.querySelectorAll(".carrinho__item").forEach((row) => {
      const id = row.dataset.id;
      const item = FFCart.itens().find((i) => i.id === id);
      row.querySelector("[data-inc]").onclick = () => { FFCart.definirQuantidade(id, item.quantidade + 1); render(); };
      row.querySelector("[data-dec]").onclick = () => { FFCart.definirQuantidade(id, item.quantidade - 1); render(); };
      row.querySelector("[data-rem]").onclick = () => { FFCart.remover(id); render(); };
    });

    const formFrete = document.getElementById("formFrete");
    if (formFrete) {
      const cep = document.getElementById("cep");
      cep.addEventListener("input", () => (cep.value = maskCep(cep.value)));
      formFrete.addEventListener("submit", async (e) => {
        e.preventDefault();
        const res = document.getElementById("resFrete");
        res.hidden = false;
        res.className = "frete-box__res";
        res.textContent = "Calculando…";
        try {
          const d = await FF.api("/checkout/shipping", { method: "POST", body: { cep: cep.value.replace(/\D/g, "") } });
          FFCart.definirFrete(d);
          render();
        } catch (err) {
          res.className = "frete-box__res erro";
          res.textContent = err.message;
        }
      });
    }

    const btnFechar = document.getElementById("btnFechar");
    if (btnFechar) {
      btnFechar.addEventListener("click", () => {
        if (!FF.estaLogado()) {
          location.href = "/conta/entrar?redirect=/carrinho";
          return;
        }
        modoCheckout = true;
        render();
      });
    }

    const cancelar = document.getElementById("cancelarCheckout");
    if (cancelar) cancelar.addEventListener("click", () => { modoCheckout = false; render(); });

    const formCk = document.getElementById("formCheckout");
    if (formCk) {
      formCk.addEventListener("submit", async (e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(formCk).entries());
        const m = document.getElementById("msgCheckout");
        m.textContent = "Enviando pedido…";
        m.className = "form-msg info";
        const frete = FFCart.frete();
        try {
          const pedido = await FF.api("/orders", {
            method: "POST",
            body: {
              itens: FFCart.itens().map((i) => ({ id: i.id, quantidade: i.quantidade })),
              formaPagamento: d.pagamento,
              cep: frete.cep,
              cliente: { nome: d.nome, telefone: d.telefone },
              enderecoEntrega: d.endereco
            }
          });
          FFCart.limpar();
          sucesso(pedido);
        } catch (err) {
          m.textContent = err.message;
          m.className = "form-msg erro";
        }
      });
    }
  }

  function sucesso(p) {
    const pix = p.pagamento && p.pagamento.pix;
    cont.innerHTML = `
    <div class="form-card form-card--largo" style="text-align:center">
      <div class="vazio__emoji">✅</div>
      <h2>Pedido ${esc(p.id)} recebido!</h2>
      <p>Total ${FF.dinheiro(p.total)} · ${esc(p.frete.servico || "entrega")} em ${p.frete.prazoDiasUteis || "-"} dia(s) útil(eis).</p>
      ${
        pix
          ? `<p style="font-weight:700">Pague com Pix (copia e cola):</p>
             <code style="display:block;word-break:break-all;background:var(--cream-2);padding:12px;border-radius:8px">${esc(pix.copiaECola)}</code>`
          : p.pagamento && p.pagamento.checkoutUrl
          ? `<p><a class="btn btn--primary" href="${esc(p.pagamento.checkoutUrl)}" target="_blank" rel="noopener">Ir para o pagamento</a></p>`
          : ""
      }
      <p style="margin-top:16px"><a class="btn btn--linha" href="/conta/painel">Ver meus pedidos</a> <a class="btn btn--suave" href="/produtos">Continuar comprando</a></p>
    </div>`;
  }

  async function init() {
    if (FF.estaLogado()) {
      try {
        perfil = await FF.api("/users/profile");
      } catch (e) {}
    }
    render();
    document.addEventListener("ff:carrinho", () => { if (!modoCheckout) render(); });
  }
  init();
})();
