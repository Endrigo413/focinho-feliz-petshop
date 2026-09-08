"use strict";

/**
 * Posts do blog do Focinho Feliz (conteúdo semente).
 * Os comentários dos leitores ("opiniões") ficam no banco, na coleção
 * `comentariosBlog`, e podem ser moderados pelo admin.
 */

const posts = [
  {
    id: "post-racao-ideal",
    slug: "como-escolher-a-racao-ideal",
    titulo: "Como escolher a ração ideal para o seu cão",
    resumo: "Porte, idade, nível de atividade e restrições. Um guia rápido para não errar na hora da compra.",
    categoria: "Nutrição",
    autor: "Equipe Nutrição Focinho Feliz",
    emoji: "🍖",
    cor: "#E8A33D",
    publicadoEm: "2026-07-14",
    conteudo: [
      "A ração é a base da saúde do seu cão, e a escolha certa depende de quatro fatores principais: porte, idade, nível de atividade e eventuais restrições de saúde.",
      "Cães de raças pequenas têm metabolismo mais acelerado e mandíbula menor — precisam de grãos menores e maior densidade calórica. Já cães de raças grandes se beneficiam de fórmulas com suporte articular.",
      "Filhotes precisam de mais proteína e cálcio até cerca de 12 meses (24 meses para raças gigantes). Cães idosos, ao contrário, pedem menos calorias e mais fibras.",
      "Na dúvida entre uma linha premium e uma super premium, observe o primeiro ingrediente do rótulo: quanto mais claro o nome da fonte de proteína (\"frango\", \"carne\"), melhor. Evite fórmulas cujo primeiro item é um cereal.",
    ],
  },
  {
    id: "post-jardim-pet",
    slug: "jardim-pet-friendly-plantas-seguras",
    titulo: "Jardim pet friendly: plantas seguras para cães e gatos",
    resumo: "Dá para ter verde em casa sem risco. Veja o que plantar — e o que manter longe do focinho.",
    categoria: "Jardinagem",
    autor: "Ateliê Verde Focinho Feliz",
    emoji: "🌱",
    cor: "#5B9F5B",
    publicadoEm: "2026-08-02",
    conteudo: [
      "Muitos tutores desistem de ter plantas por medo de intoxicar o pet. A boa notícia é que existe uma lista generosa de espécies seguras.",
      "Entre as plantas seguras estão a suculenta Echeveria, a peperômia, a calathea, a palmeira-areca e a violeta africana. Ervas como manjericão, hortelã e salsinha também não oferecem risco e ainda rendem tempero.",
      "Fique longe de: comigo-ninguém-pode, espada-de-são-jorge, lírio (altamente tóxico para gatos), antúrio e costela-de-adão. Mesmo em plantas seguras, o excesso de terra ingerida pode causar desconforto — use cascalho decorativo por cima do substrato.",
      "Para hortas de janela, prefira vasos autoirrigáveis: eles reduzem a terra exposta e mantêm a umidade estável, o que evita que o pet transforme o vaso em cava.",
    ],
  },
  {
    id: "post-primeiro-banho",
    slug: "primeiro-banho-do-filhote",
    titulo: "Primeiro banho do filhote: guia passo a passo",
    resumo: "Quando começar, água na temperatura certa e como secar sem traumatizar.",
    categoria: "Cuidados",
    autor: "Espaço Banho & Tosa Focinho Feliz",
    emoji: "🛁",
    cor: "#5FA0A0",
    publicadoEm: "2026-06-20",
    conteudo: [
      "O primeiro banho deve acontecer só depois do protocolo completo de vacinas, por volta dos 3 a 4 meses. Antes disso, use lenços umedecidos e banho a seco.",
      "A água deve estar morna, próxima da temperatura corporal (37–38 °C). Comece pelas patas e pelo dorso, deixando a cabeça por último, e proteja os ouvidos com algodão.",
      "Use sempre shampoo específico para cães — o pH da pele deles é diferente do nosso. Enxágue muito bem: resíduo de shampoo é a causa número um de coceira pós-banho.",
      "Na secagem, comece com toalha e finalize com secador em temperatura baixa e a pelo menos 20 cm da pele. Transforme o momento em brincadeira e ofereça petisco ao final.",
    ],
  },
  {
    id: "post-gato-apartamento",
    slug: "enriquecimento-ambiental-para-gatos",
    titulo: "Enriquecimento ambiental para gatos de apartamento",
    resumo: "Verticalize a casa, esconda a comida e resgate o instinto de caça do seu gato.",
    categoria: "Comportamento",
    autor: "Equipe Comportamento Focinho Feliz",
    emoji: "🐈",
    cor: "#9B7FB0",
    publicadoEm: "2026-08-19",
    conteudo: [
      "Gato entediado é gato estressado — e estresse felino aparece como xixi fora da caixa, lambedura excessiva e agressividade.",
      "O primeiro passo é verticalizar: prateleiras, arranhadores altos e um ponto de observação perto da janela transformam o território disponível sem ocupar chão.",
      "Comedouros de forrageamento e brinquedos que liberam ração fazem o gato \"trabalhar\" pela comida, o que ocupa tempo e gasta energia mental.",
      "Reserve 10 minutos, duas vezes por dia, para brincadeira com varinha — sempre terminando com uma \"caça\" bem-sucedida e um petisco, para fechar o ciclo caçar–pegar–comer.",
    ],
  },
  {
    id: "post-aquario-agua-doce",
    slug: "montando-seu-primeiro-aquario",
    titulo: "Montando seu primeiro aquário de água doce",
    resumo: "Ciclagem, escolha dos peixes e os erros clássicos de quem está começando.",
    categoria: "Aquarismo",
    autor: "Setor Aquarismo Focinho Feliz",
    emoji: "🐠",
    cor: "#4E86C6",
    publicadoEm: "2026-07-30",
    conteudo: [
      "O maior erro do iniciante é colocar peixes no aquário no mesmo dia. Antes disso vem a ciclagem: de 2 a 4 semanas com o filtro ligado para que as bactérias benéficas colonizem a mídia filtrante.",
      "Um aquário de 30 litros já permite um bom começo. Menos que isso oscila muito de temperatura e de parâmetros de água.",
      "Comece com espécies resistentes: tetras, plati, molinésias e corredoras. Evite bettas com outros peixes e fuja dos peixes que crescem muito, como o \"limpa-vidro\" comum.",
      "Troque de 20% a 30% da água por semana, sempre com condicionador anticloro, e nunca alimente mais do que os peixes consomem em dois minutos.",
    ],
  },
  {
    id: "post-vacinacao",
    slug: "calendario-de-vacinacao-caes-e-gatos",
    titulo: "Vacinação: calendário completo para cães e gatos",
    resumo: "Da primeira dose no filhote ao reforço anual. Imprima e cole na geladeira.",
    categoria: "Saúde",
    autor: "Clínica Veterinária Focinho Feliz",
    emoji: "💉",
    cor: "#C0504D",
    publicadoEm: "2026-05-28",
    conteudo: [
      "Em cães, o protocolo básico começa com a vacina múltipla (V8 ou V10) por volta das 6 semanas, com reforços a cada 3–4 semanas até as 16 semanas. A antirrábica entra a partir das 12 semanas.",
      "Em gatos, a múltipla felina (V3, V4 ou V5) segue lógica parecida, começando entre 6 e 8 semanas, com dois a três reforços. A antirrábica também a partir das 12 semanas.",
      "Depois do protocolo inicial, cães e gatos recebem reforço anual da múltipla e da antirrábica pelo resto da vida.",
      "Vacinas não essenciais — como giárdia, gripe canina e leishmaniose — dependem da rotina do animal e da região. Converse com o veterinário sobre o risco real de exposição.",
    ],
  },
];

module.exports = posts;
