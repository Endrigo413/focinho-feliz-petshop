"use strict";

/**
 * API Gateway — ponto de entrada único da API (`/api`).
 *
 * Recebe todas as requisições do front-end e as direciona para o serviço
 * de domínio responsável. Cada serviço é um módulo independente em
 * `src/modules/*` com suas próprias camadas (rotas → controller → service →
 * repositório). Trocar um módulo por um microsserviço externo, no futuro,
 * é só mudar a linha de `use` correspondente.
 */

const express = require("express");

const authRoutes = require("../modules/auth/auth.routes");
const usersRoutes = require("../modules/users/users.routes");
const productsRoutes = require("../modules/products/products.routes");
const categoriesRoutes = require("../modules/categories/categories.routes");
const cartRoutes = require("../modules/cart/cart.routes");
const checkoutRoutes = require("../modules/checkout/checkout.routes");
const ordersRoutes = require("../modules/orders/orders.routes");
const servicesRoutes = require("../modules/services/services.routes");
const appointmentsRoutes = require("../modules/services/appointments.routes");

const router = express.Router();

// Healthcheck / descoberta
router.get("/", (_req, res) => {
  res.json({
    nome: "Focinho Feliz API",
    versao: "2.0.0",
    servicos: [
      "/api/auth",
      "/api/users",
      "/api/products",
      "/api/categories",
      "/api/cart",
      "/api/checkout",
      "/api/orders",
      "/api/services",
      "/api/appointments"
    ]
  });
});
router.get("/health", (_req, res) => res.json({ status: "ok", em: new Date().toISOString() }));

// Serviços de domínio
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/products", productsRoutes);
router.use("/categories", categoriesRoutes);
router.use("/cart", cartRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/orders", ordersRoutes);
router.use("/services", servicesRoutes);
router.use("/appointments", appointmentsRoutes);

module.exports = router;
