"use strict";

const express = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const { autenticar } = require("../../middleware/auth");
const exigirAdmin = require("../../middleware/admin");
const store = require("../../db/store");
const AppError = require("../../lib/AppError");
const { gerarId } = require("../../lib/id");

const router = express.Router();

const banners = () => store.colecao("banners");
const promocoes = () => store.colecao("promocoes");

// GET /api/banners — banners da home + cards de promoção (só os ativos)
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({
      banners: banners()
        .filter((b) => b.ativo !== false)
        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0)),
      promocoes: promocoes().filter((p) => p.ativo !== false)
    });
  })
);

// GET /api/banners/admin — tudo, inclusive inativos (admin)
router.get(
  "/admin",
  autenticar,
  exigirAdmin,
  asyncHandler(async (_req, res) => {
    res.json({ banners: banners(), promocoes: promocoes() });
  })
);

function upsert(colecao, prefixo, dados, id) {
  const lista = colecao();
  let item = id ? lista.find((x) => x.id === id) : null;
  if (id && !item) throw AppError.naoEncontrado("Item não encontrado.");
  if (!item) {
    item = { id: gerarId(prefixo), ativo: true };
    lista.push(item);
  }
  Object.assign(item, dados);
  store.salvar();
  return item;
}

// POST/PUT/DELETE banners
router.post("/banner", autenticar, exigirAdmin, asyncHandler(async (req, res) => {
  res.status(201).json(upsert(banners, "BAN", req.body || {}));
}));
router.put("/banner/:id", autenticar, exigirAdmin, asyncHandler(async (req, res) => {
  res.json(upsert(banners, "BAN", req.body || {}, req.params.id));
}));
router.delete("/banner/:id", autenticar, exigirAdmin, asyncHandler(async (req, res) => {
  const lista = banners();
  const i = lista.findIndex((x) => x.id === req.params.id);
  if (i === -1) throw AppError.naoEncontrado("Banner não encontrado.");
  lista.splice(i, 1);
  store.salvar();
  res.json({ removido: req.params.id });
}));

// POST/PUT/DELETE promoções
router.post("/promocao", autenticar, exigirAdmin, asyncHandler(async (req, res) => {
  res.status(201).json(upsert(promocoes, "PRM", req.body || {}));
}));
router.put("/promocao/:id", autenticar, exigirAdmin, asyncHandler(async (req, res) => {
  res.json(upsert(promocoes, "PRM", req.body || {}, req.params.id));
}));
router.delete("/promocao/:id", autenticar, exigirAdmin, asyncHandler(async (req, res) => {
  const lista = promocoes();
  const i = lista.findIndex((x) => x.id === req.params.id);
  if (i === -1) throw AppError.naoEncontrado("Promoção não encontrada.");
  lista.splice(i, 1);
  store.salvar();
  res.json({ removido: req.params.id });
}));

module.exports = router;
