"use strict";

/**
 * Erro de aplicação com status HTTP. O middleware de erro converte
 * qualquer AppError numa resposta JSON `{ erro: mensagem }`.
 */
class AppError extends Error {
  constructor(mensagem, status = 400, detalhes = undefined) {
    super(mensagem);
    this.name = "AppError";
    this.status = status;
    this.detalhes = detalhes;
    this.esperado = true; // distingue de erros inesperados (bugs)
  }

  static naoAutorizado(msg = "Não autenticado.") {
    return new AppError(msg, 401);
  }

  static proibido(msg = "Acesso negado.") {
    return new AppError(msg, 403);
  }

  static naoEncontrado(msg = "Recurso não encontrado.") {
    return new AppError(msg, 404);
  }

  static conflito(msg = "Conflito de dados.") {
    return new AppError(msg, 409);
  }
}

module.exports = AppError;
