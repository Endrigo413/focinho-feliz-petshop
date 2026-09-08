"use strict";

const AppError = require("../lib/AppError");

/** 404 para rotas de API não mapeadas. */
function apiNaoEncontrada(_req, res) {
  res.status(404).json({ erro: "Rota de API não encontrada." });
}

/** Tratador de erros central: converte qualquer erro numa resposta JSON. */
// eslint-disable-next-line no-unused-vars
function tratadorDeErros(err, req, res, _next) {
  if (err instanceof AppError || err.esperado) {
    return res.status(err.status || 400).json({
      erro: err.message,
      ...(err.detalhes ? { detalhes: err.detalhes } : {})
    });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ erro: "JSON inválido no corpo da requisição." });
  }

  console.error("Erro inesperado:", err);
  res.status(500).json({ erro: "Erro interno do servidor." });
}

module.exports = { apiNaoEncontrada, tratadorDeErros };
