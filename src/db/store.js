"use strict";

/**
 * Camada de armazenamento (o "Banco de Dados" da arquitetura em 3 camadas).
 *
 * Implementação simples baseada em arquivo JSON (`data/db.json`), suficiente
 * para um MVP. Toda a aplicação fala com os dados através deste módulo e dos
 * repositórios de cada domínio — trocar por PostgreSQL/MongoDB significa
 * reescrever apenas esta camada, sem tocar em controllers/services.
 */

const fs = require("fs");
const path = require("path");
const config = require("../config");

const COLECOES_PADRAO = () => ({
  usuarios: [],
  categorias: [],
  produtos: [],
  carrinhos: [], // { usuarioId, itens: [{ produtoId, quantidade }], atualizadoEm }
  pedidos: [],
  agendamentos: [],
  eventosPagamento: [], // idempotência de webhooks
  codigos: [], // códigos de confirmação de e-mail / redefinição de senha
  postsBlog: [],
  comentariosBlog: [], // "opiniões" dos leitores
  banners: [],
  promocoes: []
});

let dados = null;

function carregar() {
  if (dados) return dados;

  try {
    if (fs.existsSync(config.paths.bancoJson)) {
      const bruto = fs.readFileSync(config.paths.bancoJson, "utf8");
      dados = { ...COLECOES_PADRAO(), ...JSON.parse(bruto) };
    } else {
      dados = COLECOES_PADRAO();
    }
  } catch (err) {
    console.error("Falha ao ler data/db.json, iniciando vazio:", err.message);
    dados = COLECOES_PADRAO();
  }
  return dados;
}

function salvar() {
  const atual = carregar();
  fs.mkdirSync(path.dirname(config.paths.bancoJson), { recursive: true });
  fs.writeFileSync(config.paths.bancoJson, JSON.stringify(atual, null, 2), "utf8");
}

/** Retorna o array de uma coleção (referência viva — mutar + chamar salvar()). */
function colecao(nome) {
  const atual = carregar();
  if (!atual[nome]) atual[nome] = [];
  return atual[nome];
}

/** Substitui todo o conteúdo (usado pelo seed). */
function redefinir(novoConteudo) {
  dados = { ...COLECOES_PADRAO(), ...novoConteudo };
  salvar();
  return dados;
}

module.exports = { carregar, salvar, colecao, redefinir };
