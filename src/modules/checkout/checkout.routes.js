"use strict";

const express = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const service = require("./checkout.service");

const router = express.Router();

// POST /api/checkout/shipping — calcula o frete e diz se é possível entregar no CEP
router.post(
  "/shipping",
  asyncHandler(async (req, res) => {
    res.json(service.calcularFrete(req.body || {}));
  })
);

module.exports = router;
