"use strict";

const AppError = require("../lib/AppError");

/**
 * Rate limiting simples em memória, por IP.
 * Suficiente para um MVP num único processo — em produção, usar Redis
 * ou `express-rate-limit` com store compartilhado (ver docs/TESTES.md, D5).
 */
function limitar({ janelaMs = 15 * 60 * 1000, max = 20, mensagem = "Muitas tentativas. Aguarde alguns minutos." } = {}) {
  const registros = new Map(); // ip -> { contagem, reinicioEm }

  // limpeza periódica
  setInterval(() => {
    const agora = Date.now();
    for (const [ip, r] of registros) if (r.reinicioEm <= agora) registros.delete(ip);
  }, janelaMs).unref();

  return (req, _res, next) => {
    const ip = req.ip || req.connection.remoteAddress || "desconhecido";
    const agora = Date.now();
    let r = registros.get(ip);
    if (!r || r.reinicioEm <= agora) {
      r = { contagem: 0, reinicioEm: agora + janelaMs };
      registros.set(ip, r);
    }
    r.contagem += 1;
    if (r.contagem > max) {
      return next(new AppError(mensagem, 429));
    }
    next();
  };
}

module.exports = { limitar };
