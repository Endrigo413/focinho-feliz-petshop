"use strict";

const repo = require("./products.repository");
const categoriasService = require("../categories/categories.service");
const AppError = require("../../lib/AppError");
const { gerarId } = require("../../lib/id");
const config = require("../../config");

const semAcento = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const precoEfetivo = (p) => (p.precoPromocional != null && p.precoPromocional < p.preco ? p.precoPromocional : p.preco);

function normalizarPagina(query) {
  let pagina = parseInt(query.pagina, 10);
  let porPagina = parseInt(query.porPagina, 10);
  if (!Number.isFinite(pagina) || pagina < 1) pagina = 1;
  if (!Number.isFinite(porPagina) || porPagina < 1) porPagina = config.paginacao.porPaginaPadrao;
  porPagina = Math.min(porPagina, config.paginacao.porPaginaMax);
  return { pagina, porPagina };
}

const ORDENADORES = {
  relevancia: (a, b) => Number(b.destaque) - Number(a.destaque) || b.avaliacao - a.avaliacao,
  "menor-preco": (a, b) => precoEfetivo(a) - precoEfetivo(b),
  "maior-preco": (a, b) => precoEfetivo(b) - precoEfetivo(a),
  avaliacao: (a, b) => b.avaliacao - a.avaliacao,
  nome: (a, b) => a.nome.localeCompare(b.nome, "pt-BR")
};

/**
 * Lista pública com filtros, ordenação, paginação e facetas.
 * Filtros: busca, categoria, subcategoria, especie, marca, precoMin, precoMax,
 * promo (só em oferta), avaliacaoMin. Ordenação: `ordenar` (ver ORDENADORES).
 */
