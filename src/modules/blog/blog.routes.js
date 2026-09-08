"use strict";

const express = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const { autenticar } = require("../../middleware/auth");
const exigirAdmin = require("../../middleware/admin");
const service = require("./blog.service");

const router = express.Router();

// GET /api/blog — lista de posts
router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(service.listar(req.query));
  })
);

// GET /api/blog/comentarios — moderação (admin)
router.get(
  "/comentarios",
  autenticar,
  exigirAdmin,
  asyncHandler(async (_req, res) => {
    res.json({ comentarios: service.listarComentarios() });
  })
);

// DELETE /api/blog/comentarios/:id — remover comentário (admin)
router.delete(
  "/comentarios/:id",
  autenticar,
  exigirAdmin,
  asyncHandler(async (req, res) => {
    res.json(service.removerComentario(req.params.id));
  })
);

// POST /api/blog — criar post (admin)
router.post(
  "/",
  autenticar,
  exigirAdmin,
  asyncHandler(async (req, res) => {
    res.status(201).json(service.criarPost(req.body || {}));
  })
);

// GET /api/blog/:slug — post + comentários
router.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    res.json(service.obterPorSlug(req.params.slug));
  })
);

// POST /api/blog/:slug/comentarios — leitor deixa uma opinião (exige login)
router.post(
  "/:slug/comentarios",
  autenticar,
  asyncHandler(async (req, res) => {
    res.status(201).json(service.comentar(req.params.slug, req.usuario, req.body || {}));
  })
);

// PUT /api/blog/:id — editar post (admin)
router.put(
  "/:id",
  autenticar,
  exigirAdmin,
  asyncHandler(async (req, res) => {
    res.json(service.atualizarPost(req.params.id, req.body || {}));
  })
);

// DELETE /api/blog/:id — remover post (admin)
router.delete(
  "/:id",
  autenticar,
  exigirAdmin,
  asyncHandler(async (req, res) => {
    res.json(service.removerPost(req.params.id));
  })
);

module.exports = router;
