"use strict";

/**
 * Popula o banco JSON na primeira execução (ou com `npm run seed -- --force`).
 *
 * Fontes:
 *  - data/products.js  -> catálogo inicial de produtos
 *  - categorias         -> derivadas das categorias dos produtos
 *  - usuário admin      -> a partir de config.admin
 */

const fs = require("fs");
const config = require("../config");
const store = require("./store");
const { gerarHash } = require("../lib/senha");
const { gerarId } = require("../lib/id");
const produtosBase = require("../../data/products");

const ROTULOS_CATEGORIA = {
  racao: "Ração",
  higiene: "Higiene",
  brinquedo: "Brinquedos",
  acessorio: "Acessórios",
  petisco: "Petiscos",
  saude: "Saúde"
};

function construirCategorias() {
  const slugs = [...new Set(produtosBase.map((p) => p.categoria))];
  return slugs.map((slug, i) => ({
    id: `cat-${slug}`,
    slug,
    nome: ROTULOS_CATEGORIA[slug] || slug,
    ordem: i + 1
  }));
}

function construirProdutos() {
  const agora = new Date().toISOString();
  return produtosBase.map((p) => ({
    ...p,
    ativo: true,
    criadoEm: agora,
    atualizadoEm: agora
  }));
}

function construirAdmin() {
  const agora = new Date().toISOString();
  return {
    id: gerarId("USR"),
    nome: config.admin.nome,
    email: config.admin.email.toLowerCase(),
    senhaHash: gerarHash(config.admin.senha),
    papel: "admin",
    telefone: "",
    enderecos: [],
    criadoEm: agora,
    atualizadoEm: agora
  };
}

function executarSeed({ forcar = false } = {}) {
  const jaExiste = fs.existsSync(config.paths.bancoJson);
  if (jaExiste && !forcar) {
    return { pulado: true };
  }

  store.redefinir({
    categorias: construirCategorias(),
    produtos: construirProdutos(),
    usuarios: [construirAdmin()],
    carrinhos: [],
    pedidos: [],
    agendamentos: [],
    eventosPagamento: []
  });

  return { pulado: false };
}

// Execução direta via CLI: `node src/db/seed.js [--force]`
if (require.main === module) {
  const forcar = process.argv.includes("--force");
  const resultado = executarSeed({ forcar });
  if (resultado.pulado) {
    console.log("Seed pulado: data/db.json já existe (use --force para recriar).");
  } else {
    console.log("Banco populado em", config.paths.bancoJson);
    console.log(`Admin: ${config.admin.email} / senha: ${config.admin.senha}`);
  }
}

module.exports = { executarSeed };
