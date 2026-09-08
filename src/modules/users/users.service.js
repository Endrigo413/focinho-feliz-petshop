"use strict";

const repo = require("./users.repository");
const AppError = require("../../lib/AppError");

/** Remove campos sensíveis antes de devolver ao cliente. */
function publico(usuario) {
  if (!usuario) return null;
  const { senhaHash, ...resto } = usuario;
  return resto;
}

function obterPerfil(usuarioId) {
  const usuario = repo.buscarPorId(usuarioId);
  if (!usuario) throw AppError.naoEncontrado("Usuário não encontrado.");
  return publico(usuario);
}

function atualizarPerfil(usuarioId, dados = {}) {
  const campos = {};

  if (dados.nome !== undefined) {
    const nome = String(dados.nome).trim();
    if (nome.length < 2) throw new AppError("Nome inválido.");
    campos.nome = nome;
  }

  if (dados.telefone !== undefined) {
    campos.telefone = String(dados.telefone).trim();
  }

  if (dados.enderecos !== undefined) {
    if (!Array.isArray(dados.enderecos)) throw new AppError("`enderecos` deve ser uma lista.");
    campos.enderecos = dados.enderecos.map((e) => ({
      apelido: String(e.apelido || "Casa"),
      cep: String(e.cep || "").replace(/\D/g, ""),
      logradouro: String(e.logradouro || ""),
      numero: String(e.numero || ""),
      complemento: String(e.complemento || ""),
      bairro: String(e.bairro || ""),
      cidade: String(e.cidade || ""),
      uf: String(e.uf || "").toUpperCase().slice(0, 2)
    }));
  }

  const atualizado = repo.atualizar(usuarioId, campos);
  if (!atualizado) throw AppError.naoEncontrado("Usuário não encontrado.");
  return publico(atualizado);
}

module.exports = { publico, obterPerfil, atualizarPerfil };
