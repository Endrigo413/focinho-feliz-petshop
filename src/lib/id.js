"use strict";

const crypto = require("crypto");

/**
 * Gera um id curto e legível com prefixo, ex.: `PED-lm3k9a-7f2b1`.
 * Usado para pedidos, agendamentos, usuários etc.
 */
function gerarId(prefixo) {
  const tempo = Date.now().toString(36);
  const aleatorio = crypto.randomBytes(4).toString("hex").slice(0, 5);
  return `${prefixo}-${tempo}-${aleatorio}`;
}

module.exports = { gerarId };
