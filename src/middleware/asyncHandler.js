"use strict";

/**
 * Envolve um handler async para que exceções caiam no middleware de erro
 * do Express sem precisar de try/catch em cada rota.
 */
module.exports = function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
