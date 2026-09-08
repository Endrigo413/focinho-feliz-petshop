"use strict";

const crypto = require("crypto");
const config = require("../config");

/** Gera um código numérico (string) com o tamanho configurado, ex.: "048213". */
function gerarCodigoNumerico() {
  const tamanho = config.codigos.tamanho;
  const max = 10 ** tamanho;
  const n = crypto.randomInt(0, max);
  return String(n).padStart(tamanho, "0");
}

module.exports = { gerarCodigoNumerico };
