"use strict";

/**
 * Bootstrap do servidor Focinho Feliz.
 *  1. carrega config (+ .env)
 *  2. garante o banco populado (seed idempotente)
 *  3. sobe o servidor HTTP
 */

const config = require("./src/config");
const { executarSeed, garantirAdmin } = require("./src/db/seed");
const { criarApp } = require("./src/app");

const resultadoSeed = executarSeed();
if (!resultadoSeed.pulado) {
  console.log("🌱 Banco inicial criado em data/db.json");
}
if (garantirAdmin().criado) {
  console.log("👤 Conta admin criada.");
}
console.log(`   Admin: ${config.admin.email} / senha: ${config.admin.senha}`);

const app = criarApp();

app.listen(config.porta, () => {
  console.log(`🐾 Focinho Feliz rodando em http://localhost:${config.porta}`);
  console.log(`   API:  http://localhost:${config.porta}/api`);
});
