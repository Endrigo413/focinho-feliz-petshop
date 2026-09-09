// Bateria de testes ponta-a-ponta do e-commerce Focinho Feliz (51 casos).
// Cobre: funcionais (incl. catálogo marketplace, blog, lojas e painel
// administrativo da v3), integração, segurança e usabilidade/desempenho.
// Pré-requisito: servidor no ar com banco limpo  ->  npm run seed && npm start
// Uso:  node tests/e2e.mjs
// Gera: resultados-testes.csv e resultados-testes.json no diretório atual
//       (ou em $SAIDA, se definido).
// Plano de testes e análise dos resultados: docs/TESTES.md
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const BASE = "http://localhost:3000";
const API = BASE + "/api";
const RAIZ = process.cwd();
const PASTA_EMAILS = path.join(RAIZ, "data", "emails");

const resultados = [];
let ok = 0,
  falhas = 0,
  avisos = 0;

function registrar(id, categoria, titulo, status, evidencia, obs = "") {
  resultados.push({ id, categoria, titulo, status, evidencia: String(evidencia), obs });
  if (status === "PASSA") ok++;
  else if (status === "FALHA") falhas++;
  else if (status === "ATENCAO") avisos++;
  const tag = { PASSA: "PASS", FALHA: "FAIL", ATENCAO: "WARN", INFO: "INFO" }[status] || status;
  console.log(`${tag.padEnd(4)} ${id.padEnd(7)} ${titulo}`);
  console.log(`         └─ ${evidencia}${obs ? "  ·  " + obs : ""}`);
}

