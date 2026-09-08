"use strict";

const express = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const { autenticar } = require("../../middleware/auth");
const exigirAdmin = require("../../middleware/admin");
const AppError = require("../../lib/AppError");
const store = require("../../db/store");

const router = express.Router();
router.use(autenticar, exigirAdmin);

const STATUS_PEDIDO = [
  "aguardando pagamento",
  "aguardando entrega",
  "pago",
  "em separação",
  "enviado",
  "entregue",
  "cancelado",
  "pagamento recusado",
  "reembolsado"
];

// GET /api/admin/overview — números para o painel
router.get(
  "/overview",
  asyncHandler(async (_req, res) => {
    const produtos = store.colecao("produtos");
    const pedidos = store.colecao("pedidos");
    const usuarios = store.colecao("usuarios");
    const agendamentos = store.colecao("agendamentos");
    const comentarios = store.colecao("comentariosBlog");

    const pagos = pedidos.filter((p) => ["pago", "em separação", "enviado", "entregue"].includes(p.status));
    const receita = pagos.reduce((s, p) => s + (p.total || 0), 0);

    const porCategoria = {};
    for (const p of produtos) {
      if (p.ativo === false) continue;
      porCategoria[p.categoria] = (porCategoria[p.categoria] || 0) + 1;
    }

    res.json({
      produtos: {
        total: produtos.length,
        ativos: produtos.filter((p) => p.ativo !== false).length,
        semEstoque: produtos.filter((p) => p.ativo !== false && p.estoque <= 0).length,
        emPromocao: produtos.filter((p) => p.ativo !== false && p.precoPromocional != null).length,
        porCategoria
      },
      pedidos: {
        total: pedidos.length,
        aguardandoPagamento: pedidos.filter((p) => p.status === "aguardando pagamento").length,
        emSeparacao: pedidos.filter((p) => p.status === "em separação").length,
        receita: Number(receita.toFixed(2))
      },
      clientes: usuarios.filter((u) => u.papel === "cliente").length,
      agendamentos: agendamentos.length,
      comentariosBlog: comentarios.length,
      ultimosPedidos: pedidos
        .slice()
        .sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1))
        .slice(0, 8)
        .map((p) => ({
          id: p.id,
          cliente: p.cliente && p.cliente.nome,
          total: p.total,
          status: p.status,
          criadoEm: p.criadoEm
        }))
    });
  })
);

// GET /api/admin/orders — todos os pedidos
router.get(
  "/orders",
  asyncHandler(async (req, res) => {
    let pedidos = store.colecao("pedidos").slice().sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1));
    if (req.query.status) pedidos = pedidos.filter((p) => p.status === req.query.status);
    if (req.query.busca) {
      const t = String(req.query.busca).toLowerCase();
      pedidos = pedidos.filter(
        (p) => p.id.toLowerCase().includes(t) || (p.cliente && String(p.cliente.nome).toLowerCase().includes(t))
      );
    }
    res.json({ total: pedidos.length, statusPossiveis: STATUS_PEDIDO, pedidos });
  })
);

// PATCH /api/admin/orders/:id/status — muda o status de um pedido
router.patch(
  "/orders/:id/status",
  asyncHandler(async (req, res) => {
    const { status } = req.body || {};
    if (!STATUS_PEDIDO.includes(status)) throw new AppError("Status inválido.");
    const pedido = store.colecao("pedidos").find((p) => p.id === req.params.id);
    if (!pedido) throw AppError.naoEncontrado("Pedido não encontrado.");
    const agora = new Date().toISOString();
    pedido.status = status;
    pedido.atualizadoEm = agora;
    (pedido.historico = pedido.historico || []).push({ status, em: agora, origem: "admin" });
    store.salvar();
    res.json(pedido);
  })
);

// GET /api/admin/appointments — agendamentos
router.get(
  "/appointments",
  asyncHandler(async (_req, res) => {
    const ags = store.colecao("agendamentos").slice().sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1));
    res.json({ total: ags.length, agendamentos: ags });
  })
);

module.exports = router;
