"use strict";

/**
 * Catálogo do Focinho Feliz.
 *
 * Para manter o arquivo legível, os produtos são gerados a partir de
 * "templates": cada template vira um ou mais produtos, combinando variações
 * (tamanho/porte) e sabores. O resultado tem 30+ itens por seção.
 *
 * Campos de cada produto:
 *   id, nome, categoria, subcategoria, especie, marca, preco,
 *   precoPromocional (ou null), estoque, destaque, avaliacao, numAvaliacoes,
 *   descricao, emoji, cor, tags[], ativo
 */

let seq = 0;
const novoId = () => "PRD" + String(++seq).padStart(4, "0");
const cent = (v) => Math.round(v * 100) / 100;

const SECOES = {
  racao: {
    rotulo: "Ração",
    emoji: "🍖",
    cor: "#E8A33D",
    especie: "cachorro",
    subcategorias: ["Cães Adultos", "Cães Filhotes", "Gatos Adultos", "Gatos Filhotes", "Raças Pequenas", "Úmida / Sachê"],
    templates: [
      { nome: "Ração Golden Fórmula Cães Adultos", marca: "Golden", preco: 22.9, sub: "Cães Adultos", destaque: true, promo: 0.15,
        variacoes: [["1kg", 1], ["3kg", 2.6], ["10,1kg", 7.2], ["15kg", 9.6]], sabores: ["Frango & Carne", "Salmão & Arroz"], tags: ["super premium"] },
      { nome: "Ração Premier Fórmula Cães Filhotes", marca: "Premier", preco: 31.9, sub: "Cães Filhotes",
        variacoes: [["1kg", 1], ["3kg", 2.7], ["12kg", 9.1]], sabores: ["Frango"], tags: ["filhote"] },
      { nome: "Ração Royal Canin Mini Adult", marca: "Royal Canin", preco: 79.9, sub: "Raças Pequenas", promo: 0.1,
        variacoes: [["1kg", 1], ["2,5kg", 2.3], ["7,5kg", 6.1]], sabores: [""], tags: ["raças pequenas"] },
      { nome: "Ração Whiskas Gatos Adultos", marca: "Whiskas", preco: 19.9, sub: "Gatos Adultos", especie: "gato", promo: 0.12,
        variacoes: [["1kg", 1], ["3kg", 2.7], ["10,1kg", 8.4]], sabores: ["Carne", "Peixe", "Frango"] },
      { nome: "Ração GranPlus Gatos Castrados", marca: "GranPlus", preco: 33.9, sub: "Gatos Adultos", especie: "gato",
        variacoes: [["1,5kg", 1], ["3kg", 1.9], ["10,1kg", 6.0]], sabores: ["Frango & Arroz", "Salmão"] },
      { nome: "Ração Úmida Sachê Pedigree Cães", marca: "Pedigree", preco: 3.29, sub: "Úmida / Sachê", estoque: 160,
        variacoes: [["85g", 1]], sabores: ["Carne ao Molho", "Frango", "Vegetais"] },
      { nome: "Ração Úmida Sachê Whiskas Gatos", marca: "Whiskas", preco: 2.89, sub: "Úmida / Sachê", especie: "gato", estoque: 180,
        variacoes: [["85g", 1]], sabores: ["Atum", "Salmão", "Carne", "Frango"] },
      { nome: "Ração N&D Grain Free Gatos", marca: "Farmina", preco: 96.0, sub: "Gatos Adultos", especie: "gato", promo: 0.08,
        variacoes: [["1,5kg", 1], ["5kg", 3.1]], sabores: ["Frango & Romã"], tags: ["grain free"] },
    ],
  },

  petisco: {
    rotulo: "Petiscos",
    emoji: "🦴",
    cor: "#C75A3E",
    especie: "cachorro",
    subcategorias: ["Bifinhos", "Ossos & Mordedores", "Biscoitos", "Snacks Naturais", "Dental"],
    templates: [
      { nome: "Bifinho Dog's Way", marca: "Dog's Way", preco: 9.9, sub: "Bifinhos", estoque: 120, promo: 0.2, destaque: true,
        variacoes: [["60g", 1], ["1kg", 12]], sabores: ["Carne", "Frango", "Bacon", "Vegetais"] },
      { nome: "Osso Nó Prensado Natural", marca: "Chalesco", preco: 7.5, sub: "Ossos & Mordedores", estoque: 90,
        variacoes: ['5"', '7"', '9"'].map((r, i) => [r, 1 + i * 0.7]), sabores: [""] },
      { nome: "Biscoito Integral Cãopanheiro", marca: "Cãopanheiro", preco: 12.9, sub: "Biscoitos", estoque: 80,
        variacoes: [["500g", 1], ["1kg", 1.8]], sabores: ["Banana & Aveia", "Carne", "Frutas"] },
      { nome: "Snack Desidratado Natural", marca: "Furacão Pet", preco: 14.9, sub: "Snacks Naturais", estoque: 70, promo: 0.1,
        variacoes: [["80g", 1]], sabores: ["Orelha Bovina", "Moela", "Filé de Frango", "Fígado"] },
      { nome: "Petisco Dental Dentastix", marca: "Pedigree", preco: 16.9, sub: "Dental", estoque: 110,
        variacoes: [["Pequeno", 1], ["Médio", 1.15], ["Grande", 1.3]], sabores: [""] },
      { nome: "Sachê Cremoso para Gatos Churu", marca: "Inaba", preco: 5.9, sub: "Snacks Naturais", especie: "gato", estoque: 140,
        variacoes: [["4un", 1]], sabores: ["Atum", "Frango", "Salmão", "Frango & Siri"] },
      { nome: "Petisco Bau Bites Cães", marca: "Bau", preco: 11.5, sub: "Bifinhos", estoque: 95,
        variacoes: [["150g", 1]], sabores: ["Cordeiro", "Salmão", "Pato"] },
    ],
  },

  higiene: {
    rotulo: "Higiene & Beleza",
    emoji: "🧴",
    cor: "#5FA0A0",
    especie: "todos",
    subcategorias: ["Shampoo & Condicionador", "Perfumes & Colônias", "Higiene Bucal", "Tapetes & Absorventes", "Cuidado com Patas", "Sanitário Gatos"],
    templates: [
      { nome: "Shampoo Sanol Dog", marca: "Sanol", preco: 18.9, sub: "Shampoo & Condicionador", promo: 0.1, destaque: true,
        variacoes: [["500ml", 1], ["2L", 3.4], ["5L", 7.6]], sabores: ["Neutro", "Pelos Claros", "Filhotes", "Antipulgas"] },
      { nome: "Condicionador Hidratante Pet Society", marca: "Pet Society", preco: 24.9, sub: "Shampoo & Condicionador",
        variacoes: [["300ml", 1], ["1L", 2.8]], sabores: ["Karité", "Aloe Vera"] },
      { nome: "Colônia Perfume Pet Clean", marca: "Pet Clean", preco: 21.9, sub: "Perfumes & Colônias",
        variacoes: [["120ml", 1]], sabores: ["Fabuloso", "Baby", "Amora", "Talco"] },
      { nome: "Tapete Higiênico Super Secão", marca: "Bravpet", preco: 39.9, sub: "Tapetes & Absorventes", estoque: 130, promo: 0.18,
        variacoes: [["30un", 1], ["50un", 1.5], ["90un", 2.4]], sabores: [""] },
      { nome: "Creme Dental Enzimático Sanol", marca: "Sanol", preco: 15.9, sub: "Higiene Bucal",
        variacoes: [["90g", 1]], sabores: ["Carne", "Menta"] },
      { nome: "Areia Sanitária Aglomerante Pipicat", marca: "Pipicat", preco: 27.9, sub: "Sanitário Gatos", especie: "gato", estoque: 100,
        variacoes: [["4kg", 1], ["12kg", 2.7]], sabores: ["Tradicional", "Lavanda", "Antibacteriana"] },
      { nome: "Bálsamo Protetor de Patas", marca: "Pet Society", preco: 29.9, sub: "Cuidado com Patas",
        variacoes: [["60g", 1]], sabores: [""] },
      { nome: "Lenço Umedecido Pet", marca: "TropiClean", preco: 17.9, sub: "Cuidado com Patas", estoque: 120,
        variacoes: [["100un", 1]], sabores: ["Coco", "Aveia"] },
    ],
  },

  brinquedo: {
    rotulo: "Brinquedos",
    emoji: "🎾",
    cor: "#7C9D5B",
    especie: "todos",
    subcategorias: ["Bolas", "Mordedores", "Cordas & Pelúcias", "Interativos", "Arranhadores", "Varinhas para Gatos"],
    templates: [
      { nome: "Bola Maciça de Borracha", marca: "Furacão Pet", preco: 12.9, sub: "Bolas", estoque: 140, promo: 0.15,
        variacoes: [["P", 1], ["M", 1.4], ["G", 1.9]], sabores: ["Azul", "Vermelho", "Verde"] },
      { nome: "Mordedor Kong Classic", marca: "Kong", preco: 59.9, sub: "Mordedores", destaque: true, promo: 0.1,
        variacoes: [["S", 1], ["M", 1.25], ["L", 1.6]], sabores: [""], tags: ["resistente"] },
      { nome: "Corda Dental Trançada", marca: "Chalesco", preco: 16.9, sub: "Cordas & Pelúcias", estoque: 110,
        variacoes: [["2 nós", 1], ["3 nós", 1.5]], sabores: ["Colorida", "Natural"] },
      { nome: "Brinquedo Interativo Comedouro Lento", marca: "Outward Hound", preco: 74.9, sub: "Interativos",
        variacoes: [["Nível 1", 1], ["Nível 2", 1.2]], sabores: [""] },
      { nome: "Arranhador Torre com Toca", marca: "São Pet", preco: 149.0, sub: "Arranhadores", especie: "gato", promo: 0.12,
        variacoes: [["60cm", 1], ["90cm", 1.5], ["120cm", 2.1]], sabores: ["Bege", "Cinza"] },
      { nome: "Varinha com Penas e Guizo", marca: "Jambo", preco: 13.9, sub: "Varinhas para Gatos", especie: "gato", estoque: 130,
        variacoes: [["Penas", 1], ["Rato de Pelúcia", 1], ["Fita", 1]], sabores: [""] },
      { nome: "Pelúcia com Chiado", marca: "Chalesco", preco: 24.9, sub: "Cordas & Pelúcias", estoque: 90,
        variacoes: [["Pequena", 1], ["Grande", 1.4]], sabores: ["Raposa", "Guaxinim", "Preguiça"] },
      { nome: "Bola Dispenser de Petiscos", marca: "PetGames", preco: 34.9, sub: "Interativos",
        variacoes: [["M", 1], ["G", 1.3]], sabores: [""] },
    ],
  },

  acessorio: {
    rotulo: "Acessórios",
    emoji: "🎒",
    cor: "#9B7FB0",
    especie: "todos",
    subcategorias: ["Coleiras & Guias", "Camas & Casinhas", "Comedouros & Bebedouros", "Transporte", "Vestuário", "Passeio"],
    templates: [
      { nome: "Coleira Peitoral Ajustável Air Mesh", marca: "Mission Pets", preco: 44.9, sub: "Coleiras & Guias", promo: 0.15, destaque: true,
        variacoes: [["PP", 1], ["P", 1], ["M", 1.1], ["G", 1.25], ["GG", 1.4]], sabores: ["Preto", "Vinho", "Azul", "Rosa"] },
      { nome: "Guia Retrátil 5m", marca: "Ferplast", preco: 69.9, sub: "Coleiras & Guias",
        variacoes: [["Até 15kg", 1], ["Até 30kg", 1.3], ["Até 50kg", 1.6]], sabores: ["Preto", "Vermelho"] },
      { nome: "Cama Iglu Aconchego", marca: "Jambo", preco: 129.0, sub: "Camas & Casinhas", promo: 0.2,
        variacoes: [["P", 1], ["M", 1.35], ["G", 1.8]], sabores: ["Cinza", "Caramelo"] },
      { nome: "Comedouro Duplo Inox com Suporte", marca: "Chalesco", preco: 54.9, sub: "Comedouros & Bebedouros",
        variacoes: [["350ml", 1], ["600ml", 1.3], ["900ml", 1.6]], sabores: [""] },
      { nome: "Bebedouro Fonte Automática", marca: "PetLon", preco: 119.0, sub: "Comedouros & Bebedouros", promo: 0.1,
        variacoes: [["1,5L", 1], ["2,5L", 1.4]], sabores: ["Branco", "Cinza"] },
      { nome: "Caixa de Transporte Furacão", marca: "Furacão Pet", preco: 89.9, sub: "Transporte",
        variacoes: [["Nº 1", 1], ["Nº 2", 1.25], ["Nº 3", 1.6], ["Nº 4", 2.1]], sabores: ["Azul", "Rosa", "Bege"] },
      { nome: "Roupa Moletom Pet", marca: "Pet Fashion", preco: 39.9, sub: "Vestuário", estoque: 90,
        variacoes: [["P", 1], ["M", 1.1], ["G", 1.2]], sabores: ["Cinza", "Vermelho", "Xadrez"] },
      { nome: "Cinto de Segurança para Cães", marca: "Tudo Pet", preco: 22.9, sub: "Passeio", estoque: 120,
        variacoes: [["Único", 1]], sabores: ["Preto"] },
    ],
  },

  saude: {
    rotulo: "Farmácia",
    emoji: "💊",
    cor: "#C0504D",
    especie: "todos",
    subcategorias: ["Antipulgas & Carrapatos", "Vermífugos", "Suplementos", "Dermatológicos", "Oftálmico & Ouvido", "Fitoterápicos"],
    templates: [
      { nome: "Antipulgas Bravecto", marca: "MSD", preco: 189.0, sub: "Antipulgas & Carrapatos", destaque: true, promo: 0.08,
        variacoes: [["2-4,5kg", 1], ["4,5-10kg", 1.1], ["10-20kg", 1.25], ["20-40kg", 1.4]], sabores: [""], tags: ["3 meses de proteção"] },
      { nome: "Antipulgas Pipeta Frontline Plus", marca: "Boehringer", preco: 64.9, sub: "Antipulgas & Carrapatos",
        variacoes: [["Cães até 10kg", 1], ["Cães 10-20kg", 1.2], ["Gatos", 1]], sabores: [""] },
      { nome: "Vermífugo Vermivet", marca: "Biofarm", preco: 21.9, sub: "Vermífugos",
        variacoes: [["2 comp.", 1], ["4 comp.", 1.7]], sabores: ["Cães", "Gatos"] },
      { nome: "Suplemento Condroprotetor Osteocart", marca: "Avert", preco: 74.9, sub: "Suplementos", promo: 0.1,
        variacoes: [["Plus 30 comp.", 1], ["Plus 60 comp.", 1.8]], sabores: [""] },
      { nome: "Suplemento Vitamínico Organnact", marca: "Organnact", preco: 48.9, sub: "Suplementos",
        variacoes: [["Pelagem 40 tabs", 1], ["Imuno 40 tabs", 1], ["Sênior 40 tabs", 1]], sabores: [""] },
      { nome: "Shampoo Dermatológico Clorexidina", marca: "Virbac", preco: 59.9, sub: "Dermatológicos",
        variacoes: [["100ml", 1], ["200ml", 1.6]], sabores: [""] },
      { nome: "Solução de Limpeza Otológica", marca: "Cepav", preco: 32.9, sub: "Oftálmico & Ouvido",
        variacoes: [["100ml", 1]], sabores: [""] },
      { nome: "Calmante Natural Fitoterápico", marca: "Vetnil", preco: 44.9, sub: "Fitoterápicos", promo: 0.12,
        variacoes: [["Composto Gel 30ml", 1], ["Composto Gel 60ml", 1.7]], sabores: [""] },
      { nome: "Coleira Antipulgas Seresto", marca: "Elanco", preco: 179.0, sub: "Antipulgas & Carrapatos", promo: 0.1,
        variacoes: [["Cães até 8kg", 1], ["Cães acima de 8kg", 1.12], ["Gatos", 1]], sabores: [""], tags: ["8 meses"] },
      { nome: "Vermífugo Endal / Drontal", marca: "Elanco", preco: 26.9, sub: "Vermífugos",
        variacoes: [["Cães 10kg", 1], ["Cães 20kg", 1.6], ["Plus 660mg", 1.9], ["Gatos", 1.1]], sabores: [""] },
      { nome: "Suplemento Probiótico Intestinal", marca: "Vetnil", preco: 39.9, sub: "Suplementos", promo: 0.08,
        variacoes: [["Prolav 6g", 1], ["Pote 30g", 3.2]], sabores: [""] },
      { nome: "Colírio Lubrificante Ocular Pet", marca: "Ophtalmos", preco: 34.9, sub: "Oftálmico & Ouvido",
        variacoes: [["10ml", 1], ["15ml", 1.3]], sabores: [""] },
      { nome: "Pomada Cicatrizante Repelente", marca: "Vansil", preco: 22.9, sub: "Dermatológicos", estoque: 90,
        variacoes: [["Unguento 30g", 1], ["Spray 100ml", 1.8]], sabores: [""] },
    ],
  },

  jardinagem: {
    rotulo: "Jardinagem",
    emoji: "🌱",
    cor: "#5B9F5B",
    especie: "todos",
    subcategorias: ["Vasos & Cachepôs", "Terra & Substratos", "Adubos & Fertilizantes", "Sementes", "Mudas & Plantas", "Ferramentas", "Rega & Irrigação", "Controle de Pragas"],
    templates: [
      { nome: "Vaso Autoirrigável Raiz", marca: "Raiz", preco: 29.9, sub: "Vasos & Cachepôs", destaque: true, promo: 0.15,
        variacoes: [["3,6L", 1], ["6L", 1.5], ["12L", 2.6], ["20L", 3.9]], sabores: ["Branco", "Terracota", "Chumbo", "Verde"] },
      { nome: "Terra Vegetal Adubada Forth", marca: "Forth", preco: 12.9, sub: "Terra & Substratos", estoque: 140,
        variacoes: [["2kg", 1], ["5kg", 2], ["25L", 3.4]], sabores: [""] },
      { nome: "Substrato para Cactos e Suculentas", marca: "Carolina Soil", preco: 16.9, sub: "Terra & Substratos", estoque: 110,
        variacoes: [["4L", 1], ["8L", 1.7]], sabores: [""] },
      { nome: "Fertilizante Forth", marca: "Forth", preco: 19.9, sub: "Adubos & Fertilizantes", promo: 0.1,
        variacoes: [["Concentrado 500ml", 1], ["Pronto Uso 1L", 0.9]], sabores: ["Flores", "Folhagens", "Orquídeas", "Suculentas", "Frutíferas"] },
      { nome: "Húmus de Minhoca Orgânico", marca: "Vitaplan", preco: 14.9, sub: "Adubos & Fertilizantes", estoque: 120,
        variacoes: [["1kg", 1], ["5kg", 3.6]], sabores: [""] },
      { nome: "Sementes Isla", marca: "Isla", preco: 6.9, sub: "Sementes", estoque: 160,
        variacoes: [["Envelope", 1]], sabores: ["Manjericão", "Alface Crespa", "Girassol Anão", "Tomate Cereja", "Cenoura", "Rúcula"] },
      { nome: "Muda de Suculenta", marca: "Viveiro Verde", preco: 9.9, sub: "Mudas & Plantas", estoque: 90,
        variacoes: [["Pote 6", 1], ["Pote 9", 1.6]], sabores: ["Echeveria", "Rosa de Pedra", "Zebrina", "Mini Cacto", "Colar de Pérolas"] },
      { nome: "Kit Ferramentas de Jardim 3 peças", marca: "Tramontina", preco: 64.9, sub: "Ferramentas", promo: 0.12,
        variacoes: [["Aço Inox", 1], ["Alumínio", 0.85]], sabores: [""] },
      { nome: "Regador Plástico", marca: "Nutriplan", preco: 24.9, sub: "Rega & Irrigação", estoque: 100,
        variacoes: [["1,5L", 1], ["3L", 1.4], ["5L", 1.9]], sabores: ["Verde", "Azul"] },
      { nome: "Kit Irrigação por Gotejamento", marca: "Amanco", preco: 89.9, sub: "Rega & Irrigação",
        variacoes: [["10 plantas", 1], ["25 plantas", 1.6]], sabores: [""] },
      { nome: "Óleo de Neem Concentrado", marca: "DiMy", preco: 27.9, sub: "Controle de Pragas", estoque: 80,
        variacoes: [["60ml", 1], ["500ml", 4.5]], sabores: [""], tags: ["pet friendly"] },
    ],
  },

  aquarismo: {
    rotulo: "Aquarismo",
    emoji: "🐠",
    cor: "#4E86C6",
    especie: "peixe",
    subcategorias: ["Alimentos", "Aquários & Kits", "Filtragem", "Aquecimento", "Tratamento de Água", "Substratos & Decoração", "Aeração"],
    templates: [
      { nome: "Ração Tetra", marca: "Tetra", preco: 21.9, sub: "Alimentos", destaque: true, promo: 0.1,
        variacoes: [["20g", 1], ["52g", 2.1], ["100g", 3.7]], sabores: ["TetraMin Flocos", "Goldfish", "Betta", "Cíclidos"] },
      { nome: "Ração Alcon Bottom Fish", marca: "Alcon", preco: 17.9, sub: "Alimentos",
        variacoes: [["10g", 1], ["24g", 2]], sabores: ["Pastilhas", "MEP 200 Complex", "Betta"] },
      { nome: "Aquário Kit Completo com Tampa e LED", marca: "Boyu", preco: 199.0, sub: "Aquários & Kits", promo: 0.15,
        variacoes: [["10L", 1], ["30L", 2.2], ["60L", 3.8]], sabores: [""] },
      { nome: "Filtro Interno com Bomba", marca: "Sarlo", preco: 79.9, sub: "Filtragem",
        variacoes: [["Better 340", 1], ["Better 640", 1.5], ["Better 1000", 2.1]], sabores: [""] },
      { nome: "Filtro Externo Hang On", marca: "Sunsun", preco: 89.9, sub: "Filtragem", promo: 0.1,
        variacoes: [["HBL-301", 1], ["HBL-501", 1.4], ["HBL-802", 1.9]], sabores: [""] },
      { nome: "Aquecedor com Termostato", marca: "Roxin", preco: 54.9, sub: "Aquecimento",
        variacoes: [["50W", 1], ["100W", 1.2], ["200W", 1.5], ["300W", 1.9]], sabores: [""] },
      { nome: "Condicionador de Água", marca: "Prodac", preco: 19.9, sub: "Tratamento de Água", estoque: 130,
        variacoes: [["100ml", 1], ["250ml", 2]], sabores: ["Anticloro", "Redutor de Amônia", "Bactéria Benéfica"] },
      { nome: "Cascalho Natural para Aquário", marca: "Nutrijardim", preco: 15.9, sub: "Substratos & Decoração", estoque: 120,
        variacoes: [["1kg", 1], ["5kg", 4]], sabores: ["Rio", "Branco", "Preto"] },
      { nome: "Planta Artificial Decorativa", marca: "Soma", preco: 12.9, sub: "Substratos & Decoração", estoque: 100,
        variacoes: [["10cm", 1], ["20cm", 1.6], ["30cm", 2.2]], sabores: ["Verde", "Vermelha"] },
      { nome: "Bomba de Ar Compressor", marca: "Boyu", preco: 44.9, sub: "Aeração",
        variacoes: [["1 saída", 1], ["2 saídas", 1.4]], sabores: [""] },
    ],
  },
};

