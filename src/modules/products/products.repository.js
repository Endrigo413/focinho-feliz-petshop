"use strict";

const store = require("../../db/store");

const colecao = () => store.colecao("produtos");

function listarTodos() {
  return colecao();
}

function buscarPorId(id) {
  return colecao().find((p) => p.id === id) || null;
}

function inserir(produto) {
  colecao().push(produto);
  store.salvar();
  return produto;
}

function atualizar(id, campos) {
  const produto = buscarPorId(id);
  if (!produto) return null;
  Object.assign(produto, campos, { atualizadoEm: new Date().toISOString() });
  store.salvar();
  return produto;
}

function remover(id) {
  const lista = colecao();
  const i = lista.findIndex((p) => p.id === id);
  if (i === -1) return false;
  lista.splice(i, 1);
  store.salvar();
  return true;
}

module.exports = { listarTodos, buscarPorId, inserir, atualizar, remover };
