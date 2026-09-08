"use strict";

const express = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const service = require("./auth.service");

const router = express.Router();

// POST /api/auth/register — cria conta de cliente e já devolve o token
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const resultado = service.registrar(req.body || {});
    res.status(201).json(resultado);
  })
);

// POST /api/auth/login — autentica e retorna o JWT
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    res.json(service.login(req.body || {}));
  })
);

module.exports = router;
