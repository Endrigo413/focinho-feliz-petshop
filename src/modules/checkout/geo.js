"use strict";

/**
 * Geolocalização aproximada por CEP e distância até o centro de distribuição.
 *
 * Sem serviço externo de geocoding: usamos uma tabela de faixas de CEP →
 * coordenadas do centro da cidade/região. É o suficiente para decidir se um
 * endereço está dentro do raio de entrega e estimar o frete por quilômetro.
 */

// Centro de distribuição: FATEC Taubaté (Jd. Santa Clara, Taubaté/SP).
const CENTRO_DISTRIBUICAO = {
  nome: "FATEC Taubaté",
  cidade: "Taubaté/SP",
  lat: -23.0212,
  lng: -45.5553
};

const RAIO_ENTREGA_KM = 40;
const PRECO_POR_KM = 0.59;

/**
 * Faixas de CEP (5 primeiros dígitos, como número) → ponto aproximado.
 * Ordem: mais específico primeiro. O que não casa cai no fallback por dígito.
 */
const FAIXAS = [
  // --- Vale do Paraíba e entorno (dentro ou perto do raio) ---
  { de: 12000, ate: 12099, local: "Taubaté/SP", lat: -23.0264, lng: -45.555 },
  { de: 12100, ate: 12118, local: "Tremembé/SP", lat: -22.9583, lng: -45.5486 },
  { de: 12120, ate: 12139, local: "Tremembé/SP", lat: -22.9583, lng: -45.5486 },
  { de: 12140, ate: 12159, local: "Campos do Jordão/SP", lat: -22.7397, lng: -45.5911 },
  { de: 12160, ate: 12179, local: "Redenção da Serra/SP", lat: -23.2733, lng: -45.5306 },
  { de: 12180, ate: 12199, local: "Natividade da Serra/SP", lat: -23.3722, lng: -45.4444 },
  { de: 12200, ate: 12249, local: "São José dos Campos/SP", lat: -23.1861, lng: -45.8841 },
  { de: 12280, ate: 12299, local: "Caçapava/SP", lat: -23.1008, lng: -45.7072 },
  { de: 12300, ate: 12349, local: "Jacareí/SP", lat: -23.3053, lng: -45.9658 },
  { de: 12400, ate: 12429, local: "Pindamonhangaba/SP", lat: -22.9236, lng: -45.4619 },
  { de: 12440, ate: 12459, local: "Roseira/SP", lat: -22.8983, lng: -45.3053 },
  { de: 12460, ate: 12489, local: "Campos do Jordão/SP", lat: -22.7397, lng: -45.5911 },
  { de: 12490, ate: 12499, local: "São Bento do Sapucaí/SP", lat: -22.6889, lng: -45.7306 },
  { de: 12500, ate: 12529, local: "Guaratinguetá/SP", lat: -22.8164, lng: -45.1928 },
  { de: 12550, ate: 12569, local: "Aparecida/SP", lat: -22.8472, lng: -45.2306 },
  { de: 12570, ate: 12579, local: "Potim/SP", lat: -22.8375, lng: -45.2542 },
  { de: 12580, ate: 12599, local: "Cachoeira Paulista/SP", lat: -22.6656, lng: -45.0114 },
  { de: 12600, ate: 12629, local: "Lorena/SP", lat: -22.7308, lng: -45.1247 },
  { de: 12630, ate: 12699, local: "Cunha/SP", lat: -23.0742, lng: -44.9583 },
  { de: 12700, ate: 12749, local: "Cruzeiro/SP", lat: -22.5758, lng: -44.9631 },
  { de: 12900, ate: 12949, local: "Atibaia/SP", lat: -23.1171, lng: -46.5504 },
  // --- Litoral norte ---
  { de: 11600, ate: 11699, local: "Caraguatatuba/SP", lat: -23.6206, lng: -45.4131 },
  { de: 11660, ate: 11689, local: "Ubatuba/SP", lat: -23.4336, lng: -45.0838 },
  { de: 11700, ate: 11759, local: "Peruíbe/SP", lat: -24.32, lng: -47.0 },
  // --- Outras regiões de SP (longe do raio) ---
  { de: 1000, ate: 5999, local: "São Paulo/SP (capital)", lat: -23.5505, lng: -46.6333 },
  { de: 6000, ate: 6999, local: "Osasco/Barueri/SP", lat: -23.5329, lng: -46.7919 },
  { de: 7000, ate: 7999, local: "Guarulhos/SP", lat: -23.4543, lng: -46.5337 },
  { de: 8000, ate: 8499, local: "São Paulo/SP (zona leste)", lat: -23.54, lng: -46.47 },
  { de: 9000, ate: 9899, local: "Santo André/ABC/SP", lat: -23.6639, lng: -46.5383 },
  { de: 11000, ate: 11499, local: "Santos/SP", lat: -23.9608, lng: -46.3336 },
  { de: 13000, ate: 13139, local: "Campinas/SP", lat: -22.9099, lng: -47.0626 },
  { de: 13400, ate: 13489, local: "Piracicaba/SP", lat: -22.7253, lng: -47.6492 },
  { de: 14000, ate: 14119, local: "Ribeirão Preto/SP", lat: -21.1775, lng: -47.8103 },
  { de: 15000, ate: 15119, local: "São José do Rio Preto/SP", lat: -20.8113, lng: -49.3758 },
  { de: 17000, ate: 17119, local: "Bauru/SP", lat: -22.3147, lng: -49.0606 },
  { de: 18000, ate: 18119, local: "Sorocaba/SP", lat: -23.5015, lng: -47.4526 },
  { de: 19000, ate: 19119, local: "Presidente Prudente/SP", lat: -22.1256, lng: -51.3889 }
];

