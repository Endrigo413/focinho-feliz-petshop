"use strict";

const store = require("../../db/store");
const AppError = require("../../lib/AppError");
const produtosRepo = require("../products/products.repository");

const carrinhos = () => store.colecao("carrinhos");

function registroBruto(usuarioId, { criarSeFaltar = false } = {}) {
  let registro = carrinhos().find((c) => c.usuarioId === usuarioId);
  if (!registro && criarSeFaltar) {
    registro = { usuarioId, itens: [], atualizadoEm: new Date().toISOString() };
    carrinhos().push(registro);
  }
  return registro || { usuarioId, itens: [], atualizadoEm: null };
}

/** Expande os itens com dados do produto e calcula subtotais e total. */
function montarResposta(registro) {
  const itens = [];
  let total = 0;

  for (const item of registro.itens) {
    const produto = produtosRepo.buscarPorId(item.produtoId);
    if (!produto || produto.ativo === false) continue; // produto saiu do catálogo

    const subtotal = Number((produto.preco * item.quantidade).toFixed(2));
    total += subtotal;
    itens.push({
      produtoId: produto.id,
      nome: produto.nome,
      precoUnitario: produto.preco,
      quantidade: item.quantidade,
      estoqueDisponivel: produto.estoque,
      subtotal
    });
  }

  return {
    usuarioId: registro.usuarioId,
    itens,
    quantidadeItens: itens.reduce((s, i) => s + i.quantidade, 0),
    total: Number(total.toFixed(2)),
    atualizadoEm: registro.atualizadoEm
  };
}

function obter(usuarioId) {
  return montarResposta(registroBruto(usuarioId));
}

function adicionarItem(usuarioId, { produtoId, quantidade } = {}) {
  const qtd = Number.isFinite(Number(quantidade)) ? Math.trunc(Number(quantidade)) : 1;
  if (qtd < 1) throw new AppError("Quantidade deve ser no mínimo 1.");

  const produto = produtosRepo.buscarPorId(produtoId);
  if (!produto || produto.ativo === false) throw AppError.naoEncontrado("Produto não encontrado.");

  const registro = registroBruto(usuarioId, { criarSeFaltar: true });
  const existente = registro.itens.find((i) => i.produtoId === produtoId);
  const novaQtd = (existente ? existente.quantidade : 0) + qtd;

  if (novaQtd > produto.estoque) {
    throw new AppError(`Estoque insuficiente. Disponível: ${produto.estoque}.`, 409);
  }

  if (existente) existente.quantidade = novaQtd;
  else registro.itens.push({ produtoId, quantidade: qtd });

  registro.atualizadoEm = new Date().toISOString();
  store.salvar();
  return montarResposta(registro);
}

function atualizarItem(usuarioId, produtoId, quantidade) {
  const qtd = Math.trunc(Number(quantidade));
  if (!Number.isFinite(qtd) || qtd < 0) throw new AppError("Quantidade inválida.");

  const registro = registroBruto(usuarioId, { criarSeFaltar: true });
  const item = registro.itens.find((i) => i.produtoId === produtoId);
  if (!item) throw AppError.naoEncontrado("Item não está no carrinho.");

  if (qtd === 0) {
    registro.itens = registro.itens.filter((i) => i.produtoId !== produtoId);
  } else {
    const produto = produtosRepo.buscarPorId(produtoId);
    if (!produto || produto.ativo === false) {
      throw AppError.naoEncontrado("Produto não encontrado.");
    }
    if (qtd > produto.estoque) {
      throw new AppError(`Estoque insuficiente. Disponível: ${produto.estoque}.`, 409);
    }
    item.quantidade = qtd;
  }

  registro.atualizadoEm = new Date().toISOString();
  store.salvar();
  return montarResposta(registro);
}

function removerItem(usuarioId, produtoId) {
  const registro = registroBruto(usuarioId, { criarSeFaltar: true });
  const antes = registro.itens.length;
  registro.itens = registro.itens.filter((i) => i.produtoId !== produtoId);
  if (registro.itens.length === antes) throw AppError.naoEncontrado("Item não está no carrinho.");

  registro.atualizadoEm = new Date().toISOString();
  store.salvar();
  return montarResposta(registro);
}

function limpar(usuarioId) {
  const registro = registroBruto(usuarioId);
  registro.itens = [];
  registro.atualizadoEm = new Date().toISOString();
  store.salvar();
}

module.exports = { obter, adicionarItem, atualizarItem, removerItem, limpar, registroBruto };
