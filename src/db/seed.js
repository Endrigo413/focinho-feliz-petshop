"use strict";

/**
 * Popula o banco JSON na primeira execução (ou com `npm run seed`).
 *
 * Fontes: data/products.js · data/blog.js · data/banners.js · config.admin
 */

const fs = require("fs");
const config = require("../config");
const store = require("./store");
const { gerarHash } = require("../lib/senha");
const { gerarId } = require("../lib/id");
const produtosBase = require("../../data/products");
const { SECOES } = require("../../data/products");
const postsBlog = require("../../data/blog");
const { banners, promocoes } = require("../../data/banners");

function construirCategorias() {
  const slugs = [...new Set(produtosBase.map((p) => p.categoria))];
  return slugs.map((slug, i) => {
    const secao = SECOES[slug] || {};
    return {
      id: `cat-${slug}`,
      slug,
      nome: secao.rotulo || slug,
      emoji: secao.emoji || "🐾",
      cor: secao.cor || "#1F4B43",
      subcategorias: secao.subcategorias || [],
      ordem: i + 1
    };
  });
}

function construirProdutos() {
  const agora = new Date().toISOString();
  return produtosBase.map((p) => ({ ...p, criadoEm: agora, atualizadoEm: agora }));
}

function construirAdmin() {
  const agora = new Date().toISOString();
  return {
    id: gerarId("USR"),
    nome: config.admin.nome,
    email: config.admin.email.toLowerCase(),
    senhaHash: gerarHash(config.admin.senha),
    papel: "admin",
    status: "ativo", // admin já nasce confirmado
    emailVerificadoEm: agora,
    telefone: "",
    enderecos: [],
    criadoEm: agora,
    atualizadoEm: agora
  };
}

function construirPosts() {
  const agora = new Date().toISOString();
  return postsBlog.map((p) => ({ ...p, criadoEm: p.publicadoEm || agora, atualizadoEm: agora }));
}

function executarSeed({ forcar = false } = {}) {
  const jaExiste = fs.existsSync(config.paths.bancoJson);
  if (jaExiste && !forcar) return { pulado: true };

  store.redefinir({
    categorias: construirCategorias(),
    produtos: construirProdutos(),
    usuarios: [construirAdmin()],
    carrinhos: [],
    pedidos: [],
    agendamentos: [],
    eventosPagamento: [],
    codigos: [],
    postsBlog: construirPosts(),
    comentariosBlog: [],
    banners: banners.map((b) => ({ ...b })),
    promocoes: promocoes.map((p) => ({ ...p }))
  });

  return { pulado: false, produtos: produtosBase.length };
}

/**
 * Garante que a conta admin de `config.admin` exista, mesmo em bancos antigos.
 * Não sobrescreve a senha de um admin já existente.
 */
function garantirAdmin() {
  const usuarios = store.colecao("usuarios");
  const email = config.admin.email.toLowerCase();
  if (usuarios.some((u) => u.email === email)) return { criado: false };
  usuarios.push(construirAdmin());
  store.salvar();
  return { criado: true };
}

// CLI: `node src/db/seed.js [--force]`
if (require.main === module) {
  const forcar = process.argv.includes("--force");
  const r = executarSeed({ forcar });
  console.log(
    r.pulado
      ? "Seed pulado: data/db.json já existe."
      : `Banco populado (${r.produtos} produtos). Admin: ${config.admin.email} / ${config.admin.senha}`
  );
}

module.exports = { executarSeed, garantirAdmin };