// Fallback por primeiro dígito do CEP (macro-região do Brasil).
const POR_DIGITO = {
  0: { local: "Grande São Paulo", lat: -23.55, lng: -46.63 },
  1: { local: "Interior de São Paulo", lat: -22.9, lng: -47.06 },
  2: { local: "Rio de Janeiro / Espírito Santo", lat: -22.9068, lng: -43.1729 },
  3: { local: "Minas Gerais", lat: -19.9167, lng: -43.9345 },
  4: { local: "Bahia / Sergipe", lat: -12.9714, lng: -38.5014 },
  5: { local: "Pernambuco / Paraíba / Alagoas / RN", lat: -8.0476, lng: -34.877 },
  6: { local: "Ceará / Norte / Piauí / Maranhão", lat: -3.7319, lng: -38.5267 },
  7: { local: "Centro-Oeste / DF", lat: -15.7939, lng: -47.8828 },
  8: { local: "Paraná / Santa Catarina", lat: -25.4284, lng: -49.2733 },
  9: { local: "Rio Grande do Sul", lat: -30.0346, lng: -51.2177 }
};

function normalizarCep(cep) {
  return String(cep || "").replace(/\D/g, "");
}

function coordenadasPorCep(cepLimpo) {
  const num = parseInt(cepLimpo.slice(0, 5), 10);
  if (Number.isFinite(num)) {
    const faixa = FAIXAS.find((f) => num >= f.de && num <= f.ate);
    if (faixa) {
      return { lat: faixa.lat, lng: faixa.lng, local: faixa.local, aproximado: true };
    }
  }
  const fallback = POR_DIGITO[cepLimpo[0]];
  if (fallback) return { ...fallback, aproximado: true, grosseiro: true };
  return null;
}

// Distância em km pela fórmula de Haversine.
function distanciaKm(a, b) {
  const R = 6371;
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

module.exports = {
  CENTRO_DISTRIBUICAO,
  RAIO_ENTREGA_KM,
  PRECO_POR_KM,
  normalizarCep,
  coordenadasPorCep,
  distanciaKm
};