function construirProdutos() {
  seq = 0;
  const produtos = [];

  for (const [slug, secao] of Object.entries(SECOES)) {
    for (const tpl of secao.templates) {
      const variacoes = tpl.variacoes && tpl.variacoes.length ? tpl.variacoes : [["", 1]];
      const sabores = tpl.sabores && tpl.sabores.length ? tpl.sabores : [""];

      variacoes.forEach(([rotuloVar, mult], vi) => {
        sabores.forEach((sabor, si) => {
          const nome = [tpl.nome, sabor, rotuloVar].filter(Boolean).join(" ");
          const preco = cent(tpl.preco * mult);
          const idx = produtos.length;
          const primeiro = vi === 0 && si === 0;

          produtos.push({
            id: novoId(),
            nome,
            categoria: slug,
            subcategoria: tpl.sub || secao.subcategorias[0],
            especie: tpl.especie || secao.especie,
            marca: tpl.marca,
            preco,
            precoPromocional: tpl.promo ? cent(preco * (1 - tpl.promo)) : null,
            estoque: tpl.estoque != null ? tpl.estoque + ((idx * 7) % 20) : 6 + ((idx * 13) % 70),
            destaque: !!tpl.destaque && primeiro,
            avaliacao: Math.round((3.7 + ((idx * 3) % 14) / 10) * 10) / 10,
            numAvaliacoes: 5 + ((idx * 31) % 380),
            descricao:
              tpl.desc ||
              `${nome}. Item da linha ${secao.rotulo} da marca ${tpl.marca}, selecionado pela equipe do Focinho Feliz.`,
            emoji: tpl.emoji || secao.emoji,
            cor: secao.cor,
            tags: tpl.tags || [],
            ativo: true,
          });
        });
      });
    }
  }

  return produtos;
}

const produtos = construirProdutos();

module.exports = produtos;
module.exports.SECOES = SECOES;
module.exports.construirProdutos = construirProdutos;
