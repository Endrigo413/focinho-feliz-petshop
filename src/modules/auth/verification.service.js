"use strict";

const store = require("../../db/store");
const config = require("../../config");
const AppError = require("../../lib/AppError");
const senha = require("../../lib/senha");
const email = require("../../lib/email");
const { gerarId } = require("../../lib/id");
const { gerarCodigoNumerico } = require("../../lib/codigo");

const colecao = () => store.colecao("codigos");

const PROPOSITOS = {
  confirmar_email: {
    assunto: "Confirme seu cadastro na Focinho Feliz",
    intro: "Boas-vindas! Para ativar sua conta, informe o código abaixo no site:"
  },
  redefinir_senha: {
    assunto: "Código para redefinir sua senha — Focinho Feliz",
    intro: "Recebemos um pedido para redefinir sua senha. Use o código abaixo:"
  }
};

function ativos(usuarioId, proposito) {
  const agora = Date.now();
  return colecao().filter(
    (c) =>
      c.usuarioId === usuarioId &&
      c.proposito === proposito &&
      !c.usadoEm &&
      new Date(c.expiraEm).getTime() > agora
  );
}

/** Emite (ou reemite) um código e dispara o e-mail. */
async function emitir({ usuario, proposito }) {
  const meta = PROPOSITOS[proposito];
  if (!meta) throw new AppError("Propósito de código inválido.");

  // throttle de reenvio
  const ultimo = colecao()
    .filter((c) => c.usuarioId === usuario.id && c.proposito === proposito)
    .sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1))[0];
  if (ultimo) {
    const desde = (Date.now() - new Date(ultimo.criadoEm).getTime()) / 1000;
    if (desde < config.codigos.reenvioIntervaloSegundos) {
      throw new AppError(
        `Aguarde ${Math.ceil(config.codigos.reenvioIntervaloSegundos - desde)}s para pedir um novo código.`,
        429
      );
    }
  }

  // invalida códigos anteriores do mesmo propósito
  for (const c of ativos(usuario.id, proposito)) c.usadoEm = new Date().toISOString();

  const codigo = gerarCodigoNumerico();
  const agora = new Date();
  const registro = {
    id: gerarId("COD"),
    usuarioId: usuario.id,
    email: usuario.email,
    proposito,
    codigoHash: senha.gerarHash(codigo),
    tentativas: 0,
    expiraEm: new Date(agora.getTime() + config.codigos.expiraEmMinutos * 60000).toISOString(),
    usadoEm: null,
    criadoEm: agora.toISOString()
  };
  colecao().push(registro);
  store.salvar();

  const corpo =
    `Olá, ${usuario.nome}!\n\n${meta.intro}\n\n` +
    `    ${codigo}\n\n` +
    `O código expira em ${config.codigos.expiraEmMinutos} minutos. ` +
    `Se não foi você, ignore este e-mail.\n\n— Equipe Focinho Feliz`;

  const envio = await email.enviar({ para: usuario.email, assunto: meta.assunto, texto: corpo });

  return {
    expiraEm: registro.expiraEm,
    entrega: envio.modo,
    // Em modo dev, devolve o código para facilitar o teste. Nunca em produção/SMTP.
    ...(envio.modo === "dev" ? { codigoDev: codigo } : {})
  };
}

/** Confere um código; em sucesso marca como usado e devolve o registro. */
function conferir({ registroCodigo, codigo }) {
  const c = registroCodigo;
  if (!c) throw new AppError("Nenhum código pendente para este e-mail.", 404);
  if (c.usadoEm) throw new AppError("Este código já foi utilizado. Solicite um novo.");
  if (new Date(c.expiraEm).getTime() <= Date.now()) {
    throw new AppError("Código expirado. Solicite um novo.");
  }
  if (c.tentativas >= config.codigos.maxTentativas) {
    c.usadoEm = new Date().toISOString();
    store.salvar();
    throw new AppError("Muitas tentativas. Solicite um novo código.", 429);
  }

  if (!senha.conferir(String(codigo || "").trim(), c.codigoHash)) {
    c.tentativas += 1;
    store.salvar();
    const restantes = config.codigos.maxTentativas - c.tentativas;
    throw new AppError(
      `Código incorreto.${restantes > 0 ? ` Tentativas restantes: ${restantes}.` : ""}`
    );
  }

  c.usadoEm = new Date().toISOString();
  store.salvar();
  return c;
}

/** Busca o código pendente mais recente para (usuarioId, proposito). */
function pendenteMaisRecente(usuarioId, proposito) {
  return (
    colecao()
      .filter((c) => c.usuarioId === usuarioId && c.proposito === proposito && !c.usadoEm)
      .sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1))[0] || null
  );
}

module.exports = { emitir, conferir, pendenteMaisRecente };
