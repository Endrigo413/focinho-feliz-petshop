"use strict";

const express = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const { autenticar, autenticarOpcional } = require("../../middleware/auth");
const service = require("./orders.service");

const router = express.Router();

// POST /api/orders/webhook — recebe atualizações do gateway de pagamento.
// Público, mas protegido por assinatura HMAC no header `x-webhook-signature`.
router.post(
  "/webhook",
  asyncHandler(async (req, res) => {
    const resultado = service.processarWebhook({
      rawBody: req.rawBody,
      assinatura: req.get("x-webhook-signature"),
      evento: req.body
    });
    res.json(resultado);
  })
);

// POST /api/orders — cria pedido. Com token: fecha o carrinho do usuário.
// Sem token: aceita { cliente, itens } (compatível com a v1).
router.post(
  "/",
  autenticarOpcional,
  asyncHandler(async (req, res) => {
    const pedido = req.usuario
      ? service.criarDoCarrinho(req.usuario, req.body || {})
      : service.criarComoVisitante(req.body || {});
    res.status(201).json(pedido);
  })
);

// GET /api/orders — histórico de pedidos do usuário logado
router.get(
  "/",
  autenticar,
  asyncHandler(async (req, res) => {
    res.json(service.listarHistorico(req.usuario.id));
  })
);

// GET /api/orders/:id — detalhe / rastreamento de um pedido
router.get(
  "/:id",
  autenticarOpcional,
  asyncHandler(async (req, res) => {
    res.json(service.obterParaUsuario(req.params.id, req.usuario));
  })
);

module.exports = router;
