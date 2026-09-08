"use strict";

/**
 * Carregador de .env sem dependência externa.
 * Lê o arquivo .env da raiz do projeto (se existir) e injeta em process.env,
 * sem sobrescrever variáveis que já venham do ambiente.
 */

const fs = require("fs");
const path = require("path");

function carregarArquivoEnv() {
  const caminho = path.resolve(__dirname, "..", "..", ".env");
  if (!fs.existsSync(caminho)) return;

  const conteudo = fs.readFileSync(caminho, "utf8");
  for (const linhaBruta of conteudo.split("\n")) {
    const linha = linhaBruta.trim();
    if (!linha || linha.startsWith("#")) continue;

    const igual = linha.indexOf("=");
    if (igual === -1) continue;

    const chave = linha.slice(0, igual).trim();
    let valor = linha.slice(igual + 1).trim();

    // remove comentário inline e aspas
    const comentario = valor.indexOf(" #");
    if (comentario !== -1) valor = valor.slice(0, comentario).trim();
    valor = valor.replace(/^["']|["']$/g, "");

    if (chave && !(chave in process.env)) {
      process.env[chave] = valor;
    }
  }
}

carregarArquivoEnv();

module.exports = { carregarArquivoEnv };
