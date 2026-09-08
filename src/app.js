"use strict";

const express = require("express");
const path = require("path");
const config = require("./config");
const gateway = require("./gateway/router");
const { apiNaoEncontrada, tratadorDeErros } = require("./middleware/errorHandler");

function criarApp() {
  const app = express();

  app.disable("x-powered-by");

  // Guarda o corpo cru para validar a assinatura do webhook de pagamento.
  app.use(
    express.json({
      limit: "1mb",
      verify: (req, _res, buf) => {
        req.rawBody = buf.toString("utf8");
      }
    })
  );

  // Camada de Apresentação (front-end estático)
  app.use(express.static(config.paths.publico));

  // Camada de Regras de Negócio (API) — entra pelo Gateway
  app.use("/api", gateway);
  app.use("/api", apiNaoEncontrada);

  // SPA: qualquer outra rota devolve o index.html
  app.get("*", (_req, res) => {
    res.sendFile(path.join(config.paths.publico, "index.html"));
  });

  app.use(tratadorDeErros);

  return app;
}

module.exports = { criarApp };
