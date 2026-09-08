"use strict";

const express = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const { autenticarOpcional } = require("../../middleware/auth");
const service = require("./services.service");

const router = express.Router();

// POST /api/appointments — cria agendamento (vincula ao usuário se houver token)
router.post(
  "/",
  autenticarOpcional,
  asyncHandler(async (req, res) => {
    res.status(201).json(service.criarAgendamento(req.body || {}, req.usuario));
  })
);

// GET /api/appointments/:id — consulta um agendamento
router.get(
  "/:id",
  autenticarOpcional,
  asyncHandler(async (req, res) => {
    res.json(service.obterAgendamento(req.params.id, req.usuario));
  })
);

module.exports = router;
