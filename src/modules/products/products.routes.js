"use strict";

const express = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const { autenticar, autenticarOpcional } = require("../../middleware/auth");
const exigirAdmin = require("../../middleware/admin");
const service = require("./products.service");

const router = express.Router();

// GET /api/products — lista pública com filtros, ordenação, paginação e facetas.
// Admin autenticado pode passar ?incluirInativos=1.
router.get(
  "/",
  autenticarOpcional,
  asyncHandler(async (req, res) => {
    const admin = !!req.usuario && req.usuario.papel === "admin";
    res.json(service.listar(req.query, { admin }));
  })
);

// GET /api/products/:id — detalhe de um produto
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(service.obter(req.params.id));
  })
);

// GET /api/products/:id/relacionados — produtos da mesma seção
router.get(
  "/:id/relacionados",
  asyncHandler(async (req, res) => {
    res.json({ produtos: service.relacionados(req.params.id) });
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

// PUT /api/products/:id — atualiza produto / estoque / preço (admin)
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
    res.json({ mensagem: "Produto desativado.", produto: service.desativar(req.params.id) });
  })
);

// POST /api/products/:id/reativar — volta um produto desativado ao catálogo (admin)
router.post(
  "/:id/reativar",
  autenticar,
  exigirAdmin,
  asyncHandler(async (req, res) => {
    res.json({ mensagem: "Produto reativado.", produto: service.reativar(req.params.id) });
  })
);

module.exports = router;
