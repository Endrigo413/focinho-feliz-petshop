"use strict";

const express = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const service = require("./categories.service");

const router = express.Router();

// GET /api/categories — lista as categorias de produtos
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const categorias = service.listar();
    res.json({ total: categorias.length, categorias });
  })
);

module.exports = router;
