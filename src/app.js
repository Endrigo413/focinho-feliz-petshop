"use strict";

const express = require("express");
const path = require("path");
const config = require("./config");
const gateway = require("./gateway/router");
const { apiNaoEncontrada, tratadorDeErros } = require("./middleware/errorHandler");

function criarApp() {
  const app = express();

  app.disable("x-powered-by");

  // Cabeçalhos de segurança básicos (ver docs/TESTES.md — recomendação D4).
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  // Guarda o corpo cru para validar a assinatura do webhook de pagamento.
  app.use(
    express.json({
      limit: "1mb",
      verify: (req, _res, buf) => {
        req.rawBody = buf.toString("utf8");
      }
    })
  );

  // Camada de Apresentação — páginas HTML estáticas.
  // `extensions: ["html"]` faz /produtos servir produtos.html (URLs limpas).
  app.use(express.static(config.paths.publico, { extensions: ["html"] }));

  // Camada de Regras de Negócio (API) — entra pelo Gateway
  app.use("/api", gateway);
  app.use("/api", apiNaoEncontrada);

  // URL amigável para o post do blog: /blog/<slug> -> blog-post.html
  app.get("/blog/:slug", (_req, res) => {
    res.sendFile(path.join(config.paths.publico, "blog-post.html"));
  });

  // Rota não encontrada: volta para a home.
  app.get("*", (_req, res) => {
    res.status(200).sendFile(path.join(config.paths.publico, "index.html"));
  });

  app.use(tratadorDeErros);

  return app;
}

module.exports = { criarApp };
