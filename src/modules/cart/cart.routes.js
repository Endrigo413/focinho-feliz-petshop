"use strict";

const express = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const { autenticar } = require("../../middleware/auth");
const service = require("./cart.service");

const router = express.Router();

router.use(autenticar); // todo o carrinho exige login

// GET /api/cart — itens do carrinho do usuário
router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(service.obter(req.usuario.id));
  })
);

// POST /api/cart/items — adiciona produto / aumenta quantidade
router.post(
  "/items",
  asyncHandler(async (req, res) => {
    res.status(201).json(service.adicionarItem(req.usuario.id, req.body || {}));
  })
);

// PUT /api/cart/items/:productId — define a quantidade de um item (0 remove)
router.put(
  "/items/:productId",
  asyncHandler(async (req, res) => {
    const { quantidade } = req.body || {};
    res.json(service.atualizarItem(req.usuario.id, req.params.productId, quantidade));
  })
);

// DELETE /api/cart/items/:productId — remove um item
router.delete(
  "/items/:productId",
  asyncHandler(async (req, res) => {
    res.json(service.removerItem(req.usuario.id, req.params.productId));
  })
);

module.exports = router;
