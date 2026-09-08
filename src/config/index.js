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

  email: {
    // Identidade do remetente (troque em produção via MAIL_FROM).
    remetente: process.env.MAIL_FROM || "Focinho Feliz <LivrariaLeitura01@gmail.com>",
    // SMTP opcional. Sem SMTP_HOST, o e-mail é gravado em data/emails/*.txt
    // e o código também aparece no console (modo dev).
    smtp: {
      host: process.env.SMTP_HOST || "",
      porta: Number(process.env.SMTP_PORT) || 587,
      seguro: process.env.SMTP_SECURE === "true",
      usuario: process.env.SMTP_USER || "",
      senha: process.env.SMTP_PASS || ""
    }
  },

  codigos: {
    // Códigos de confirmação de e-mail / redefinição de senha.
    tamanho: 6,
    expiraEmMinutos: Number(process.env.CODE_TTL_MIN) || 15,
    maxTentativas: 5,
    reenvioIntervaloSegundos: 60
  },

  paths: {
    raiz: path.resolve(__dirname, "..", ".."),
    publico: path.resolve(__dirname, "..", "..", "public"),
    bancoJson: path.resolve(__dirname, "..", "..", "data", "db.json"),
    emailsDev: path.resolve(__dirname, "..", "..", "data", "emails")
  },

  paginacao: {
    porPaginaPadrao: 12,
    porPaginaMax: 60
  }
};

module.exports = config;
