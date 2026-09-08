"use strict";

const jwt = require("../lib/jwt");
const AppError = require("../lib/AppError");
const usuariosRepo = require("../modules/users/users.repository");

function extrairToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  return null;
}

/**
 * Exige um JWT válido. Popula `req.usuario` com o registro do usuário.
 */
function autenticar(req, _res, next) {
  const token = extrairToken(req);
  if (!token) return next(AppError.naoAutorizado("Token de acesso ausente."));

  const payload = jwt.verificar(token);
  if (!payload) return next(AppError.naoAutorizado("Token inválido ou expirado."));

  const usuario = usuariosRepo.buscarPorId(payload.sub);
  if (!usuario) return next(AppError.naoAutorizado("Usuário do token não existe mais."));

  req.usuario = usuario;
  req.tokenPayload = payload;
  next();
}

/**
 * Autenticação opcional: se houver token válido, popula `req.usuario`;
 * caso contrário segue como visitante (guest).
 */
function autenticarOpcional(req, _res, next) {
  const token = extrairToken(req);
  if (token) {
    const payload = jwt.verificar(token);
    if (payload) {
      const usuario = usuariosRepo.buscarPorId(payload.sub);
      if (usuario) {
        req.usuario = usuario;
        req.tokenPayload = payload;
      }
    }
  }
  next();
}

module.exports = { autenticar, autenticarOpcional };
