"use strict";

const express = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const { autenticar } = require("../../middleware/auth");
const exigirAdmin = require("../../middleware/admin");
const service = require("./products.service");

const router = express.Router();

// GET /api/products — lista pública com paginação e filtros
router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(service.listar(req.query));
  })
);

// GET /api/products/:id — detalhe de um produto
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(service.obter(req.params.id));
  })
);

// POST /api/products — cadastra produto (admin)
router.post(
  "/",
  autenticar,
  exigirAdmin,
  asyncHandler(async (req, res) => {
    res.status(201).json(service.criar(req.body || {}));
  })
);

// PUT /api/products/:id — atualiza produto / estoque (admin)
router.put(
  "/:id",
  autenticar,
  exigirAdmin,
  asyncHandler(async (req, res) => {
    res.json(service.atualizar(req.params.id, req.body || {}));
  })
);

// DELETE /api/products/:id — desativa produto (admin, remoção lógica)
router.delete(
  "/:id",
  autenticar,
  exigirAdmin,
  asyncHandler(async (req, res) => {
    const produto = service.desativar(req.params.id);
    res.json({ mensagem: "Produto desativado.", produto });
  })
);

module.exports = router;
