"use strict";

/**
 * Banners da home e cards de promoção.
 * São semeados no banco (coleção `banners`) e podem ser editados no painel admin.
 */

const banners = [
  {
    id: "ban-racao",
    tipo: "hero",
    ordem: 1,
    titulo: "Ração super premium com até 20% OFF",
    subtitulo: "Leve mais, pague menos. Frango, salmão e carne para cães e gatos.",
    ctaLabel: "Ver ofertas de ração",
    ctaLink: "/produtos?categoria=racao&promo=1",
    emoji: "🍖",
    cor: "#1F4B43",
    corFim: "#2E6B5E",
    ativo: true,
  },
  {
    id: "ban-jardim",
    tipo: "hero",
    ordem: 2,
    titulo: "Seu jardim mais verde chegou na Focinho Feliz",
    subtitulo: "Vasos autoirrigáveis, mudas, sementes e adubos — tudo pet friendly.",
    ctaLabel: "Explorar Jardinagem",
    ctaLink: "/produtos?categoria=jardinagem",
    emoji: "🌱",
    cor: "#3B6B3B",
    corFim: "#5B9F5B",
    ativo: true,
  },
  {
    id: "ban-clinica",
    tipo: "hero",
    ordem: 3,
    titulo: "Banho, tosa e clínica veterinária",
    subtitulo: "Agende online. Primeira consulta com 20% de desconto.",
    ctaLabel: "Agendar serviço",
    ctaLink: "/servicos",
    emoji: "🩺",
    cor: "#8A4B2F",
    corFim: "#C75A3E",
    ativo: true,
  },
];

const promocoes = [
  {
    id: "promo-frete",
    selo: "FRETE GRÁTIS",
    titulo: "Acima de R$ 199 em Taubaté",
    descricao: "Entregas em até 40 km do nosso centro de distribuição.",
    link: "/lojas",
    emoji: "🚚",
    ativo: true,
  },
  {
    id: "promo-assinatura",
    selo: "-10%",
    titulo: "Assinatura de ração",
    descricao: "Programe a entrega e economize todo mês.",
    link: "/produtos?categoria=racao",
    emoji: "🔁",
    ativo: true,
  },
  {
    id: "promo-petisco",
    selo: "LEVE 3 PAGUE 2",
    titulo: "Petiscos e bifinhos selecionados",
    descricao: "Junte os favoritos do seu pet no carrinho.",
    link: "/produtos?categoria=petisco",
    emoji: "🦴",
    ativo: true,
  },
  {
    id: "promo-consulta",
    selo: "-20%",
    titulo: "Primeira consulta veterinária",
    descricao: "Para novos clientes da clínica.",
    link: "/servicos",
    emoji: "🩺",
    ativo: true,
  },
];

module.exports = { banners, promocoes };
