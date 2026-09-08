"use strict";

/**
 * API Gateway — ponto de entrada único da API (`/api`).
 * Recebe as requisições e distribui para cada serviço de domínio.
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
const storesRoutes = require("../modules/stores/stores.routes");
const blogRoutes = require("../modules/blog/blog.routes");
const bannersRoutes = require("../modules/banners/banners.routes");
const adminRoutes = require("../modules/admin/admin.routes");

const router = express.Router();

router.get("/", (_req, res) => {
  res.json({
    nome: "Focinho Feliz API",
    versao: "3.0.0",
    servicos: [
      "/api/auth", "/api/users", "/api/products", "/api/categories",
      "/api/cart", "/api/checkout", "/api/orders", "/api/services",
      "/api/appointments", "/api/stores", "/api/blog", "/api/banners", "/api/admin"
    ]
  });
});
router.get("/health", (_req, res) => res.json({ status: "ok", em: new Date().toISOString() }));

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/products", productsRoutes);
router.use("/categories", categoriesRoutes);
router.use("/cart", cartRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/orders", ordersRoutes);
router.use("/services", servicesRoutes);
router.use("/appointments", appointmentsRoutes);
router.use("/stores", storesRoutes);
router.use("/blog", blogRoutes);
router.use("/banners", bannersRoutes);
router.use("/admin", adminRoutes);

module.exports = router;
