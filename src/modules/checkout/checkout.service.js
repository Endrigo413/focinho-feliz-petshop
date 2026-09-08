"use strict";

const AppError = require("../../lib/AppError");
const cartService = require("../cart/cart.service");

const FRETE_GRATIS_ACIMA_DE = 199.9;

// Faixa de CEP (primeiro dígito) -> multiplicador de distância a partir de SP.
const REGIAO_POR_DIGITO = {
  0: { nome: "Grande São Paulo", fator: 1.0 },
  1: { nome: "Interior de São Paulo", fator: 1.1 },
  2: { nome: "Rio de Janeiro / Espírito Santo", fator: 1.4 },
  3: { nome: "Minas Gerais", fator: 1.4 },
  4: { nome: "Bahia / Sergipe", fator: 1.8 },
  5: { nome: "Pernambuco / Paraíba / Alagoas / RN", fator: 2.0 },
  6: { nome: "Ceará / Piauí / Maranhão / Norte", fator: 2.3 },
  7: { nome: "Distrito Federal / Goiás / Centro-Oeste", fator: 1.6 },
  8: { nome: "Paraná / Santa Catarina", fator: 1.5 },
  9: { nome: "Rio Grande do Sul", fator: 1.7 }
};

function normalizarCep(cep) {
  const limpo = String(cep || "").replace(/\D/g, "");
  if (limpo.length !== 8) throw new AppError("CEP inválido. Informe 8 dígitos.");
  return limpo;
}

/**
 * Calcula opções de frete (mock) a partir do CEP e do valor da compra.
 * `subtotal` pode vir no corpo; se o usuário estiver logado e não enviar,
 * usa o total do carrinho dele.
 */
function calcularFrete({ cep, subtotal } = {}, usuario) {
  const cepLimpo = normalizarCep(cep);
  const regiao = REGIAO_POR_DIGITO[cepLimpo[0]] || { nome: "Região não mapeada", fator: 2.5 };

  let valorCompra = Number(subtotal);
  if (!Number.isFinite(valorCompra) || valorCompra < 0) {
    valorCompra = usuario ? cartService.obter(usuario.id).total : 0;
  }

  const base = 12.9 * regiao.fator;
  const gratis = valorCompra >= FRETE_GRATIS_ACIMA_DE;

  const opcoes = [
    {
      servico: "PAC",
      transportadora: "Correios",
      prazoDiasUteis: Math.round(3 * regiao.fator) + 2,
      valor: gratis ? 0 : Number(base.toFixed(2)),
      gratis
    },
    {
      servico: "SEDEX",
      transportadora: "Correios",
      prazoDiasUteis: Math.round(1 * regiao.fator) + 1,
      valor: Number((base * 1.8).toFixed(2)),
      gratis: false
    },
    {
      servico: "Retirada na loja",
      transportadora: "Focinho Feliz",
      prazoDiasUteis: 0,
      valor: 0,
      gratis: true
    }
  ];

  return {
    cep: cepLimpo,
    regiao: regiao.nome,
    subtotalConsiderado: Number(valorCompra.toFixed(2)),
    freteGratisAcimaDe: FRETE_GRATIS_ACIMA_DE,
    opcoes
  };
}

module.exports = { calcularFrete };
