// Catálogo de serviços do Focinho Feliz Pet Shop

const services = [
  {
    id: "s01",
    nome: "Banho Completo",
    categoria: "estetica",
    duracaoMin: 60,
    preco: 69.9,
    descricao:
      "Banho com shampoo específico para o tipo de pelagem, secagem e escovação finalizadas com perfume pet.",
    icone: "bath"
  },
  {
    id: "s02",
    nome: "Tosa Higiênica",
    categoria: "estetica",
    duracaoMin: 40,
    preco: 49.9,
    descricao: "Aparação de patas, região íntima e barriga. Indicada entre uma tosa completa e outra.",
    icone: "scissors"
  },
  {
    id: "s03",
    nome: "Tosa na Máquina ou Tesoura",
    categoria: "estetica",
    duracaoMin: 90,
    preco: 99.9,
    descricao: "Corte completo definido junto ao tutor, respeitando o padrão da raça.",
    icone: "scissors"
  },
  {
    id: "s04",
    nome: "Consulta Veterinária",
    categoria: "saude",
    duracaoMin: 30,
    preco: 150.0,
    descricao: "Avaliação clínica geral com veterinário responsável, inclui orientação nutricional.",
    icone: "stethoscope"
  },
  {
    id: "s05",
    nome: "Vacinação",
    categoria: "saude",
    duracaoMin: 20,
    preco: 85.0,
    descricao: "Aplicação de vacinas com carteirinha atualizada na hora (valor não inclui a dose).",
    icone: "syringe"
  },
  {
    id: "s06",
    nome: "Hospedagem Diária (Hotelzinho)",
    categoria: "hospedagem",
    duracaoMin: 1440,
    preco: 89.0,
    descricao: "Diária com alimentação, área de recreação supervisionada e monitoramento noturno.",
    icone: "home"
  },
  {
    id: "s07",
    nome: "Adestramento Básico (sessão avulsa)",
    categoria: "comportamento",
    duracaoMin: 50,
    preco: 120.0,
    descricao: "Comandos de obediência, socialização e correção de comportamentos indesejados.",
    icone: "target"
  },
  {
    id: "s08",
    nome: "Táxi Pet (busca e entrega)",
    categoria: "conveniencia",
    duracaoMin: 30,
    preco: 35.0,
    descricao: "Transporte seguro do seu pet até a loja e de volta para casa, em raio de 8km.",
    icone: "car"
  }
];

module.exports = services;
