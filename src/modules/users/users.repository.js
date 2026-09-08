"use strict";

const store = require("../../db/store");

const colecao = () => store.colecao("usuarios");

function listar() {
  return colecao();
}

function buscarPorId(id) {
  return colecao().find((u) => u.id === id) || null;
}

function buscarPorEmail(email) {
  const alvo = String(email || "").toLowerCase();
  return colecao().find((u) => u.email === alvo) || null;
}

function criar(usuario) {
  colecao().push(usuario);
  store.salvar();
  return usuario;
}

function atualizar(id, campos) {
  const usuario = buscarPorId(id);
  if (!usuario) return null;
  Object.assign(usuario, campos, { atualizadoEm: new Date().toISOString() });
  store.salvar();
  return usuario;
}

module.exports = { listar, buscarPorId, buscarPorEmail, criar, atualizar };
