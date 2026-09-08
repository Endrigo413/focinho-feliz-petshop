"use strict";

/**
 * Gateway de pagamento SIMULADO.
 *
 * Em produção este módulo seria a integração com Mercado Pago, Stripe, Pagar.me
 * etc. A interface pública ("criar cobrança", "assinar/verificar webhook") ficaria
 * igual — só a implementação muda.
 */

const crypto = require("crypto");
const config = require("../../config");
const { gerarId } = require("../../lib/id");

const METODOS = ["pix", "cartao", "boleto", "dinheiro"];

function criarCobranca({ valor, metodo, pedidoId, pagador }) {
  if (!METODOS.includes(metodo)) metodo = "pix";

  const cobranca = {
    id: gerarId("PAY"),
    pedidoId,
    metodo,
    valor: Number(Number(valor).toFixed(2)),
    status: metodo === "dinheiro" ? "aguardando_entrega" : "pendente",
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  };

  if (metodo === "pix") {
    cobranca.pix = {
      copiaECola: `00020126BR.GOV.BCB.PIX-${cobranca.id}-${cobranca.valor}`,
      expiraEm: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    };
  }
  if (metodo === "cartao") {
    cobranca.checkoutUrl = `https://pagamento.exemplo/checkout/${cobranca.id}`;
  }
  if (metodo === "boleto") {
    cobranca.boleto = {
      linhaDigitavel: `34191.79001 01043.510047 91020.150008 ${crypto.randomInt(1, 9)} ${crypto.randomInt(10000000000, 99999999999)}`,
      vencimento: new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10)
    };
  }

  return cobranca;
}

/** Assina um corpo de webhook (usado em testes e na doc). */
function assinarWebhook(rawBody) {
  return crypto
    .createHmac("sha256", config.pagamento.webhookSecret)
    .update(rawBody)
    .digest("hex");
}

/** Verifica a assinatura recebida no header do webhook. */
function verificarAssinatura(rawBody, assinaturaRecebida) {
  if (!assinaturaRecebida) return false;
  const esperada = assinarWebhook(rawBody || "");
  const a = Buffer.from(esperada);
  const b = Buffer.from(String(assinaturaRecebida));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { METODOS, criarCobranca, assinarWebhook, verificarAssinatura };
