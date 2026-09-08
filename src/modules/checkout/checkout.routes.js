"use strict";

const express = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const { autenticarOpcional } = require("../../middleware/auth");
const service = require("./checkout.service");

const router = express.Router();

// POST /api/checkout/shipping — calcula opções de frete e prazo pelo CEP
router.post(
  "/shipping",
  autenticarOpcional,
  asyncHandler(async (req, res) => {
    res.json(service.calcularFrete(req.body || {}, req.usuario));
  })
);

module.exports = router;
