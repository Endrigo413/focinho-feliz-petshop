"use strict";

/**
 * Lojas físicas do Focinho Feliz e o centro de distribuição.
 * Endereços fictícios em pontos reais de Taubaté/SP.
 * `mapsUrl` abre o Google Maps já com a busca do endereço.
 */

function mapsUrl(endereco) {
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(endereco + ", Taubaté - SP");
}

const brutos = [
  {
    id: "loja-centro",
    tipo: "loja",
    nome: "Focinho Feliz — Centro",
    endereco: "Rua Duque de Caxias, 220 - Centro",
    bairro: "Centro",
    cep: "12010-020",
    telefone: "(12) 3621-1010",
    horario: "Seg. a sáb. 8h–20h · Dom. 9h–14h",
    lat: -23.0262,
    lng: -45.5551,
    servicos: ["Loja", "Banho e Tosa", "Retirada de pedidos"],
  },
  {
    id: "loja-independencia",
    tipo: "loja",
    nome: "Focinho Feliz — Independência",
    endereco: "Avenida Independência, 1650 - Independência",
    bairro: "Independência",
    cep: "12031-000",
    telefone: "(12) 3622-2020",
    horario: "Seg. a sáb. 8h–20h · Dom. 9h–14h",
    lat: -23.0186,
    lng: -45.5623,
    servicos: ["Loja", "Banho e Tosa", "Clínica Veterinária"],
  },
  {
    id: "loja-shopping",
    tipo: "loja",
    nome: "Focinho Feliz — Via Dutra",
    endereco: "Avenida Charles Schnneider, 3000 - Jardim Russi",
    bairro: "Jardim Russi",
    cep: "12081-010",
    telefone: "(12) 3623-3030",
    horario: "Seg. a dom. 10h–22h",
    lat: -23.0009,
    lng: -45.5388,
    servicos: ["Loja", "Retirada de pedidos", "Jardinagem"],
  },
  {
    id: "loja-estiva",
    tipo: "loja",
    nome: "Focinho Feliz — Estiva",
    endereco: "Rua Doutor Souza Alves, 895 - Estiva",
    bairro: "Estiva",
    cep: "12020-030",
    telefone: "(12) 3624-4040",
    horario: "Seg. a sáb. 8h–19h",
    lat: -23.0331,
    lng: -45.5586,
    servicos: ["Loja", "Banho e Tosa", "Hotelzinho"],
  },
  {
    id: "loja-jardim-maria-augusta",
    tipo: "loja",
    nome: "Focinho Feliz — Jd. Maria Augusta",
    endereco: "Avenida Bandeirantes, 4200 - Jardim Maria Augusta",
    bairro: "Jardim Maria Augusta",
    cep: "12070-000",
    telefone: "(12) 3625-5050",
    horario: "Seg. a sáb. 8h–20h · Dom. 9h–13h",
    lat: -23.0451,
    lng: -45.5479,
    servicos: ["Loja", "Clínica Veterinária", "Jardinagem", "Aquarismo"],
  },
  {
    id: "cd-fatec",
    tipo: "cd",
    nome: "Centro de Distribuição — FATEC Taubaté",
    endereco: "Avenida Marechal Deodoro da Fonseca, 605 - Jardim Santa Clara",
    bairro: "Jardim Santa Clara",
    cep: "12080-000",
    telefone: "(12) 3600-9000",
    horario: "Operação logística — não atende ao público",
    lat: -23.0212,
    lng: -45.5553,
    servicos: ["Centro de Distribuição", "Origem das entregas (raio de 40 km)"],
  },
];

const stores = brutos.map((s) => ({ ...s, mapsUrl: mapsUrl(s.endereco) }));

module.exports = stores;