function listar(query = {}, { admin = false } = {}) {
  const { busca, categoria, subcategoria, especie, marca, precoMin, precoMax, promo, avaliacaoMin } = query;
  let itens = repo.listarTodos();

  const incluirInativos = admin && (query.incluirInativos === "1" || query.incluirInativos === "true");
  if (!incluirInativos) itens = itens.filter((p) => p.ativo !== false);

  if (categoria) itens = itens.filter((p) => p.categoria === categoria);
  if (subcategoria) itens = itens.filter((p) => p.subcategoria === subcategoria);
  if (especie && especie !== "todos") {
    itens = itens.filter((p) => p.especie === especie || p.especie === "todos");
  }
  if (marca) {
    const marcas = String(marca).split(",").map((m) => m.trim().toLowerCase()).filter(Boolean);
    itens = itens.filter((p) => marcas.includes(String(p.marca).toLowerCase()));
  }
  if (promo === "1" || promo === "true") itens = itens.filter((p) => p.precoPromocional != null);
  if (avaliacaoMin) {
    const min = Number(avaliacaoMin);
    if (Number.isFinite(min)) itens = itens.filter((p) => p.avaliacao >= min);
  }
  if (precoMin !== undefined && precoMin !== "") {
    const min = Number(precoMin);
    if (Number.isFinite(min)) itens = itens.filter((p) => precoEfetivo(p) >= min);
  }
  if (precoMax !== undefined && precoMax !== "") {
    const max = Number(precoMax);
    if (Number.isFinite(max)) itens = itens.filter((p) => precoEfetivo(p) <= max);
  }
  if (busca) {
    const termo = semAcento(busca);
    itens = itens.filter(
      (p) =>
        semAcento(p.nome).includes(termo) ||
        semAcento(p.marca).includes(termo) ||
        semAcento(p.descricao).includes(termo) ||
        semAcento(p.subcategoria).includes(termo) ||
        (p.tags || []).some((t) => semAcento(t).includes(termo))
    );
  }

  // facetas (calculadas antes da paginação, sobre o conjunto filtrado sem preço/marca? — usamos o filtrado atual)
  const marcasDisponiveis = [...new Set(itens.map((p) => p.marca))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const precos = itens.map(precoEfetivo);
  const facetas = {
    marcas: marcasDisponiveis,
    precoMin: precos.length ? Math.floor(Math.min(...precos)) : 0,
    precoMax: precos.length ? Math.ceil(Math.max(...precos)) : 0
  };

  const ordenador = ORDENADORES[query.ordenar] || ORDENADORES.relevancia;
  itens = itens.slice().sort(ordenador);

  const total = itens.length;
  const { pagina, porPagina } = normalizarPagina(query);
  const inicio = (pagina - 1) * porPagina;

  return {
    total,
    pagina,
    porPagina,
    paginas: Math.max(1, Math.ceil(total / porPagina)),
    facetas,
    produtos: itens.slice(inicio, inicio + porPagina)
  };
}

function obter(id, { permitirInativo = false } = {}) {
  const produto = repo.buscarPorId(id);
  if (!produto || (!permitirInativo && produto.ativo === false)) {
    throw AppError.naoEncontrado("Produto não encontrado.");
  }
  return produto;
}

function relacionados(id, limite = 8) {
  const alvo = repo.buscarPorId(id);
  if (!alvo) return [];
  return repo
    .listarTodos()
    .filter((p) => p.ativo !== false && p.id !== id && p.categoria === alvo.categoria)
    .sort((a, b) => Number(a.subcategoria !== alvo.subcategoria) - Number(b.subcategoria !== alvo.subcategoria))
    .slice(0, limite);
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

  if (dados.precoPromocional !== undefined) {
    if (dados.precoPromocional === null || dados.precoPromocional === "") {
      saida.precoPromocional = null;
    } else {
      const promo = Number(dados.precoPromocional);
      if (!Number.isFinite(promo) || promo < 0) throw new AppError("Preço promocional inválido.");
      saida.precoPromocional = Number(promo.toFixed(2));
    }
  }

  if (dados.especie !== undefined) saida.especie = String(dados.especie);
  if (dados.subcategoria !== undefined) saida.subcategoria = String(dados.subcategoria);
  if (dados.marca !== undefined) saida.marca = String(dados.marca).trim();
  if (dados.descricao !== undefined) saida.descricao = String(dados.descricao);
  if (dados.emoji !== undefined) saida.emoji = String(dados.emoji).slice(0, 4);
  if (dados.imagem !== undefined) saida.imagem = String(dados.imagem);
  if (dados.destaque !== undefined) saida.destaque = Boolean(dados.destaque);
  if (dados.ativo !== undefined) saida.ativo = Boolean(dados.ativo);
  if (dados.tags !== undefined) {
    saida.tags = Array.isArray(dados.tags)
      ? dados.tags.map(String)
      : String(dados.tags).split(",").map((t) => t.trim()).filter(Boolean);
  }

  return saida;
}

function criar(dados = {}) {
  const campos = validarPayload(dados);
  const secao = categoriasService.listar().find((c) => c.slug === campos.categoria);
  const agora = new Date().toISOString();
  const produto = {
    id: gerarId("PRD"),
    especie: "todos",
    subcategoria: (secao && secao.subcategorias && secao.subcategorias[0]) || "Geral",
    marca: "Focinho Feliz",
    descricao: "",
    precoPromocional: null,
    emoji: (secao && secao.emoji) || "🐾",
    cor: (secao && secao.cor) || "#1F4B43",
    imagem: "",
    destaque: false,
    ativo: true,
    avaliacao: 5,
    numAvaliacoes: 0,
    tags: [],
    ...campos,
    criadoEm: agora,
    atualizadoEm: agora
  };
  return repo.inserir(produto);
}

function atualizar(id, dados = {}) {
  obter(id, { permitirInativo: true });
  const campos = validarPayload(dados, { parcial: true });
  // se mudou a categoria, acompanha emoji/cor da nova seção quando não vier explícito
  if (campos.categoria) {
    const secao = categoriasService.listar().find((c) => c.slug === campos.categoria);
    if (secao) {
      if (campos.emoji === undefined) campos.emoji = secao.emoji;
      campos.cor = secao.cor;
    }
  }
  return repo.atualizar(id, campos);
}

/** Remoção lógica: mantém histórico de pedidos íntegro. */
function desativar(id) {
  obter(id, { permitirInativo: true });
  return repo.atualizar(id, { ativo: false });
}

function reativar(id) {
  obter(id, { permitirInativo: true });
  return repo.atualizar(id, { ativo: true });
}

module.exports = { listar, obter, relacionados, criar, atualizar, desativar, reativar };
