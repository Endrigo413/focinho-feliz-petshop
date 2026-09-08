"use strict";

const AppError = require("../../lib/AppError");
const geo = require("./geo");

/**
 * Calcula frete e verifica se é possível entregar num CEP.
 *
 * Regra: centro de distribuição na FATEC Taubaté. Entregamos num raio de
 * 40 km. O frete é R$ 0,59 por quilômetro (distância em linha reta até o
 * centro do CEP informado).
 */
function calcularFrete({ cep } = {}) {
  const cepLimpo = geo.normalizarCep(cep);
  if (cepLimpo.length !== 8) {
    throw new AppError("CEP inválido. Informe os 8 dígitos.");
  }

  const destino = geo.coordenadasPorCep(cepLimpo);
  if (!destino) {
    throw new AppError("Não foi possível localizar esse CEP.");
  }

  const distancia = geo.distanciaKm(geo.CENTRO_DISTRIBUICAO, destino);
  const distanciaKm = Math.round(distancia * 10) / 10;
  const entregavel = distancia <= geo.RAIO_ENTREGA_KM;
  const valor = entregavel ? Number((distancia * geo.PRECO_POR_KM).toFixed(2)) : null;

  let prazoDiasUteis = null;
  if (entregavel) {
    prazoDiasUteis = distancia <= 10 ? 1 : distancia <= 25 ? 2 : 3;
  }

  return {
    centroDistribuicao: geo.CENTRO_DISTRIBUICAO.nome,
    origemCidade: geo.CENTRO_DISTRIBUICAO.cidade,
    cep: cepLimpo,
    local: destino.local,
    localAproximado: !!destino.aproximado,
    distanciaKm,
    raioEntregaKm: geo.RAIO_ENTREGA_KM,
    precoPorKm: geo.PRECO_POR_KM,
    entregavel,
    servico: entregavel ? `Entrega — ${destino.local}` : null,
    valor,
    prazoDiasUteis,
    mensagem: entregavel
      ? `Entregamos nesse endereço (~${distanciaKm} km da ${geo.CENTRO_DISTRIBUICAO.nome}).`
      : `Fora da área de entrega: ~${distanciaKm} km da ${geo.CENTRO_DISTRIBUICAO.nome}, ` +
        `acima do limite de ${geo.RAIO_ENTREGA_KM} km.`
  };
}

module.exports = { calcularFrete };
