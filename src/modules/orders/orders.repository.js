"use strict";

const store = require("../../db/store");

const colecao = () => store.colecao("pedidos");

function listarPorUsuario(usuarioId) {
  return colecao()
    .filter((p) => p.usuarioId === usuarioId)
    .sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1));
}

function buscarPorId(id) {
  return colecao().find((p) => p.id === id) || null;
}

function buscarPorPagamentoId(pagamentoId) {
  return colecao().find((p) => p.pagamento && p.pagamento.id === pagamentoId) || null;
}

function inserir(pedido) {
  colecao().push(pedido);
  store.salvar();
  return pedido;
}

function salvarAlteracoes() {
  store.salvar();
}

module.exports = {
  listarPorUsuario,
  buscarPorId,
  buscarPorPagamentoId,
  inserir,
  salvarAlteracoes
};
