"use strict";

const express = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const AppError = require("../../lib/AppError");
const lojas = require("../../../data/stores");

const router = express.Router();

// GET /api/stores — lojas físicas + centro de distribuição
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({
      total: lojas.length,
      lojas: lojas.filter((l) => l.tipo === "loja"),
      centroDistribuicao: lojas.find((l) => l.tipo === "cd") || null,
      todos: lojas
    });
  })
);

// GET /api/stores/:id
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const loja = lojas.find((l) => l.id === req.params.id);
    if (!loja) throw AppError.naoEncontrado("Loja não encontrada.");
    res.json(loja);
  })
);

module.exports = router;
