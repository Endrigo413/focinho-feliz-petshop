"use strict";

const AppError = require("../lib/AppError");

/**
 * Exige que `req.usuario` (definido por `autenticar`) tenha papel "admin".
 * Deve ser usado sempre depois do middleware `autenticar`.
 */
module.exports = function exigirAdmin(req, _res, next) {
  if (!req.usuario) return next(AppError.naoAutorizado());
  if (req.usuario.papel !== "admin") {
    return next(AppError.proibido("Esta operação é restrita a administradores."));
  }
  next();
};
