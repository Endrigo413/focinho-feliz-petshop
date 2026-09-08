"use strict";

const usuariosRepo = require("../users/users.repository");
const usersService = require("../users/users.service");
const verification = require("./verification.service");
const AppError = require("../../lib/AppError");
const jwt = require("../../lib/jwt");
const senha = require("../../lib/senha");
const { gerarId } = require("../../lib/id");
const config = require("../../config");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function gerarTokenPara(usuario) {
  const token = jwt.assinar({
    sub: usuario.id,
    papel: usuario.papel,
    nome: usuario.nome
  });
  return {
    tokenTipo: "Bearer",
    accessToken: token,
    expiraEm: config.jwt.expiraEmSegundos,
    usuario: usersService.publico(usuario),
    admin: usuario.papel === "admin"
  };
}

/* ------------------------------ cadastro ------------------------------ */

async function registrar({ nome, email, senha: senhaPura, telefone } = {}) {
  nome = String(nome || "").trim();
  email = String(email || "").trim().toLowerCase();

  if (nome.length < 2) throw new AppError("Informe o nome completo.");
  if (!EMAIL_RE.test(email)) throw new AppError("E-mail inválido.");
  if (String(senhaPura || "").length < 6) {
    throw new AppError("A senha deve ter ao menos 6 caracteres.");
  }

  const existente = usuariosRepo.buscarPorEmail(email);
  if (existente) {
    if (existente.status === "pendente") {
      // reenvia o código em vez de bloquear um cadastro nunca confirmado
      const info = await verification.emitir({ usuario: existente, proposito: "confirmar_email" });
      return { precisaConfirmar: true, email, ...info };
    }
    throw AppError.conflito("Já existe uma conta com este e-mail.");
  }

  const agora = new Date().toISOString();
  const usuario = usuariosRepo.criar({
    id: gerarId("USR"),
    nome,
    email,
    senhaHash: senha.gerarHash(senhaPura),
    papel: "cliente",
    status: "pendente", // ativa após confirmar o código enviado por e-mail
    emailVerificadoEm: null,
    telefone: String(telefone || "").trim(),
    enderecos: [],
    criadoEm: agora,
    atualizadoEm: agora
  });

  const info = await verification.emitir({ usuario, proposito: "confirmar_email" });
  return { precisaConfirmar: true, email, ...info };
}

async function confirmarEmail({ email, codigo } = {}) {
  email = String(email || "").trim().toLowerCase();
  const usuario = usuariosRepo.buscarPorEmail(email);
  if (!usuario) throw AppError.naoEncontrado("Conta não encontrada.");
  if (usuario.status === "ativo") {
    // já confirmada — só autentica
    return gerarTokenPara(usuario);
  }

  const registro = verification.pendenteMaisRecente(usuario.id, "confirmar_email");
  verification.conferir({ registroCodigo: registro, codigo });

  usuariosRepo.atualizar(usuario.id, {
    status: "ativo",
    emailVerificadoEm: new Date().toISOString()
  });

  return gerarTokenPara(usuariosRepo.buscarPorId(usuario.id));
}

async function reenviarCodigo({ email, proposito = "confirmar_email" } = {}) {
  email = String(email || "").trim().toLowerCase();
  const usuario = usuariosRepo.buscarPorEmail(email);

  // resposta genérica quando não há conta (evita enumeração de e-mails)
  if (!usuario) return { enviado: true, email };
  if (proposito === "confirmar_email" && usuario.status === "ativo") {
    return { enviado: true, email, jaConfirmado: true };
  }

  const info = await verification.emitir({ usuario, proposito });
  return { enviado: true, email, ...info };
}

/* -------------------------------- login -------------------------------- */

function login({ email, senha: senhaPura } = {}) {
  email = String(email || "").trim().toLowerCase();
  const usuario = usuariosRepo.buscarPorEmail(email);

  if (!usuario || !senha.conferir(senhaPura, usuario.senhaHash)) {
    throw AppError.naoAutorizado("E-mail ou senha incorretos.");
  }
  if (usuario.status !== "ativo") {
    throw new AppError(
      "Confirme seu e-mail antes de entrar. Verifique o código enviado.",
      403,
      { precisaConfirmar: true, email }
    );
  }

  return gerarTokenPara(usuario);
}

/* -------------------------- redefinição de senha -------------------------- */

async function solicitarRedefinicaoSenha({ email } = {}) {
  email = String(email || "").trim().toLowerCase();
  const usuario = usuariosRepo.buscarPorEmail(email);
  if (!usuario) return { enviado: true, email }; // genérico

  const info = await verification.emitir({ usuario, proposito: "redefinir_senha" });
  return { enviado: true, email, ...info };
}

async function redefinirSenha({ email, codigo, novaSenha } = {}) {
  email = String(email || "").trim().toLowerCase();
  if (String(novaSenha || "").length < 6) {
    throw new AppError("A nova senha deve ter ao menos 6 caracteres.");
  }

  const usuario = usuariosRepo.buscarPorEmail(email);
  if (!usuario) throw AppError.naoEncontrado("Conta não encontrada.");

  const registro = verification.pendenteMaisRecente(usuario.id, "redefinir_senha");
  verification.conferir({ registroCodigo: registro, codigo });

  usuariosRepo.atualizar(usuario.id, {
    senhaHash: senha.gerarHash(novaSenha),
    // uma redefinição bem-sucedida também confirma o e-mail
    status: "ativo",
    emailVerificadoEm: usuario.emailVerificadoEm || new Date().toISOString()
  });

  return gerarTokenPara(usuariosRepo.buscarPorId(usuario.id));
}

module.exports = {
  registrar,
  confirmarEmail,
  reenviarCodigo,
  login,
  solicitarRedefinicaoSenha,
  redefinirSenha,
  gerarTokenPara
};
