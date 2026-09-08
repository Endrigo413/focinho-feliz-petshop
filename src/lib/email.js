"use strict";

/**
 * Serviço de e-mail com transporte plugável.
 *
 *  - Se `SMTP_HOST` estiver configurado E o pacote `nodemailer` estiver
 *    instalado  →  envia de verdade por SMTP (ex.: Gmail).
 *  - Caso contrário  →  modo DEV: grava a mensagem em `data/emails/*.txt`
 *    e imprime um resumo (com o código) no console.
 *
 * A interface pública (`enviar`) não muda entre os modos — o resto da
 * aplicação não sabe qual transporte está ativo.
 */

const fs = require("fs");
const path = require("path");
const config = require("../config");

let transporterSmtp = null;
let modo = "dev";

function inicializar() {
  if (transporterSmtp !== null || modo === "smtp") return;

  const { host, porta, seguro, usuario, senha } = config.email.smtp;
  if (!host) return; // sem SMTP configurado → fica em dev

  let nodemailer;
  try {
    nodemailer = require("nodemailer");
  } catch {
    console.warn(
      "[email] SMTP_HOST definido, mas 'nodemailer' não está instalado. " +
        "Rode `npm install nodemailer`. Usando modo dev por enquanto."
    );
    return;
  }

  transporterSmtp = nodemailer.createTransport({
    host,
    port: porta,
    secure: seguro,
    auth: usuario ? { user: usuario, pass: senha } : undefined
  });
  modo = "smtp";
  console.log(`[email] transporte SMTP ativo (${host}:${porta})`);
}

async function enviarViaArquivo({ para, assunto, texto }) {
  fs.mkdirSync(config.paths.emailsDev, { recursive: true });
  const carimbo = new Date().toISOString().replace(/[:.]/g, "-");
  const arquivo = path.join(config.paths.emailsDev, `${carimbo}__${para}.txt`);

  const conteudo =
    `De:      ${config.email.remetente}\n` +
    `Para:    ${para}\n` +
    `Assunto: ${assunto}\n` +
    `Data:    ${new Date().toISOString()}\n` +
    `${"-".repeat(60)}\n` +
    `${texto}\n`;

  fs.writeFileSync(arquivo, conteudo, "utf8");
  console.log(
    `\n📧 [modo dev] E-mail para ${para} — "${assunto}"\n` +
      `   salvo em ${path.relative(config.paths.raiz, arquivo)}\n` +
      texto
        .split("\n")
        .map((l) => "   " + l)
        .join("\n") +
      "\n"
  );
  return { modo: "dev", arquivo };
}

async function enviar({ para, assunto, texto, html }) {
  inicializar();

  if (modo === "smtp" && transporterSmtp) {
    const info = await transporterSmtp.sendMail({
      from: config.email.remetente,
      to: para,
      subject: assunto,
      text: texto,
      html: html || undefined
    });
    return { modo: "smtp", id: info.messageId };
  }

  return enviarViaArquivo({ para, assunto, texto });
}

module.exports = { enviar, get modo() { return modo; } };
