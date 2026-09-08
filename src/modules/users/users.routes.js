"use strict";

const express = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const { autenticar } = require("../../middleware/auth");
const service = require("./users.service");

const router = express.Router();

// GET /api/users/profile — dados do usuário logado
router.get(
  "/profile",
  autenticar,
  asyncHandler(async (req, res) => {
    res.json(service.obterPerfil(req.usuario.id));
  })
);

// PUT /api/users/profile — atualiza nome, telefone, endereços
router.put(
  "/profile",
  autenticar,
  asyncHandler(async (req, res) => {
    res.json(service.atualizarPerfil(req.usuario.id, req.body || {}));
  })
);

module.exports = router;
