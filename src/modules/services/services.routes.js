"use strict";

const express = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const service = require("./services.service");

const router = express.Router();

// GET /api/services — catálogo de serviços (filtro: categoria)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const servicos = service.listarServicos(req.query);
    res.json({ total: servicos.length, servicos });
  })
);

// GET /api/services/:id — detalhe de um serviço
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(service.obterServico(req.params.id));
  })
);

module.exports = router;
