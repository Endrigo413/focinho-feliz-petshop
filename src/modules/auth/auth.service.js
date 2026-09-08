"use strict";

const usuariosRepo = require("../users/users.repository");
const usersService = require("../users/users.service");
const AppError = require("../../lib/AppError");
const jwt = require("../../lib/jwt");
const senha = require("../../lib/senha");
const { gerarId } = require("../../lib/id");
const config = require("../../config");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function gerarTokenPara(usuario) {
  const token = jwt.assinar({ sub: usuario.id, papel: usuario.papel, nome: usuario.nome });
  return {
    tokenTipo: "Bearer",
    accessToken: token,
    expiraEm: config.jwt.expiraEmSegundos,
    usuario: usersService.publico(usuario)
  };
}

function registrar({ nome, email, senha: senhaPura, telefone } = {}) {
  nome = String(nome || "").trim();
  email = String(email || "").trim().toLowerCase();

  if (nome.length < 2) throw new AppError("Informe o nome completo.");
  if (!EMAIL_RE.test(email)) throw new AppError("E-mail inválido.");
  if (String(senhaPura || "").length < 6) {
    throw new AppError("A senha deve ter ao menos 6 caracteres.");
  }
  if (usuariosRepo.buscarPorEmail(email)) {
    throw AppError.conflito("Já existe uma conta com este e-mail.");
  }

  const agora = new Date().toISOString();
  const usuario = usuariosRepo.criar({
    id: gerarId("USR"),
    nome,
    email,
    senhaHash: senha.gerarHash(senhaPura),
    papel: "cliente",
    telefone: String(telefone || "").trim(),
    enderecos: [],
    criadoEm: agora,
    atualizadoEm: agora
  });

  return gerarTokenPara(usuario);
}

function login({ email, senha: senhaPura } = {}) {
  email = String(email || "").trim().toLowerCase();
  const usuario = usuariosRepo.buscarPorEmail(email);

  // mensagem genérica para não revelar se o e-mail existe
  if (!usuario || !senha.conferir(senhaPura, usuario.senhaHash)) {
    throw AppError.naoAutorizado("E-mail ou senha incorretos.");
  }

  return gerarTokenPara(usuario);
}

module.exports = { registrar, login, gerarTokenPara };