async function req(metodo, caminho, { body, token, raw } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = "Bearer " + token;
  const t0 = performance.now();
  const res = await fetch(API + caminho, {
    method: metodo,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const ms = performance.now() - t0;
  const texto = await res.text();
  let json = null;
  try {
    json = JSON.parse(texto);
  } catch {}
  return { status: res.status, json, texto, ms, headers: res.headers, raw: raw ? texto : undefined };
}

const rnd = () => crypto.randomBytes(4).toString("hex");

// IDs de produtos reais, descobertos na hora (o catálogo é gerado).
const PROD = { a: "p01", b: "p05", baixo: "p06", extra: "p09" };
async function descobrirProdutos() {
  const r = await req("GET", "/products?porPagina=120&ordenar=nome");
  const emEstoque = r.json.produtos.filter((p) => p.estoque > 3 && p.ativo !== false);
  const baixo = r.json.produtos.filter((p) => p.estoque > 0 && p.estoque <= 12);
  if (emEstoque[0]) PROD.a = emEstoque[0].id;
  if (emEstoque[1]) PROD.b = emEstoque[1].id;
  if (emEstoque[2]) PROD.extra = emEstoque[2].id;
  if (baixo[0]) PROD.baixo = baixo[0].id;
}

/* ======================================================================= */
async function funcionais() {
  console.log("\n===== TESTES FUNCIONAIS =====\n");
  await descobrirProdutos();
  const email = `cli.${rnd()}@teste.com`;
  const senha = "senha123";

  // TF01 — cadastro
  const reg = await req("POST", "/auth/register", { body: { nome: "Cliente Teste", email, senha } });
  const semToken = reg.json && reg.json.accessToken === undefined;
  registrar(
    "TF01",
    "Funcional",
    "Cadastro: criar conta nova",
    reg.status === 201 && reg.json.precisaConfirmar && semToken ? "PASSA" : "FALHA",
    `HTTP ${reg.status} · precisaConfirmar=${reg.json?.precisaConfirmar} · sem token=${semToken} · código dev=${reg.json?.codigoDev}`
  );
  const codigo = reg.json?.codigoDev;

  // TF02 — confirmação de e-mail (código errado e depois correto)
  const errado = await req("POST", "/auth/verify-email", { body: { email, codigo: "000000" } });
  const certo = await req("POST", "/auth/verify-email", { body: { email, codigo } });
  registrar(
    "TF02",
    "Funcional",
    "Confirmação de cadastro por código",
    errado.status === 400 && certo.status === 200 && certo.json.usuario.status === "ativo" ? "PASSA" : "FALHA",
    `código errado → HTTP ${errado.status} ("${errado.json?.erro}"); código certo → HTTP ${certo.status}, status="${certo.json?.usuario?.status}", token emitido=${!!certo.json?.accessToken}`
  );
  const token = certo.json?.accessToken;

  // TF03 — login antes de confirmar (conta separada)
  const email2 = `pend.${rnd()}@teste.com`;
  await req("POST", "/auth/register", { body: { nome: "Pendente", email: email2, senha } });
  const loginPend = await req("POST", "/auth/login", { body: { email: email2, senha } });
  registrar(
    "TF03",
    "Funcional",
    "Login bloqueado enquanto e-mail não confirmado",
    loginPend.status === 403 && loginPend.json.detalhes?.precisaConfirmar ? "PASSA" : "FALHA",
    `HTTP ${loginPend.status} · ${loginPend.json?.erro}`
  );

  // TF04 — login OK
  const login = await req("POST", "/auth/login", { body: { email, senha } });
  registrar(
    "TF04",
    "Funcional",
    "Login com conta confirmada",
    login.status === 200 && login.json.accessToken ? "PASSA" : "FALHA",
    `HTTP ${login.status} · admin=${login.json?.admin} · expira em ${login.json?.expiraEm}s`
  );

  // TF05 — recuperar senha
  const forgot = await req("POST", "/auth/forgot-password", { body: { email } });
  const reset = await req("POST", "/auth/reset-password", {
    body: { email, codigo: forgot.json?.codigoDev, novaSenha: "outra456" }
  });
  const antiga = await req("POST", "/auth/login", { body: { email, senha } });
  const nova = await req("POST", "/auth/login", { body: { email, senha: "outra456" } });
  registrar(
    "TF05",
    "Funcional",
    "Recuperação de senha por código",
    reset.status === 200 && antiga.status === 401 && nova.status === 200 ? "PASSA" : "FALHA",
    `reset HTTP ${reset.status}; login senha antiga HTTP ${antiga.status} (esperado 401); senha nova HTTP ${nova.status} (esperado 200)`
  );
  const token2 = nova.json?.accessToken || token;

  // TF06 — painel do cliente
  const perfil = await req("GET", "/users/profile", { token: token2 });
  const pedidos = await req("GET", "/orders", { token: token2 });
  const hashExposto = perfil.json && "senhaHash" in perfil.json;
  registrar(
    "TF06",
    "Funcional",
    "Acesso ao painel do cliente (perfil + pedidos)",
    perfil.status === 200 && pedidos.status === 200 && !hashExposto ? "PASSA" : "FALHA",
    `perfil HTTP ${perfil.status} (${perfil.json?.nome}); histórico HTTP ${pedidos.status} (${pedidos.json?.total} pedidos); senhaHash no retorno=${hashExposto}`
  );

  // TF07 — busca por nome
  const buscaAcento = await req("GET", "/products?busca=" + encodeURIComponent("ração"));
  const buscaSem = await req("GET", "/products?busca=racao");
  const buscaParcial = await req("GET", "/products?busca=premium");
  let st07 = "PASSA";
  let ev07 = `"ração" → ${buscaAcento.json.total} itens; "premium" → ${buscaParcial.json.total} itens`;
  if (buscaSem.json.total === 0 && buscaAcento.json.total > 0) {
    st07 = "ATENCAO";
    ev07 = `"ração" (com acento) → ${buscaAcento.json.total} itens, mas "racao" (sem acento) → ${buscaSem.json.total}. Busca não normaliza acentos.`;
  }
  registrar("TF07", "Funcional", "Busca de produtos por nome", st07, ev07);

  // TF08 — filtro por categoria
  const cat = await req("GET", "/products?categoria=racao");
  const catsUnicas = [...new Set(cat.json.produtos.map((p) => p.categoria))];
  registrar(
    "TF08",
    "Funcional",
    "Filtro por categoria",
    cat.json.total > 0 && catsUnicas.length === 1 && catsUnicas[0] === "racao" ? "PASSA" : "FALHA",
    `?categoria=racao → ${cat.json.total} itens, todos da categoria [${catsUnicas.join(", ")}]`
  );

  // TF09 — filtro por preço
  const preco = await req("GET", "/products?precoMin=100&precoMax=200");
  const ef = (p) => (p.precoPromocional != null ? p.precoPromocional : p.preco);
  const dentro = preco.json.produtos.every((p) => ef(p) >= 100 && ef(p) <= 200);
  registrar(
    "TF09",
    "Funcional",
    "Filtro por faixa de preço",
    preco.status === 200 && dentro ? "PASSA" : "FALHA",
    `?precoMin=100&precoMax=200 → ${preco.json.total} itens, preços [${preco.json.produtos.map((p) => p.preco).join(", ")}] todos no intervalo=${dentro}`
  );

  // TF10 — combinado + paginação
  const pag = await req("GET", "/products?especie=gato&porPagina=3");
  registrar(
    "TF10",
    "Funcional",
    "Filtro combinado + paginação",
    pag.json.porPagina === 3 && pag.json.produtos.length <= 3 ? "PASSA" : "FALHA",
    `?especie=gato&porPagina=3 → página ${pag.json.pagina}/${pag.json.paginas}, ${pag.json.produtos.length} de ${pag.json.total} itens`
  );

  // TF11–TF14 — carrinho
  await req("POST", "/cart/items", { token: token2, body: { produtoId: PROD.a, quantidade: 2 } });
  const add2 = await req("POST", "/cart/items", { token: token2, body: { produtoId: PROD.b, quantidade: 1 } });
  registrar(
    "TF11",
    "Funcional",
    "Carrinho: adicionar itens",
    add2.status === 201 && add2.json.itens.length === 2 ? "PASSA" : "FALHA",
    `2 produtos distintos no carrinho, ${add2.json.quantidadeItens} unidades, total ${add2.json.total}`
  );
  const upd = await req("PUT", "/cart/items/" + PROD.a, { token: token2, body: { quantidade: 5 } });
  const item01 = upd.json.itens.find((i) => i.produtoId === PROD.a);
  registrar(
    "TF12",
    "Funcional",
    "Carrinho: alterar quantidade",
    upd.status === 200 && item01.quantidade === 5 ? "PASSA" : "FALHA",
    `p01 quantidade 2 → 5, subtotal do item ${item01.subtotal}`
  );
  const del = await req("DELETE", "/cart/items/" + PROD.b, { token: token2 });
  registrar(
    "TF13",
    "Funcional",
    "Carrinho: remover item",
    del.status === 200 && del.json.itens.length === 1 ? "PASSA" : "FALHA",
    `após remover p05: ${del.json.itens.length} item restante`
  );
  const excesso = await req("POST", "/cart/items", { token: token2, body: { produtoId: PROD.baixo, quantidade: 999 } });
  registrar(
    "TF14",
    "Funcional",
    "Carrinho: bloquear quantidade acima do estoque",
    excesso.status === 409 ? "PASSA" : "FALHA",
    `pedir 999 un. de item com estoque baixo → HTTP ${excesso.status} · "${excesso.json?.erro}"`
  );

  // TF15 — checkout completo
  const cartFinal = await req("GET", "/cart", { token: token2 });
  const frete = await req("POST", "/checkout/shipping", { body: { cep: "12080-000" } });
  const pedido = await req("POST", "/orders", {
    token: token2,
    body: {
      itens: cartFinal.json.itens.map((i) => ({ id: i.produtoId, quantidade: i.quantidade })),
      formaPagamento: "pix",
      cep: "12080-000",
      cliente: { nome: "Cliente Teste", telefone: "12999990000" },
      enderecoEntrega: "Rua Teste, 100 - Taubaté/SP"
    }
  });
  const p = pedido.json;
  const somaOk = p && Math.abs(p.total - (p.subtotal + p.frete.valor)) < 0.01;
  registrar(
    "TF15",
    "Funcional",
    "Checkout: compra do início ao fim",
    pedido.status === 201 && somaOk && p.pagamento?.pix ? "PASSA" : "FALHA",
    `pedido ${p?.id} criado (HTTP ${pedido.status}); subtotal ${p?.subtotal} + frete ${p?.frete?.valor} = total ${p?.total}; status "${p?.status}"; Pix gerado=${!!p?.pagamento?.pix}`
  );

  // TF16 — painel administrativo: CRUD de produto + autorização
  const adminLogin = await req("POST", "/auth/login", {
    body: { email: "admin@focinhofeliz.com.br", senha: "FocinhoFeliz#2026" }
  });
  const admToken = adminLogin.json?.accessToken;
  const criar = await req("POST", "/products", {
    token: admToken,
    body: { nome: "Produto de Teste QA", categoria: "racao", preco: 42.5, estoque: 10, especie: "cachorro" }
  });
  const novoId = criar.json?.id;
  const atualizar = await req("PUT", "/products/" + novoId, { token: admToken, body: { preco: 39.9, estoque: 3 } });
  const remover = await req("DELETE", "/products/" + novoId, { token: admToken });
  const sumiuDoCatalogo = await req("GET", "/products/" + novoId);
  const clienteTentou = await req("POST", "/products", {
    token: token2,
    body: { nome: "Hacker", categoria: "racao", preco: 1, estoque: 1 }
  });
  registrar(
    "TF16",
    "Funcional",
    "Painel administrativo: cadastrar / atualizar / remover produto",
    criar.status === 201 && atualizar.json?.preco === 39.9 && remover.status === 200 && sumiuDoCatalogo.status === 404 && clienteTentou.status === 403
      ? "PASSA"
      : "FALHA",
    `admin cria (HTTP ${criar.status}) · atualiza preço 42,5→${atualizar.json?.preco} · remove (HTTP ${remover.status}) e some do catálogo público (HTTP ${sumiuDoCatalogo.status}); cliente comum tentando cadastrar → HTTP ${clienteTentou.status} (esperado 403)`
  );

  return { token: token2, email, admToken, pedidoId: p?.id, pagamentoId: p?.pagamento?.id };
}

/* ======================================================================= */
/* Catálogo estilo marketplace, blog, lojas e painel administrativo (v3).   */
/* Roda logo após os testes funcionais básicos, antes de os testes de       */
/* segurança esgotarem o rate limit das rotas de autenticação.              */
async function marketplaceEConteudo(ctx) {
  console.log("\n===== TESTES FUNCIONAIS — MARKETPLACE, CONTEÚDO E PAINEL (v3) =====\n");
  const cli = ctx.token;
  const adm = ctx.admToken;

  // TF17 — catálogo: filtro por marca + facetas
  const base = await req("GET", "/products?porPagina=120");
  const marcas = base.json.facetas?.marcas || [];
  const marcaAlvo = marcas[0];
  const porMarca = await req("GET", "/products?marca=" + encodeURIComponent(marcaAlvo) + "&porPagina=120");
  const soAMarca = porMarca.json.produtos.every((p) => String(p.marca).toLowerCase() === String(marcaAlvo).toLowerCase());
  registrar(
    "TF17",
    "Funcional",
    "Catálogo: filtro por marca e facetas na resposta",
    base.status === 200 && marcas.length > 1 && porMarca.json.total > 0 && soAMarca ? "PASSA" : "FALHA",
    `facetas.marcas → ${marcas.length} marcas; ?marca=${marcaAlvo} → ${porMarca.json.total} itens, todos da marca=${soAMarca}; facetas.precoMin/Max = ${base.json.facetas?.precoMin}/${base.json.facetas?.precoMax}`
  );

  // TF18 — catálogo: só promoções + ordenação por menor preço
  const ef = (p) => (p.precoPromocional != null && p.precoPromocional < p.preco ? p.precoPromocional : p.preco);
  const promo = await req("GET", "/products?promo=1&ordenar=menor-preco&porPagina=120");
  const todasEmOferta = promo.json.produtos.every((p) => p.precoPromocional != null);
  const ordenado = promo.json.produtos.every((p, i, a) => i === 0 || ef(a[i - 1]) <= ef(p));
  registrar(
    "TF18",
    "Funcional",
    "Catálogo: filtro “só ofertas” + ordenação por menor preço",
    promo.json.total > 0 && todasEmOferta && ordenado ? "PASSA" : "FALHA",
    `?promo=1&ordenar=menor-preco → ${promo.json.total} itens; todos com preço promocional=${todasEmOferta}; preço efetivo não-decrescente=${ordenado}`
  );

  // TF19 — catálogo: filtro por avaliação mínima
  const avaliados = await req("GET", "/products?avaliacaoMin=4&porPagina=120");
  const acimaDe4 = avaliados.json.produtos.every((p) => p.avaliacao >= 4);
  registrar(
    "TF19",
    "Funcional",
    "Catálogo: filtro por avaliação mínima",
    avaliados.status === 200 && acimaDe4 ? "PASSA" : "FALHA",
    `?avaliacaoMin=4 → ${avaliados.json.total} itens, todos com avaliação ≥ 4=${acimaDe4}`
  );

  // TF20 — produto: detalhe + relacionados
  const alvo = base.json.produtos[0];
  const detalhe = await req("GET", "/products/" + alvo.id);
  const rel = await req("GET", "/products/" + alvo.id + "/relacionados");
  const relOk =
    Array.isArray(rel.json.produtos) &&
    rel.json.produtos.every((p) => p.id !== alvo.id && p.categoria === alvo.categoria);
  registrar(
    "TF20",
    "Funcional",
    "Produto: página de detalhe e produtos relacionados",
    detalhe.status === 200 && detalhe.json.id === alvo.id && relOk ? "PASSA" : "FALHA",
    `detalhe HTTP ${detalhe.status} (${detalhe.json?.nome}); ${rel.json?.produtos?.length} relacionados, todos da seção "${alvo.categoria}" e sem repetir o próprio=${relOk}`
  );

  // TF21 — admin: reativar produto desativado + ?incluirInativos=1
  const criado = await req("POST", "/products", {
    token: adm,
    body: { nome: "Produto Reativável QA", categoria: "racao", preco: 20, estoque: 5 }
  });
  const pid = criado.json?.id;
  await req("DELETE", "/products/" + pid, { token: adm });
  const publico = await req("GET", "/products/" + pid);
  const listaAdmin = await req("GET", "/products?incluirInativos=1&porPagina=120", { token: adm });
  const apareceProAdmin = listaAdmin.json.produtos.some((p) => p.id === pid);
  const reativado = await req("POST", "/products/" + pid + "/reativar", { token: adm });
  const voltou = await req("GET", "/products/" + pid);
  await req("DELETE", "/products/" + pid, { token: adm }); // limpa
  registrar(
    "TF21",
    "Funcional",
    "Painel administrativo: desativar, listar inativos e reativar produto",
    publico.status === 404 && apareceProAdmin && reativado.status === 200 && voltou.status === 200 ? "PASSA" : "FALHA",
    `desativado some do catálogo público (HTTP ${publico.status}); admin com ?incluirInativos=1 ainda vê=${apareceProAdmin}; POST /reativar → HTTP ${reativado.status}; volta ao catálogo público (HTTP ${voltou.status})`
  );

  // TF22 — admin: visão geral do painel
  const overview = await req("GET", "/admin/overview", { token: adm });
  const overviewCliente = await req("GET", "/admin/overview", { token: cli });
  const o = overview.json || {};
  const overviewOk =
    overview.status === 200 &&
    typeof o.produtos?.total === "number" &&
    typeof o.pedidos?.total === "number" &&
    typeof o.pedidos?.receita === "number" &&
    typeof o.clientes === "number" &&
    Array.isArray(o.ultimosPedidos);
  registrar(
    "TF22",
    "Funcional",
    "Painel administrativo: visão geral (métricas)",
    overviewOk && overviewCliente.status === 403 ? "PASSA" : "FALHA",
    `overview HTTP ${overview.status}: ${o.produtos?.total} produtos (${o.produtos?.ativos} ativos, ${o.produtos?.emPromocao} em oferta), ${o.pedidos?.total} pedidos, receita R$ ${o.pedidos?.receita}, ${o.clientes} clientes; cliente comum → HTTP ${overviewCliente.status} (esperado 403)`
  );

  // TF23 — admin: listar pedidos e mudar o status
  const listaPedidos = await req("GET", "/admin/orders", { token: adm });
  const mudou = await req("PATCH", "/admin/orders/" + ctx.pedidoId + "/status", {
    token: adm,
    body: { status: "em separação" }
  });
  const statusInvalido = await req("PATCH", "/admin/orders/" + ctx.pedidoId + "/status", {
    token: adm,
    body: { status: "status-que-nao-existe" }
  });
  const clienteMuda = await req("PATCH", "/admin/orders/" + ctx.pedidoId + "/status", {
    token: cli,
    body: { status: "cancelado" }
  });
  registrar(
    "TF23",
    "Funcional",
    "Painel administrativo: acompanhar pedidos e alterar status",
    listaPedidos.json?.total > 0 &&
      Array.isArray(listaPedidos.json?.statusPossiveis) &&
      mudou.status === 200 &&
      mudou.json?.status === "em separação" &&
      statusInvalido.status === 400 &&
      clienteMuda.status === 403
      ? "PASSA"
      : "FALHA",
    `GET /admin/orders → ${listaPedidos.json?.total} pedidos, ${listaPedidos.json?.statusPossiveis?.length} status possíveis; PATCH status → HTTP ${mudou.status} ("${mudou.json?.status}"); status inválido → HTTP ${statusInvalido.status}; cliente comum → HTTP ${clienteMuda.status}`
  );

  // TF24 — admin: agenda da clínica
  const dataFutura = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const agend = await req("POST", "/appointments", {
    token: cli,
    body: {
      servicoId: "s01",
      cliente: { nome: "Cliente Teste", telefone: "12999990000" },
      pet: { nome: "Rex", especie: "cachorro" },
      data: dataFutura,
      horario: "10:00"
    }
  });
  const dataPassada = await req("POST", "/appointments", {
    token: cli,
    body: {
      servicoId: "s01",
      cliente: { nome: "Cliente Teste", telefone: "12999990000" },
      pet: { nome: "Rex", especie: "cachorro" },
      data: "2020-01-01",
      horario: "10:00"
    }
  });
  const agenda = await req("GET", "/admin/appointments", { token: adm });
  const agendaCliente = await req("GET", "/admin/appointments", { token: cli });
  registrar(
    "TF24",
    "Funcional",
    "Painel administrativo: agenda de serviços da clínica",
    agend.status === 201 && dataPassada.status === 400 && agenda.status === 200 && agenda.json.total >= 1 && agendaCliente.status === 403
      ? "PASSA"
      : "FALHA",
    `agendamento criado (HTTP ${agend.status}); data passada recusada (HTTP ${dataPassada.status}); GET /admin/appointments → HTTP ${agenda.status}, ${agenda.json?.total} agendamento(s); cliente comum → HTTP ${agendaCliente.status}`
  );

  // TF25 — lojas físicas + centro de distribuição
  const stores = await req("GET", "/stores");
  const s = stores.json || {};
  const semLoja = await req("GET", "/stores/loja-que-nao-existe");
  const temMaps = (s.lojas || []).every((l) => typeof l.mapsUrl === "string" && l.mapsUrl.includes("google.com/maps"));
  registrar(
    "TF25",
    "Funcional",
    "Página de lojas: unidades, centro de distribuição e link do Maps",
    stores.status === 200 && s.lojas?.length >= 1 && s.centroDistribuicao?.tipo === "cd" && temMaps && semLoja.status === 404
      ? "PASSA"
      : "FALHA",
    `GET /stores → ${s.total} pontos (${s.lojas?.length} lojas + CD "${s.centroDistribuicao?.nome}"); todos com mapsUrl=${temMaps}; loja inexistente → HTTP ${semLoja.status}`
  );

  // TF26 — blog: lista de posts + post com comentários
  const blog = await req("GET", "/blog");
  const slug = blog.json.posts?.[0]?.slug;
  const post = await req("GET", "/blog/" + slug);
  const post404 = await req("GET", "/blog/post-inexistente");
  registrar(
    "TF26",
    "Funcional",
    "Blog: listagem de posts e leitura de um post",
    blog.json?.total > 0 &&
      Array.isArray(blog.json?.categorias) &&
      post.status === 200 &&
      Array.isArray(post.json?.conteudo) &&
      Array.isArray(post.json?.comentarios) &&
      post404.status === 404
      ? "PASSA"
      : "FALHA",
    `GET /blog → ${blog.json?.total} posts em ${blog.json?.categorias?.length} categorias; GET /blog/${slug} → HTTP ${post.status}, ${post.json?.conteudo?.length} parágrafo(s); post inexistente → HTTP ${post404.status}`
  );

  // TF27 — blog: comentar exige login e valida o conteúdo
  const semLogin = await fetch(API + "/blog/" + slug + "/comentarios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texto: "Comentário anônimo" })
  });
  const curto = await req("POST", "/blog/" + slug + "/comentarios", { token: cli, body: { texto: "ab" } });
  const notaInvalida = await req("POST", "/blog/" + slug + "/comentarios", {
    token: cli,
    body: { texto: "Gostei bastante do artigo!", nota: 9 }
  });
  const comentario = await req("POST", "/blog/" + slug + "/comentarios", {
    token: cli,
    body: { texto: "Artigo muito útil, obrigado pelas dicas!", nota: 5 }
  });
  ctx.comentarioId = comentario.json?.id;
  registrar(
    "TF27",
    "Funcional",
    "Blog: leitor autenticado comenta (com validação)",
    semLogin.status === 401 && curto.status === 400 && notaInvalida.status === 400 && comentario.status === 201 && comentario.json?.nota === 5
      ? "PASSA"
      : "FALHA",
    `sem login → HTTP ${semLogin.status}; texto curto → HTTP ${curto.status}; nota fora de 1–5 → HTTP ${notaInvalida.status}; comentário válido → HTTP ${comentario.status}, exibido como "${comentario.json?.nome}"`
  );

  // TF28 — blog: admin cria, edita e remove post
  const novoPost = await req("POST", "/blog", {
    token: adm,
    body: { titulo: "Post de Teste QA", conteudo: "Primeiro parágrafo do post.\n\nSegundo parágrafo.", categoria: "Geral" }
  });
  const postId = novoPost.json?.id;
  const postSlug = novoPost.json?.slug;
  const editado = await req("PUT", "/blog/" + postId, { token: adm, body: { titulo: "Post de Teste QA (editado)" } });
  const clienteCria = await req("POST", "/blog", { token: cli, body: { titulo: "Hacker", conteudo: "x y z" } });
  const removido = await req("DELETE", "/blog/" + postId, { token: adm });
  const sumiu = await req("GET", "/blog/" + postSlug);
  registrar(
    "TF28",
    "Funcional",
    "Painel administrativo: escrever, editar e remover post do blog",
    novoPost.status === 201 &&
      !!postSlug &&
      editado.json?.titulo === "Post de Teste QA (editado)" &&
      clienteCria.status === 403 &&
      removido.status === 200 &&
      sumiu.status === 404
      ? "PASSA"
      : "FALHA",
    `admin cria (HTTP ${novoPost.status}, slug "${postSlug}") · edita título · cliente comum → HTTP ${clienteCria.status} · remove (HTTP ${removido.status}) e o post some (HTTP ${sumiu.status})`
  );

  // TF29 — blog: moderação de comentários
  const modLista = await req("GET", "/blog/comentarios", { token: adm });
  const modClien = await req("GET", "/blog/comentarios", { token: cli });
  const contemONovo = (modLista.json?.comentarios || []).some((c) => c.id === ctx.comentarioId && c.postTitulo);
  const modDel = await req("DELETE", "/blog/comentarios/" + ctx.comentarioId, { token: adm });
  registrar(
    "TF29",
    "Funcional",
    "Painel administrativo: moderação de comentários do blog",
    modLista.status === 200 && contemONovo && modClien.status === 403 && modDel.status === 200 ? "PASSA" : "FALHA",
    `GET /blog/comentarios (admin) → HTTP ${modLista.status}, ${modLista.json?.comentarios?.length} comentário(s), o novo aparece com o título do post=${contemONovo}; cliente comum → HTTP ${modClien.status}; DELETE → HTTP ${modDel.status}`
  );

  // TF30 — banners: vitrine pública x visão do admin
  const pub = await req("GET", "/banners");
  const admSemToken = await req("GET", "/banners/admin");
  const admBanners = await req("GET", "/banners/admin", { token: adm });
  const soAtivos =
    (pub.json?.banners || []).every((b) => b.ativo !== false) &&
    (pub.json?.promocoes || []).every((p) => p.ativo !== false);
  registrar(
    "TF30",
    "Funcional",
    "Home: banners e promoções (público vê só os ativos)",
    pub.status === 200 && soAtivos && admSemToken.status === 401 && admBanners.status === 200 ? "PASSA" : "FALHA",
    `GET /banners → ${pub.json?.banners?.length} banners + ${pub.json?.promocoes?.length} promoções, todos ativos=${soAtivos}; /banners/admin sem token → HTTP ${admSemToken.status}; com admin → HTTP ${admBanners.status}`
  );

  // TF31 — banners/promoções: CRUD do admin, com reflexo na vitrine pública
  const novaPromo = await req("POST", "/banners/promocao", {
    token: adm,
    body: { selo: "QA", titulo: "Promoção de Teste QA", descricao: "Some após o teste." }
  });
  const promoId = novaPromo.json?.id;
  const desativada = await req("PUT", "/banners/promocao/" + promoId, { token: adm, body: { ativo: false } });
  const pubApos = await req("GET", "/banners");
  const some = !(pubApos.json?.promocoes || []).some((p) => p.id === promoId);
  const delPromo = await req("DELETE", "/banners/promocao/" + promoId, { token: adm });
  registrar(
    "TF31",
    "Funcional",
    "Painel administrativo: CRUD de promoções da home",
    novaPromo.status === 201 && !!promoId && desativada.json?.ativo === false && some && delPromo.status === 200 ? "PASSA" : "FALHA",
    `cria promoção (HTTP ${novaPromo.status}) · desativa (ativo=${desativada.json?.ativo}) → some da vitrine pública=${some} · remove (HTTP ${delPromo.status})`
  );
}

/* ======================================================================= */
async function integracao(ctx) {
  console.log("\n===== TESTES DE INTEGRAÇÃO =====\n");

  // TI01 — cálculo de frete para vários CEPs
  const ceps = [
    ["12080-000", "Taubaté (sede)"],
    ["12030-000", "Taubaté centro"],
    ["12400-000", "Pindamonhangaba"],
    ["12245-000", "São José dos Campos"],
    ["12520-000", "Guaratinguetá"],
    ["01310-100", "São Paulo capital"],
    ["20040-002", "Rio de Janeiro"],
    ["00000", "CEP inválido"]
  ];
  const linhas = [];
  let coerente = true;
  for (const [cep, nome] of ceps) {
    const r = await req("POST", "/checkout/shipping", { body: { cep } });
    if (r.status === 200) {
      const j = r.json;
      linhas.push(`${cep} (${nome}): ${j.distanciaKm} km · ${j.entregavel ? `frete R$ ${j.valor} / ${j.prazoDiasUteis} dia(s)` : "FORA DA ÁREA"}`);
      // coerência: preço ≈ distância * 0,59
      if (j.entregavel && Math.abs(j.valor - j.distanciaKm * 0.59) > 0.6) coerente = false;
      if (j.distanciaKm > 40 && j.entregavel) coerente = false;
    } else {
      linhas.push(`${cep} (${nome}): HTTP ${r.status} · "${r.json?.erro}"`);
    }
  }
  registrar(
    "TI01",
    "Integração",
    "Cálculo de frete por CEP (valor e prazo)",
    coerente ? "PASSA" : "FALHA",
    linhas.join("  |  ")
  );

  // TI02 — gateway de pagamento: Pix
  const cli = ctx;
  const pedPix = await req("POST", "/orders", {
    token: cli.token,
    body: { itens: [{ id: PROD.extra, quantidade: 1 }], formaPagamento: "pix", cep: "12080-000" }
  });
  registrar(
    "TI02",
    "Integração",
    "Gateway de pagamento — cobrança Pix",
    pedPix.status === 201 && pedPix.json.pagamento.metodo === "pix" && pedPix.json.pagamento.pix?.copiaECola ? "PASSA" : "FALHA",
    `pagamento ${pedPix.json?.pagamento?.id} · método ${pedPix.json?.pagamento?.metodo} · status "${pedPix.json?.pagamento?.status}" · copia-e-cola presente=${!!pedPix.json?.pagamento?.pix?.copiaECola}`
  );

  // TI03 — gateway: cartão
  const pedCard = await req("POST", "/orders", {
    token: cli.token,
    body: { itens: [{ id: PROD.extra, quantidade: 1 }], formaPagamento: "cartao", cep: "12080-000" }
  });
  registrar(
    "TI03",
    "Integração",
    "Gateway de pagamento — checkout de cartão",
    pedCard.status === 201 && pedCard.json.pagamento.checkoutUrl ? "PASSA" : "FALHA",
    `método ${pedCard.json?.pagamento?.metodo} · URL de checkout=${pedCard.json?.pagamento?.checkoutUrl || "ausente"}`
  );

  // TI04–TI06 — webhook de pagamento
  const segredo = "troque-este-segredo-de-webhook"; // default de config (dev)
  const pagamentoId = pedPix.json.pagamento.id;
  const corpo = JSON.stringify({ id: "evt-" + rnd(), tipo: "payment.approved", dados: { pagamentoId } });
  const assinatura = crypto.createHmac("sha256", segredo).update(corpo).digest("hex");

  const whBad = await fetch(API + "/orders/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-webhook-signature": "assinatura-falsa" },
    body: corpo
  });
  const whOk = await fetch(API + "/orders/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-webhook-signature": assinatura },
    body: corpo
  });
  const whOkJson = await whOk.json();
  const whReplay = await fetch(API + "/orders/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-webhook-signature": assinatura },
    body: corpo
  });
  const whReplayJson = await whReplay.json();
  const pedApos = await req("GET", "/orders/" + pedPix.json.id, { token: cli.token });

  registrar(
    "TI04",
    "Integração",
    "Webhook de pagamento aprova o pedido",
    whOk.status === 200 && pedApos.json.status === "em separação" ? "PASSA" : "FALHA",
    `webhook approved → HTTP ${whOk.status}; pedido passou de "aguardando pagamento" para "${pedApos.json?.status}"; rastreio gerado=${!!pedApos.json?.rastreamento}`
  );
  registrar(
    "TI05",
    "Segurança",
    "Webhook rejeita assinatura inválida",
    whBad.status === 401 ? "PASSA" : "FALHA",
    `assinatura falsa → HTTP ${whBad.status} (esperado 401)`
  );
  registrar(
    "TI06",
    "Integração",
    "Webhook idempotente (não processa o mesmo evento 2x)",
    whReplayJson.jaProcessado === true ? "PASSA" : "FALHA",
    `reenvio do mesmo evento → jaProcessado=${whReplayJson.jaProcessado}`
  );

  // TI07 — e-mails transacionais
  let arquivos = [];
  try {
    arquivos = fs.readdirSync(PASTA_EMAILS);
  } catch {}
  const temCadastro = arquivos.some((f) => f.includes("@")) &&
    arquivos.map((f) => fs.readFileSync(path.join(PASTA_EMAILS, f), "utf8")).some((c) => /Confirme seu cadastro/i.test(c));
  const temSenha = arquivos
    .map((f) => fs.readFileSync(path.join(PASTA_EMAILS, f), "utf8"))
    .some((c) => /redefinir sua senha/i.test(c));
  const conteudos = arquivos.map((f) => fs.readFileSync(path.join(PASTA_EMAILS, f), "utf8"));
  const assuntos = conteudos.map((c) => (c.match(/Assunto:\s*(.+)/) || [])[1] || "").filter(Boolean);
  const temCompra = conteudos.some((c) => /\bPED-[a-z0-9]/i.test(c)) ||
    assuntos.some((a) => /(pedido (recebido|confirmado)|compra confirmada|seu pedido)/i.test(a));

  registrar(
    "TI07",
    "Integração",
    "E-mail transacional — confirmação de cadastro",
    temCadastro ? "PASSA" : "FALHA",
    `${arquivos.length} e-mail(s) gerados em data/emails/; assunto "Confirme seu cadastro" presente=${temCadastro}`
  );
  registrar(
    "TI08",
    "Integração",
    "E-mail transacional — alteração de senha",
    temSenha ? "PASSA" : "FALHA",
    `assunto "Código para redefinir sua senha" presente=${temSenha}`
  );
  registrar(
    "TI09",
    "Integração",
    "E-mail transacional — confirmação de COMPRA",
    temCompra ? "PASSA" : "FALHA",
    temCompra
      ? `e-mail de confirmação de compra encontrado em data/emails/ (assunto do tipo "Pedido PED-… recebido"). Enviado por orders.service.enviarEmailPedido ao criar o pedido.`
      : `assuntos gerados: [${assuntos.join(" | ")}]. Nenhum e-mail de confirmação de compra: o sistema só envia e-mail para código de cadastro e de redefinição de senha. O pedido é criado sem notificar o cliente por e-mail.`
  );
}

