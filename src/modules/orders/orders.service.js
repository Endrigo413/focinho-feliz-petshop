"use strict";

const crypto = require("crypto");
const store = require("../../db/store");
const AppError = require("../../lib/AppError");
const { gerarId } = require("../../lib/id");
const repo = require("./orders.repository");
const gateway = require("./payment.gateway");
const produtosRepo = require("../products/products.repository");
const cartService = require("../cart/cart.service");
const checkoutService = require("../checkout/checkout.service");

/* ----------------------------- helpers ----------------------------- */

/**
 * Define o frete do pedido. Se vier `cep`, recalcula no servidor (não confia
 * no valor do cliente) e recusa o pedido se o endereço estiver fora do raio.
 */
function resolverFrete(body = {}) {
  if (body.cep) {
    const r = checkoutService.calcularFrete({ cep: body.cep });
    if (!r.entregavel) {
      throw new AppError(
        `Não entregamos nesse CEP. ${r.mensagem} Retire na loja ou escolha outro endereço.`,
        422
      );
    }
    return { servico: r.servico, valor: r.valor, prazoDiasUteis: r.prazoDiasUteis };
  }
  return body.frete;
}

function ajustarEstoque(itens, sinal) {
  for (const item of itens) {
    const produto = produtosRepo.buscarPorId(item.produtoId);
    if (produto) {
      produto.estoque = Math.max(0, produto.estoque + sinal * item.quantidade);
      produto.atualizadoEm = new Date().toISOString();
    }
  }
  store.salvar();
}

/**
 * Valida uma lista de { id/produtoId, quantidade } contra o catálogo,
 * confere estoque e devolve as linhas do pedido + subtotal.
 */
function montarItens(entrada) {
  if (!Array.isArray(entrada) || entrada.length === 0) {
    throw new AppError("O carrinho está vazio.");
  }

  const itens = [];
  let subtotal = 0;

  for (const linha of entrada) {
    const produtoId = linha.produtoId || linha.id;
    const quantidade = Math.trunc(Number(linha.quantidade) || 1);
    if (quantidade < 1) throw new AppError("Quantidade inválida no carrinho.");

    const produto = produtosRepo.buscarPorId(produtoId);
    if (!produto || produto.ativo === false) {
      throw new AppError(`Produto ${produtoId} não está disponível.`);
    }
    if (quantidade > produto.estoque) {
      throw new AppError(`Estoque insuficiente para "${produto.nome}". Disponível: ${produto.estoque}.`, 409);
    }

    const subtotalItem = Number((produto.preco * quantidade).toFixed(2));
    subtotal += subtotalItem;
    itens.push({
      produtoId: produto.id,
      nome: produto.nome,
      precoUnitario: produto.preco,
      quantidade,
      subtotal: subtotalItem
    });
  }

  return { itens, subtotal: Number(subtotal.toFixed(2)) };
}

function normalizarFrete(frete) {
  if (frete == null) return { servico: "A combinar", valor: 0 };
  if (typeof frete === "number") return { servico: "Padrão", valor: Number(frete.toFixed(2)) };
  return {
    servico: String(frete.servico || "Padrão"),
    valor: Number(Number(frete.valor || 0).toFixed(2)),
    prazoDiasUteis: frete.prazoDiasUteis
  };
}

function statusInicial(metodo) {
  if (metodo === "dinheiro") return "aguardando entrega";
  return "aguardando pagamento";
}

function criarPedido({ usuarioId, cliente, itens, subtotal, enderecoEntrega, formaPagamento, frete }) {
  const freteNorm = normalizarFrete(frete);
  const total = Number((subtotal + freteNorm.valor).toFixed(2));
  const id = gerarId("PED");

  const cobranca = gateway.criarCobranca({
    valor: total,
    metodo: formaPagamento,
    pedidoId: id,
    pagador: cliente
  });

  const agora = new Date().toISOString();
  const pedido = {
    id,
    usuarioId: usuarioId || null,
    cliente,
    itens,
    subtotal,
    frete: freteNorm,
    total,
    enderecoEntrega: enderecoEntrega || null,
    formaPagamento: cobranca.metodo,
    pagamento: cobranca,
    status: statusInicial(cobranca.metodo),
    rastreamento: null,
    historico: [{ status: statusInicial(cobranca.metodo), em: agora }],
    criadoEm: agora,
    atualizadoEm: agora
  };

  ajustarEstoque(itens, -1); // reserva o estoque
  repo.inserir(pedido);
  return pedido;
}

/* --------------------------- casos de uso --------------------------- */

