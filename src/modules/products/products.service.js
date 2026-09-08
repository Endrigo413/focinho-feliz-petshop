"use strict";

const repo = require("./products.repository");
const categoriasService = require("../categories/categories.service");
const AppError = require("../../lib/AppError");
const { gerarId } = require("../../lib/id");
const config = require("../../config");

function normalizarPagina(query) {
  let pagina = parseInt(query.pagina, 10);
  let porPagina = parseInt(query.porPagina, 10);
  if (!Number.isFinite(pagina) || pagina < 1) pagina = 1;
  if (!Number.isFinite(porPagina) || porPagina < 1) porPagina = config.paginacao.porPaginaPadrao;
  porPagina = Math.min(porPagina, config.paginacao.porPaginaMax);
  return { pagina, porPagina };
}

/**
 * Lista pública com filtros e paginação.
 * Filtros: busca, categoria, especie, precoMin, precoMax.
 * Mantém as chaves `total` e `produtos` da API v1 e acrescenta metadados de página.
 */
function listar(query = {}) {
  const { busca, categoria, especie, precoMin, precoMax, incluirInativos } = query;
  let itens = repo.listarTodos();

  if (!incluirInativos) {
    itens = itens.filter((p) => p.ativo !== false);
  }
  if (categoria) {
    itens = itens.filter((p) => p.categoria === categoria);
  }
  if (especie) {
    itens = itens.filter((p) => p.especie === especie || p.especie === "todos");
  }
  if (precoMin !== undefined && precoMin !== "") {
    const min = Number(precoMin);
    if (Number.isFinite(min)) itens = itens.filter((p) => p.preco >= min);
  }
  if (precoMax !== undefined && precoMax !== "") {
    const max = Number(precoMax);
    if (Number.isFinite(max)) itens = itens.filter((p) => p.preco <= max);
  }
  if (busca) {
    const termo = String(busca).toLowerCase();
    itens = itens.filter(
      (p) =>
        p.nome.toLowerCase().includes(termo) ||
        (p.descricao || "").toLowerCase().includes(termo)
    );
  }

  const total = itens.length;
  const { pagina, porPagina } = normalizarPagina(query);
  const inicio = (pagina - 1) * porPagina;
  const paginaItens = itens.slice(inicio, inicio + porPagina);

  return {
    total,
    pagina,
    porPagina,
    paginas: Math.max(1, Math.ceil(total / porPagina)),
    produtos: paginaItens
  };
}

function obter(id, { permitirInativo = false } = {}) {
  const produto = repo.buscarPorId(id);
  if (!produto || (!permitirInativo && produto.ativo === false)) {
    throw AppError.naoEncontrado("Produto não encontrado.");
  }
  return produto;
}

function validarCategoria(slug) {
  const existe = categoriasService.listar().some((c) => c.slug === slug);
  if (!existe) throw new AppError(`Categoria "${slug}" não existe.`);
}

function validarPayload(dados, { parcial = false } = {}) {
  const saida = {};
  const obrigatorio = (campo) => {
    if (!parcial) throw new AppError(`Campo obrigatório: ${campo}.`);
  };

  if (dados.nome !== undefined) {
    const nome = String(dados.nome).trim();
    if (nome.length < 2) throw new AppError("Nome do produto inválido.");
    saida.nome = nome;
  } else obrigatorio("nome");

  if (dados.categoria !== undefined) {
    validarCategoria(dados.categoria);
    saida.categoria = dados.categoria;
  } else obrigatorio("categoria");

  if (dados.preco !== undefined) {
    const preco = Number(dados.preco);
    if (!Number.isFinite(preco) || preco < 0) throw new AppError("Preço inválido.");
    saida.preco = Number(preco.toFixed(2));
  } else obrigatorio("preco");

  if (dados.estoque !== undefined) {
    const estoque = Number(dados.estoque);
    if (!Number.isInteger(estoque) || estoque < 0) throw new AppError("Estoque inválido.");
    saida.estoque = estoque;
  } else obrigatorio("estoque");

  if (dados.especie !== undefined) saida.especie = String(dados.especie);
  if (dados.descricao !== undefined) saida.descricao = String(dados.descricao);
  if (dados.imagem !== undefined) saida.imagem = String(dados.imagem);
  if (dados.destaque !== undefined) saida.destaque = Boolean(dados.destaque);
  if (dados.ativo !== undefined) saida.ativo = Boolean(dados.ativo);

  return saida;
}

function criar(dados = {}) {
  const campos = validarPayload(dados);
  const agora = new Date().toISOString();
  const produto = {
    id: gerarId("PRD"),
    especie: "todos",
    descricao: "",
    imagem: "",
    destaque: false,
    ativo: true,
    ...campos,
    criadoEm: agora,
    atualizadoEm: agora
  };
  return repo.inserir(produto);
}

function atualizar(id, dados = {}) {
  obter(id, { permitirInativo: true });
  const campos = validarPayload(dados, { parcial: true });
  return repo.atualizar(id, campos);
}

/** Remoção lógica: mantém histórico de pedidos íntegro. */
function desativar(id) {
  obter(id, { permitirInativo: true });
  return repo.atualizar(id, { ativo: false });
}

module.exports = { listar, obter, criar, atualizar, desativar };