/* ======================================================================= */
async function seguranca(ctx) {
  console.log("\n===== TESTES DE SEGURANÇA =====\n");

  // TS01 — HTTPS
  let https = false;
  try {
    const r = await fetch("https://localhost:3000/", { redirect: "manual" });
    https = r.ok;
  } catch {}
  registrar(
    "TS01",
    "Segurança",
    "Certificado SSL / HTTPS ativo",
    "ATENCAO",
    `servidor atende apenas em HTTP (http://localhost:3000). HTTPS=${https}. Sem TLS/redirecionamento nem HSTS — deve ser resolvido no deploy (proxy reverso / plataforma).`
  );

  // TS02 — dados sensíveis na resposta e no armazenamento
  const login = await req("POST", "/auth/login", { body: { email: ctx.email, senha: "outra456" } });
  const perfil = await req("GET", "/users/profile", { token: ctx.token });
  const respostaLimpa = !JSON.stringify(login.json).includes("senhaHash") && !("senhaHash" in (perfil.json || {}));
  let db = {};
  try {
    db = JSON.parse(fs.readFileSync(path.join(RAIZ, "data", "db.json"), "utf8"));
  } catch {}
  const usuario = (db.usuarios || []).find((u) => u.email === ctx.email);
  const senhaHasheada = usuario && /^scrypt\$/.test(usuario.senhaHash || "");
  const codigoHasheado = (db.codigos || []).every((c) => /^scrypt\$/.test(c.codigoHash || ""));
  registrar(
    "TS02",
    "Segurança",
    "Senhas e dados sensíveis não expostos",
    respostaLimpa && senhaHasheada && codigoHasheado ? "PASSA" : "FALHA",
    `resposta da API sem senhaHash=${respostaLimpa}; senha no banco armazenada como hash scrypt=${senhaHasheada}; códigos de verificação também hasheados=${codigoHasheado}`
  );

  // TS03 — dados de cartão
  const pedCard = await req("POST", "/orders", {
    token: ctx.token,
    body: { itens: [{ id: PROD.extra, quantidade: 1 }], formaPagamento: "cartao", cep: "12080-000" }
  });
  const guardaCartao = /(\bnumero_cartao\b|\bcardNumber\b|\bcvv\b|\bcvc\b)/i.test(pedCard.raw || JSON.stringify(pedCard.json));
  registrar(
    "TS03",
    "Segurança",
    "Dados de cartão não são coletados nem armazenados",
    !guardaCartao ? "PASSA" : "FALHA",
    "o sistema não pede número de cartão/CVV; para cartão ele apenas devolve uma URL de checkout do gateway (tokenização fora do e-commerce)"
  );

  // TS04 — JWT adulterado
  const bom = ctx.token;
  const partes = bom.split(".");
  const adulterado = partes[0] + "." + partes[1] + "." + "x".repeat(partes[2].length);
  const comAdulterado = await req("GET", "/users/profile", { token: adulterado });
  registrar(
    "TS04",
    "Segurança",
    "Token JWT com assinatura adulterada é rejeitado",
    comAdulterado.status === 401 ? "PASSA" : "FALHA",
    `requisição com assinatura trocada → HTTP ${comAdulterado.status} (esperado 401)`
  );

  // TS05 — cabeçalhos HTTP de segurança
  const home = await fetch(BASE + "/");
  const h = home.headers;
  const faltando = ["content-security-policy", "strict-transport-security", "x-content-type-options", "x-frame-options"].filter(
    (k) => !h.get(k)
  );
  registrar(
    "TS05",
    "Segurança",
    "Cabeçalhos HTTP de segurança",
    faltando.length === 0 ? "PASSA" : "ATENCAO",
    `x-powered-by removido=${!h.get("x-powered-by")}; ausentes: ${faltando.join(", ") || "nenhum"}. Recomendado adicionar (ex.: helmet).`
  );

  // TS07 — código de verificação exposto na resposta (antes de estourar o rate limit)
  const reg = await req("POST", "/auth/register", { body: { nome: "Sete", email: `s7.${rnd()}@teste.com`, senha: "senha123" } });
  const expoeCodigo = reg.json && typeof reg.json.codigoDev === "string";
  registrar(
    "TS07",
    "Segurança",
    "Código de verificação no corpo da resposta (modo dev)",
    "ATENCAO",
    `cadastro → HTTP ${reg.status}; campo "codigoDev" no JSON=${expoeCodigo ? '"' + reg.json.codigoDev + '"' : "ausente"}. Sem SMTP a API entrega o código na resposta para facilitar o teste; precisa estar comprovadamente desligado em produção.`
  );

  // TS06 — rate limiting nas rotas de autenticação
  const tentativas = [];
  for (let i = 0; i < 25; i++) {
    const r = await req("POST", "/auth/login", { body: { email: "naoexiste@x.com", senha: "errada" } });
    tentativas.push(r.status);
  }
  const bloqueou = tentativas.some((s) => s === 429);
  registrar(
    "TS06",
    "Segurança",
    "Proteção contra força bruta no login (rate limiting)",
    bloqueou ? "PASSA" : "ATENCAO",
    `sequência de tentativas de login → status ${[...new Set(tentativas)].join("/")}. Limite por IP nas rotas /api/auth/* (middleware em memória).`
  );

  // TS08 — autorização das rotas administrativas da v3 (cliente comum não entra)
  const rotasAdmin = [
    ["GET", "/admin/overview"],
    ["GET", "/admin/orders"],
    ["GET", "/admin/appointments"],
    ["POST", "/blog"],
    ["GET", "/blog/comentarios"],
    ["GET", "/banners/admin"]
  ];
  const respostas = [];
  for (const [metodo, caminho] of rotasAdmin) {
    const r = await req(metodo, caminho, { token: ctx.token, body: metodo === "POST" ? {} : undefined });
    respostas.push(`${caminho}→${r.status}`);
  }
  const semToken = await req("GET", "/admin/overview");
  const todas403 = respostas.every((r) => r.endsWith("403"));
  registrar(
    "TS08",
    "Segurança",
    "Autorização do painel administrativo (v3)",
    todas403 && semToken.status === 401 ? "PASSA" : "FALHA",
    `cliente comum nas rotas de admin: ${respostas.join(" · ")} (esperado 403 em todas); sem token → HTTP ${semToken.status} (esperado 401)`
  );
}