/** POST /api/orders autenticado: fecha o carrinho do usuário. */
function criarParaUsuario(usuario, body = {}) {
  // Dois modos: itens no corpo (carrinho do front-end) OU carrinho do servidor.
  const usaCorpo = Array.isArray(body.itens) && body.itens.length > 0;
  const origem = usaCorpo ? body.itens : cartService.registroBruto(usuario.id).itens;
  const { itens, subtotal } = montarItens(origem);
  const frete = resolverFrete(body);

  const clienteBody = body.cliente || {};
  const pedido = criarPedido({
    usuarioId: usuario.id,
    cliente: {
      nome: clienteBody.nome || usuario.nome,
      email: usuario.email,
      telefone: clienteBody.telefone || body.telefone || usuario.telefone || ""
    },
    itens,
    subtotal,
    enderecoEntrega:
      body.enderecoEntrega ||
      clienteBody.endereco ||
      (usuario.enderecos && usuario.enderecos[0]) ||
      null,
    formaPagamento: body.formaPagamento || "pix",
    frete
  });

  if (!usaCorpo) cartService.limpar(usuario.id);
  return pedido;
}

/** POST /api/orders sem login: comportamento compatível com a API v1. */
function criarComoVisitante(body = {}) {
  const { cliente, itens: itensEntrada, formaPagamento } = body;
  if (!cliente || !cliente.nome || !cliente.telefone) {
    throw new AppError("Informe nome e telefone do cliente.");
  }
  const { itens, subtotal } = montarItens(itensEntrada);
  const frete = resolverFrete(body);

  return criarPedido({
    usuarioId: null,
    cliente: {
      nome: String(cliente.nome),
      telefone: String(cliente.telefone),
      email: cliente.email ? String(cliente.email) : undefined
    },
    itens,
    subtotal,
    enderecoEntrega: cliente.endereco || null,
    formaPagamento: formaPagamento || "pix",
    frete
  });
}

function listarHistorico(usuarioId) {
  const pedidos = repo.listarPorUsuario(usuarioId);
  return { total: pedidos.length, pedidos };
}

function obterParaUsuario(id, usuario) {
  const pedido = repo.buscarPorId(id);
  if (!pedido) throw AppError.naoEncontrado("Pedido não encontrado.");

  const ehDono = usuario && pedido.usuarioId === usuario.id;
  const ehAdmin = usuario && usuario.papel === "admin";
  const ehPedidoDeVisitante = !pedido.usuarioId;

  if (!ehDono && !ehAdmin && !ehPedidoDeVisitante) {
    throw AppError.proibido("Você não tem acesso a este pedido.");
  }
  return pedido;
}

/* ----------------------------- webhook ----------------------------- */

const MAPA_STATUS = {
  "payment.approved": { pagamento: "aprovado", pedido: "em separação", estoque: 0 },
  "payment.pending": { pagamento: "pendente", pedido: "aguardando pagamento", estoque: 0 },
  "payment.failed": { pagamento: "recusado", pedido: "pagamento recusado", estoque: +1 },
  "payment.refunded": { pagamento: "reembolsado", pedido: "reembolsado", estoque: +1 },
  "payment.chargeback": { pagamento: "chargeback", pedido: "cancelado", estoque: +1 }
};

function processarWebhook({ rawBody, assinatura, evento }) {
  if (!gateway.verificarAssinatura(rawBody, assinatura)) {
    throw AppError.naoAutorizado("Assinatura do webhook inválida.");
  }
  if (!evento || typeof evento !== "object") {
    throw new AppError("Corpo do webhook inválido.");
  }

  const tipo = evento.tipo || evento.type;
  const dados = evento.dados || evento.data || {};
  const pagamentoId = dados.pagamentoId || dados.payment_id || dados.id;

  // idempotência
  const eventoId =
    evento.id ||
    crypto.createHash("sha256").update(rawBody || JSON.stringify(evento)).digest("hex").slice(0, 24);
  const jaVistos = store.colecao("eventosPagamento");
  if (jaVistos.some((e) => e.id === eventoId)) {
    return { jaProcessado: true, eventoId };
  }

  const regra = MAPA_STATUS[tipo];
  const pedido = pagamentoId ? repo.buscarPorPagamentoId(pagamentoId) : null;

  if (regra && pedido) {
    const agora = new Date().toISOString();
    pedido.pagamento.status = regra.pagamento;
    pedido.pagamento.atualizadoEm = agora;
    pedido.status = regra.pedido;
    pedido.atualizadoEm = agora;
    pedido.historico.push({ status: regra.pedido, em: agora, origem: "webhook", tipo });

    if (regra.estoque > 0) ajustarEstoque(pedido.itens, +1); // devolve estoque
    if (tipo === "payment.approved" && !pedido.rastreamento) {
      pedido.rastreamento = {
        codigo: gerarId("BR").toUpperCase(),
        transportadora: pedido.frete.servico,
        historico: [{ status: "Objeto postado", em: agora }]
      };
    }
    repo.salvarAlteracoes();
  }

  jaVistos.push({ id: eventoId, tipo, pagamentoId: pagamentoId || null, recebidoEm: new Date().toISOString() });
  store.salvar();

  return {
    recebido: true,
    eventoId,
    pedidoAtualizado: pedido ? pedido.id : null,
    novoStatus: pedido ? pedido.status : null
  };
}

module.exports = {
  criarParaUsuario,
  criarComoVisitante,
  listarHistorico,
  obterParaUsuario,
  processarWebhook
};
