/* =========================================================
   Focinho Feliz — carrinho (window.FFCart)
   Guarda um "retrato" de cada item no localStorage. O checkout
   (página /carrinho) envia os itens para a API.
   ========================================================= */
(function () {
  "use strict";

  const CHAVE = "focinhofeliz_carrinho";
  let itens = [];
  let frete = null; // { cep, local, distanciaKm, entregavel, valor, prazoDiasUteis }

  try {
    const s = JSON.parse(localStorage.getItem(CHAVE) || "null");
    if (s) {
      itens = Array.isArray(s.itens) ? s.itens : [];
      frete = s.frete || null;
    }
  } catch (e) {}

  function salvar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify({ itens, frete }));
    } catch (e) {}
    document.dispatchEvent(new CustomEvent("ff:carrinho", { detail: { itens, frete } }));
  }

  function precoUnit(i) {
    return i.precoPromocional != null && i.precoPromocional < i.preco ? i.precoPromocional : i.preco;
  }

  const FFCart = {
    itens: () => itens.slice(),
    frete: () => frete,

    contar: () => itens.reduce((s, i) => s + i.quantidade, 0),

    subtotal: () => Number(itens.reduce((s, i) => s + precoUnit(i) * i.quantidade, 0).toFixed(2)),

    total() {
      const sub = FFCart.subtotal();
      return Number((sub + (frete && frete.entregavel ? frete.valor : 0)).toFixed(2));
    },

    adicionar(produto, quantidade) {
      quantidade = Math.max(1, Math.trunc(quantidade || 1));
      const existente = itens.find((i) => i.id === produto.id);
      const estoque = produto.estoque != null ? produto.estoque : 99;
      if (existente) {
        existente.quantidade = Math.min(estoque, existente.quantidade + quantidade);
      } else {
        itens.push({
          id: produto.id,
          nome: produto.nome,
          preco: produto.preco,
          precoPromocional: produto.precoPromocional != null ? produto.precoPromocional : null,
          emoji: produto.emoji || "🐾",
          cor: produto.cor || "#1F4B43",
          marca: produto.marca || "",
          estoque: estoque,
          quantidade: Math.min(estoque, quantidade)
        });
      }
      salvar();
    },

    definirQuantidade(id, quantidade) {
      const item = itens.find((i) => i.id === id);
      if (!item) return;
      quantidade = Math.trunc(quantidade || 0);
      if (quantidade <= 0) {
        itens = itens.filter((i) => i.id !== id);
      } else {
        item.quantidade = Math.min(item.estoque || 99, quantidade);
      }
      salvar();
    },

    remover(id) {
      itens = itens.filter((i) => i.id !== id);
      salvar();
    },

    definirFrete(f) {
      frete = f;
      salvar();
    },

    limpar() {
      itens = [];
      frete = null;
      salvar();
    }
  };

  window.FFCart = FFCart;
})();