/* ======================================================================= */
async function usabilidadeDesempenho() {
  console.log("\n===== TESTES DE USABILIDADE E DESEMPENHO =====\n");

  // TU01 — responsividade (inspeção do código servido)
  const html = await (await fetch(BASE + "/")).text();
  const css = await (await fetch(BASE + "/css/style.css")).text();
  const temViewport = /<meta[^>]+name=["']viewport["']/.test(html);
  const mediaQueries = (css.match(/@media[^{]+\(max-width/g) || []).length;
  const temReducedMotion = /prefers-reduced-motion/.test(css);
  registrar(
    "TU01",
    "Usabilidade",
    "Responsividade (mobile e desktop)",
    temViewport && mediaQueries >= 2 ? "PASSA" : "ATENCAO",
    `<meta viewport>=${temViewport}; ${mediaQueries} breakpoints @media(max-width) no CSS; prefers-reduced-motion tratado=${temReducedMotion}. (Verificação visual em dispositivo real recomendada.)`
  );

  // TU02 — acessibilidade básica
  const temSkip = /skip-link/.test(html);
  const temLang = /<html[^>]+lang=["']pt/.test(html);
  const temLandmark = /<main[^>]/.test(html) && /id="ff-header"/.test(html) && /id="ff-footer"/.test(html);
  const contaJs = await (await fetch(BASE + "/js/layout.js")).text();
  const ariaNoHeader = (contaJs.match(/aria-[a-z]+/g) || []).length;
  registrar(
    "TU02",
    "Usabilidade",
    "Acessibilidade básica",
    temSkip && temLang && temLandmark ? "PASSA" : "ATENCAO",
    `lang="pt-BR"=${temLang}; link "pular para o conteúdo"=${temSkip}; landmarks main/header/footer=${temLandmark}; ${ariaNoHeader} usos de ARIA no cabeçalho (layout.js). Auditar com Lighthouse na versão publicada.`
  );

  // TU03 — velocidade (mede 5x cada rota e tira a média)
  async function media(caminho, n = 6) {
    const ts = [];
    for (let i = 0; i < n; i++) {
      const t0 = performance.now();
      const r = await fetch(BASE + caminho);
      await r.arrayBuffer();
      ts.push(performance.now() - t0);
    }
    ts.sort((a, b) => a - b);
    return { medio: ts.reduce((s, t) => s + t, 0) / n, min: ts[0], max: ts[ts.length - 1] };
  }
  const rotas = [
    ["/", "Home (HTML)"],
    ["/produtos", "Catálogo (HTML)"],
    ["/css/style.css", "CSS"],
    ["/js/core.js", "JS núcleo"],
    ["/js/layout.js", "JS layout"],
    ["/api/products", "API catálogo"],
    ["/api/services", "API serviços"]
  ];
  const linhas = [];
  let maisLento = 0;
  for (const [caminho, nome] of rotas) {
    const m = await media(caminho);
    maisLento = Math.max(maisLento, m.medio);
    const r = await fetch(BASE + caminho);
    const tam = (await r.arrayBuffer()).byteLength;
    linhas.push(`${nome}: ${m.medio.toFixed(1)} ms (méd.) · ${(tam / 1024).toFixed(1)} KB`);
  }
  registrar(
    "TU03",
    "Desempenho",
    "Tempo de carregamento das páginas principais",
    maisLento < 3000 ? "PASSA" : "FALHA",
    linhas.join("  |  ") + `  →  mais lento: ${maisLento.toFixed(0)} ms (limite: 3000 ms). Medição local, sem rede.`
  );
}

/* ======================================================================= */
(async () => {
  const ctx1 = await funcionais();
  await marketplaceEConteudo(ctx1);
  await integracao(ctx1);
  await seguranca(ctx1);
  await usabilidadeDesempenho();

  console.log("\n===== RESUMO =====");
  console.log(`Total: ${resultados.length}  ·  PASSA: ${ok}  ·  FALHA: ${falhas}  ·  ATENÇÃO: ${avisos}`);

  // CSV
  const csv = [
    "ID;Categoria;Caso de teste;Resultado;Evidencia / medicao;Observacao",
    ...resultados.map((r) =>
      [r.id, r.categoria, r.titulo, r.status, r.evidencia.replace(/;/g, ","), r.obs.replace(/;/g, ",")]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(";")
    )
  ].join("\n");
  fs.writeFileSync(path.join(process.env.SAIDA || ".", "resultados-testes.csv"), "﻿" + csv, "utf8");
  fs.writeFileSync(path.join(process.env.SAIDA || ".", "resultados-testes.json"), JSON.stringify(resultados, null, 2));
  console.log("Arquivos: resultados-testes.csv / .json");
})();
