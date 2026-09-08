"use strict";

require("./env"); // popula process.env a partir do .env, se houver

const path = require("path");

const config = {
  ambiente: process.env.NODE_ENV || "development",
  porta: Number(process.env.PORT) || 3000,

  jwt: {
    segredo: process.env.JWT_SECRET || "troque-este-segredo-em-producao",
    expiraEmSegundos: Number(process.env.JWT_EXPIRES_IN) || 7200
  },

  pagamento: {
    webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || "troque-este-segredo-de-webhook"
  },

  admin: {
    email: process.env.ADMIN_EMAIL || "admin@focinhofeliz.com.br",
    senha: process.env.ADMIN_PASSWORD || "admin123",
    nome: "Administrador Focinho Feliz"
  },

  paths: {
    raiz: path.resolve(__dirname, "..", ".."),
    publico: path.resolve(__dirname, "..", "..", "public"),
    bancoJson: path.resolve(__dirname, "..", "..", "data", "db.json")
  },

  paginacao: {
    porPaginaPadrao: 12,
    porPaginaMax: 60
  }
};

module.exports = config;
