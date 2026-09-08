"use strict";

const express = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const service = require("./auth.service");

const router = express.Router();

// POST /api/auth/register — cria conta (status "pendente") e envia código por e-mail
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    res.status(201).json(await service.registrar(req.body || {}));
  })
);

// POST /api/auth/verify-email — confirma o cadastro com o código e já devolve o token
router.post(
  "/verify-email",
  asyncHandler(async (req, res) => {
    res.json(await service.confirmarEmail(req.body || {}));
  })
);

// POST /api/auth/resend-code — reenvia o código (confirmar_email | redefinir_senha)
router.post(
  "/resend-code",
  asyncHandler(async (req, res) => {
    res.json(await service.reenviarCodigo(req.body || {}));
  })
);

// POST /api/auth/login — autentica; bloqueia se o e-mail não foi confirmado
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    res.json(service.login(req.body || {}));
  })
);

// POST /api/auth/forgot-password — envia código para redefinir a senha
router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    res.json(await service.solicitarRedefinicaoSenha(req.body || {}));
  })
);

// POST /api/auth/reset-password — troca a senha usando o código e devolve o token
router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    res.json(await service.redefinirSenha(req.body || {}));
  })
);

module.exports = router;
