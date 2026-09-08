// Catálogo de produtos do Focinho Feliz Pet Shop
// Cada produto pertence a uma categoria e pode ser destacado na vitrine.

const products = [
  {
    id: "p01",
    nome: "Ração Premium Cães Adultos 15kg",
    categoria: "racao",
    especie: "cachorro",
    preco: 189.9,
    estoque: 24,
    destaque: true,
    descricao:
      "Fórmula com frango desossado e ômega 6, indicada para raças de médio e grande porte.",
    imagem: "racao-caes"
  },
  {
    id: "p02",
    nome: "Ração Filhotes Gatos 3kg",
    categoria: "racao",
    especie: "gato",
    preco: 79.5,
    estoque: 31,
    destaque: false,
    descricao: "Alta digestibilidade para gatinhos de até 12 meses, enriquecida com colostro.",
    imagem: "racao-gatos"
  },
  {
    id: "p03",
    nome: "Areia Sanitária Aglomerante 4kg",
    categoria: "higiene",
    especie: "gato",
    preco: 34.9,
    estoque: 40,
    destaque: false,
    descricao: "Controle de odor por 7 dias, formação de bolotas firmes para fácil limpeza.",
    imagem: "areia-gatos"
  },
  {
    id: "p04",
    nome: "Shampoo Neutro Dermatológico 500ml",
    categoria: "higiene",
    especie: "todos",
    preco: 42.0,
    estoque: 18,
    destaque: false,
    descricao: "pH balanceado para peles sensíveis, uso semanal recomendado por veterinários.",
    imagem: "shampoo"
  },
  {
    id: "p05",
    nome: "Brinquedo Mordedor de Corda",
    categoria: "brinquedo",
    especie: "cachorro",
    preco: 24.9,
    estoque: 52,
    destaque: true,
    descricao: "Algodão trançado resistente, ajuda na limpeza dos dentes durante a mordida.",
    imagem: "brinquedo-corda"
  },
  {
    id: "p06",
    nome: "Arranhador Torre para Gatos",
    categoria: "brinquedo",
    especie: "gato",
    preco: 149.0,
    estoque: 9,
    destaque: true,
    descricao: "Estrutura de sisal com 80cm de altura e plataforma para descanso.",
    imagem: "arranhador"
  },
  {
    id: "p07",
    nome: "Coleira Peitoral Ajustável",
    categoria: "acessorio",
    especie: "cachorro",
    preco: 59.9,
    estoque: 27,
    destaque: false,
    descricao: "Tecido respirável com fivela de engate rápido, disponível em 4 tamanhos.",
    imagem: "peitoral"
  },
  {
    id: "p08",
    nome: "Caixa de Transporte nº 2",
    categoria: "acessorio",
    especie: "todos",
    preco: 129.9,
    estoque: 12,
    destaque: false,
    descricao: "Ventilação lateral reforçada, aprovada para transporte aéreo doméstico.",
    imagem: "caixa-transporte"
  },
  {
    id: "p09",
    nome: "Petisco Natural Bifinho 200g",
    categoria: "petisco",
    especie: "cachorro",
    preco: 19.9,
    estoque: 60,
    destaque: false,
    descricao: "Carne bovina desidratada sem conservantes artificiais.",
    imagem: "petisco"
  },
  {
    id: "p10",
    nome: "Comedouro Automático com Timer",
    categoria: "acessorio",
    especie: "todos",
    preco: 219.0,
    estoque: 7,
    destaque: true,
    descricao: "Programação de até 4 refeições por dia, reservatório para 2kg de ração.",
    imagem: "comedouro"
  },
  {
    id: "p11",
    nome: "Suplemento Vitamínico Pet 60 tabletes",
    categoria: "saude",
    especie: "todos",
    preco: 68.5,
    estoque: 15,
    destaque: false,
    descricao: "Complexo de vitaminas A, D3 e E para pelagem e imunidade.",
    imagem: "suplemento"
  },
  {
    id: "p12",
    nome: "Antipulgas e Carrapatos Spot-on",
    categoria: "saude",
    especie: "cachorro",
    preco: 54.9,
    estoque: 22,
    destaque: false,
    descricao: "Proteção de até 30 dias, aplicação única na região da nuca.",
    imagem: "antipulgas"
  }
];

module.exports = products;
