"use strict";

/**
 * Hash de senha com scrypt (recomendado pelo OWASP) usando o módulo `crypto`.
 * Formato armazenado: `scrypt$<salt-hex>$<hash-hex>`.
 */

const crypto = require("crypto");

const KEYLEN = 64;

function gerarHash(senhaPura) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivado = crypto.scryptSync(String(senhaPura), salt, KEYLEN).toString("hex");
  return `scrypt$${salt}$${derivado}`;
}

function conferir(senhaPura, hashArmazenado) {
  if (typeof hashArmazenado !== "string") return false;
  const [algoritmo, salt, hashHex] = hashArmazenado.split("$");
  if (algoritmo !== "scrypt" || !salt || !hashHex) return false;

  const derivado = crypto.scryptSync(String(senhaPura), salt, KEYLEN);
  const alvo = Buffer.from(hashHex, "hex");
  if (derivado.length !== alvo.length) return false;
  return crypto.timingSafeEqual(derivado, alvo);
}

module.exports = { gerarHash, conferir };
