"use strict";

/**
 * Implementação mínima de JWT (JSON Web Token) com HMAC-SHA256 (alg "HS256"),
 * usando apenas o módulo `crypto` do Node — sem dependência externa.
 *
 * Não é um substituto completo da biblioteca `jsonwebtoken`, mas cobre
 * assinatura, verificação de assinatura e expiração (claim `exp`).
 */

const crypto = require("crypto");
const config = require("../config");

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlJson(obj) {
  return base64url(JSON.stringify(obj));
}

function decodeBase64url(str) {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64").toString("utf8");
}

function assinar(payload, opcoes = {}) {
  const segredo = opcoes.segredo || config.jwt.segredo;
  const expiraEm = opcoes.expiraEmSegundos || config.jwt.expiraEmSegundos;

  const agora = Math.floor(Date.now() / 1000);
  const corpo = { ...payload, iat: agora, exp: agora + expiraEm };

  const header = base64urlJson({ alg: "HS256", typ: "JWT" });
  const dados = base64urlJson(corpo);
  const assinatura = crypto
    .createHmac("sha256", segredo)
    .update(`${header}.${dados}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${header}.${dados}.${assinatura}`;
}

function verificar(token, opcoes = {}) {
  const segredo = opcoes.segredo || config.jwt.segredo;
  if (typeof token !== "string") return null;

  const partes = token.split(".");
  if (partes.length !== 3) return null;

  const [header, dados, assinatura] = partes;
  const esperada = crypto
    .createHmac("sha256", segredo)
    .update(`${header}.${dados}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const a = Buffer.from(assinatura);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let payload;
  try {
    payload = JSON.parse(decodeBase64url(dados));
  } catch {
    return null;
  }

  if (payload.exp && Math.floor(Date.now() / 1000) >= payload.exp) return null;

  return payload;
}

module.exports = { assinar, verificar };
