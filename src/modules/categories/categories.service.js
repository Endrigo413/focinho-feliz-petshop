"use strict";

const store = require("../../db/store");

/** Lista as categorias ordenadas, com a contagem de produtos ativos em cada uma. */
function listar() {
  const categorias = [...store.colecao("categorias")].sort(
    (a, b) => (a.ordem || 0) - (b.ordem || 0)
  );
  const produtos = store.colecao("produtos");

  return categorias.map((c) => ({
    ...c,
    totalProdutos: produtos.filter((p) => p.categoria === c.slug && p.ativo !== false).length
  }));
}

module.exports = { listar };
