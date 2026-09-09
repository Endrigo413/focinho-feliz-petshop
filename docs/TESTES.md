# Focinho Feliz — Plano de Testes e Resultados

**1ª Solução — E-commerce · Testes**

| | |
|---|---|
| **Projeto** | Focinho Feliz — E-commerce v3 (site multipágina estilo marketplace + painel administrativo) |
| **Repositório** | https://github.com/Endrigo413/focinho-feliz-petshop |
| **Data da execução** | 08/09/2026 |
| **Ambiente** | Node.js 24 · Windows · servidor local `http://localhost:3000` · banco recém-populado (`npm run seed`) |
| **Forma de execução** | Suíte automatizada `tests/e2e.mjs` (51 casos) via `fetch`, inspeção de `data/emails/`, `data/db.json` e dos arquivos servidos (`/`, `/css`, `/js`) |
| **Resultado geral** | **51 casos — 48 Passou · 0 Falhou · 3 Atenção** |

> Artefatos brutos: `resultados-testes.csv` e `resultados-testes.json` (gerados pela suíte).

---

## 1. Objetivo e escopo

Validar, no e-commerce Focinho Feliz, os quatro eixos pedidos na atividade:

1. **Testes funcionais** — cadastro/login, busca e filtros do catálogo (agora estilo
   marketplace: marca, subcategoria, promoção, avaliação, ordenação e facetas),
   carrinho e checkout, **e todo o painel administrativo da v3** (visão geral,
   pedidos, agenda, blog e banners), além das páginas de **lojas** e **blog**.
2. **Testes de integração** — cálculo de frete, gateway de pagamento e e-mails
   transacionais (incluindo o **e-mail de confirmação de compra**, novo na v3).
3. **Testes de segurança** — HTTPS, exposição de senhas e dados de cartão,
   integridade do JWT, cabeçalhos HTTP, rate limiting e **autorização de todas as
   rotas do painel administrativo**.
4. **Testes de usabilidade e desempenho** — responsividade, acessibilidade e velocidade.

Fora de escopo: teste de carga/estresse, testes visuais em dispositivos físicos
(apenas inspeção de código responsivo) e testes com o gateway de pagamento real
(o projeto usa um gateway simulado com a mesma interface).

### O que mudou desde a rodada anterior (v2 → v3)

| Antes (v2) | Agora (v3) | Reflexo nos testes |
|---|---|---|
| Catálogo com `busca`, `categoria`, `especie`, preço | + `marca`, `subcategoria`, `promo`, `avaliacaoMin`, `ordenar` e **facetas** na resposta | TF17–TF20 (novos) |
| Produto sem página dedicada | `/produto` + `GET /api/products/:id/relacionados` | TF20 (novo) |
| `DELETE` de produto só desativa | + `POST /api/products/:id/reativar` e `?incluirInativos=1` para o admin | TF21 (novo) |
| Sem painel administrativo dedicado | `/admin` com visão geral, pedidos (+status), agenda, blog e banners | TF22–TF24, TF28–TF31 (novos) |
| Sem página de lojas | `/lojas` + `GET /api/stores` (5 lojas + CD FATEC, links do Maps) | TF25 (novo) |
| Sem blog | `/blog` + comentários de leitores e moderação pelo admin | TF26, TF27, TF29 (novos) |
| Sem banners/promoções configuráveis | `GET /api/banners` + CRUD no painel | TF30, TF31 (novos) |
| Pedido criado sem notificar o cliente | **E-mail de confirmação de compra** ao criar o pedido | TI09 (era falha, agora passa) |
| Busca não ignorava acento | Busca normaliza acento/caixa (`semAcento`) | TF07 (era atenção, agora passa) |
| Sem rate limiting | Rate limiting em `/api/auth/*` (20 req / 15 min por IP) | TS06 (era atenção, agora passa) |
| Sem cabeçalhos de segurança | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` | TS05 (menos itens em falta) |
| — | Autorização das novas rotas de admin | TS08 (novo) |

---

## 2. Plano de testes

Legenda de resultado: **P** = Passou · **F** = Falhou · **A** = Atenção (funciona, mas há risco/limitação).

### 2.1 Testes funcionais — base (cadastro, catálogo, carrinho, checkout)

| ID | Objetivo | Passos | Resultado esperado |
|---|---|---|---|
| TF01 | Criar conta nova | `POST /api/auth/register` com nome, e-mail e senha | HTTP 201; conta criada como `pendente`; **não** retorna token; código enviado por e-mail |
| TF02 | Confirmar cadastro por código | Enviar código errado e depois o correto em `POST /api/auth/verify-email` | Código errado → HTTP 400 com contador de tentativas; código correto → HTTP 200, `status: ativo`, token emitido |
| TF03 | Bloquear login sem confirmação | `POST /api/auth/login` com conta ainda `pendente` | HTTP 403 com `detalhes.precisaConfirmar = true` |
| TF04 | Login com conta confirmada | `POST /api/auth/login` | HTTP 200 com `accessToken` e validade |
| TF05 | Recuperar senha | `forgot-password` → `reset-password` com o código → login | Senha antiga passa a falhar (401); senha nova funciona (200) |
| TF06 | Acessar painel do cliente | `GET /api/users/profile` e `GET /api/orders` com token | HTTP 200; dados do perfil sem `senhaHash`; histórico de pedidos acessível |
| TF07 | Buscar produto por nome | `GET /api/products?busca=…` com e sem acento | Retornar os produtos correspondentes **independentemente de acento/caixa** |
| TF08 | Filtrar por categoria | `GET /api/products?categoria=racao` | Só produtos da categoria informada |
| TF09 | Filtrar por faixa de preço | `GET /api/products?precoMin=100&precoMax=200` | Só produtos com preço (efetivo) no intervalo |
| TF10 | Filtro combinado + paginação | `GET /api/products?especie=gato&porPagina=3` | Paginação correta (`pagina`/`paginas`), no máx. 3 itens por página |
| TF11 | Carrinho: adicionar itens | `POST /api/cart/items` (2 produtos) | Itens somados, quantidade e total corretos |
| TF12 | Carrinho: alterar quantidade | `PUT /api/cart/items/:id` para 5 | Quantidade e subtotal atualizados |
| TF13 | Carrinho: remover item | `DELETE /api/cart/items/:id` | Item removido do carrinho |
| TF14 | Carrinho: respeitar estoque | Adicionar quantidade acima do estoque | HTTP 409 com mensagem de estoque insuficiente |
| TF15 | Checkout completo | Carrinho → frete → `POST /api/orders` (Pix) | HTTP 201; `total = subtotal + frete`; cobrança Pix gerada; status "aguardando pagamento" |
| TF16 | Painel administrativo — CRUD de produto | Admin cria, atualiza e remove produto; cliente comum tenta criar | Admin: 201/200/200 e produto some do catálogo público (404); cliente comum → 403 |

### 2.2 Testes funcionais — marketplace, conteúdo e painel administrativo (v3)

| ID | Objetivo | Passos | Resultado esperado |
|---|---|---|---|
| TF17 | Catálogo — filtro por marca + facetas | `GET /api/products` (lê `facetas.marcas`) → `GET /api/products?marca=<marca>` | Resposta traz `facetas` (marcas + faixa de preço); `?marca=` retorna só itens daquela marca |
| TF18 | Catálogo — "só ofertas" + ordenação por menor preço | `GET /api/products?promo=1&ordenar=menor-preco` | Todos os itens com `precoPromocional`; preço efetivo em ordem não-decrescente |
| TF19 | Catálogo — avaliação mínima | `GET /api/products?avaliacaoMin=4` | Só produtos com `avaliacao ≥ 4` |
| TF20 | Produto — detalhe + relacionados | `GET /api/products/:id` e `GET /api/products/:id/relacionados` | Detalhe do produto certo; relacionados são da mesma seção e não incluem o próprio |
| TF21 | Painel — desativar, listar inativos e reativar produto | Admin cria → `DELETE` → `GET /api/products?incluirInativos=1` → `POST /api/products/:id/reativar` | Desativado some do catálogo público (404), mas o admin ainda o vê com `?incluirInativos=1`; reativar traz de volta |
| TF22 | Painel — visão geral (métricas) | `GET /api/admin/overview` (admin) e como cliente comum | Admin: números de produtos, pedidos, receita e clientes + `ultimosPedidos`; cliente comum → 403 |
| TF23 | Painel — pedidos e mudança de status | `GET /api/admin/orders`; `PATCH /api/admin/orders/:id/status` (válido, inválido, como cliente) | Lista com `statusPossiveis`; status válido → 200 e pedido atualizado; inválido → 400; cliente comum → 403 |
| TF24 | Painel — agenda da clínica | `POST /api/appointments` (data futura e data passada); `GET /api/admin/appointments` (admin e cliente) | Agendamento futuro criado (201); data passada recusada (400); admin lista a agenda; cliente comum → 403 |
| TF25 | Página de lojas | `GET /api/stores` e `GET /api/stores/<inexistente>` | 5 lojas + centro de distribuição (`tipo: cd`), cada uma com `mapsUrl` do Google Maps; loja inexistente → 404 |
| TF26 | Blog — listagem e leitura | `GET /api/blog`; `GET /api/blog/:slug`; `GET /api/blog/<inexistente>` | Lista com `categorias`; post traz `conteudo` e `comentarios`; slug inexistente → 404 |
| TF27 | Blog — comentar (com validação) | `POST /api/blog/:slug/comentarios` sem token, com texto curto, com nota 9 e com comentário válido | Sem token → 401; texto < 3 → 400; nota fora de 1–5 → 400; válido → 201 (nome exibido abreviado) |
| TF28 | Painel — post do blog (criar/editar/remover) | Admin `POST` → `PUT` → `DELETE`; cliente comum tenta `POST` | Admin: 201 (com `slug`), edita título, remove (200) e o post some (404); cliente comum → 403 |
| TF29 | Painel — moderação de comentários | `GET /api/blog/comentarios` (admin e cliente); `DELETE /api/blog/comentarios/:id` | Admin vê a lista com o título do post; cliente comum → 403; exclusão → 200 |
| TF30 | Home — banners e promoções | `GET /api/banners`; `GET /api/banners/admin` sem token e com admin | Público vê só itens ativos; `/banners/admin` sem token → 401, com admin → 200 |
| TF31 | Painel — CRUD de promoções | Admin `POST /api/banners/promocao` → `PUT` (ativo=false) → `GET /api/banners` → `DELETE` | Cria (201); ao desativar, some da vitrine pública; remove (200) |

### 2.3 Testes de integração

| ID | Objetivo | Passos | Resultado esperado |
|---|---|---|---|
| TI01 | Cálculo de frete por CEP | `POST /api/checkout/shipping` para 8 CEPs (Taubaté → RJ + CEP inválido) | Distância, valor (≈ km × R$ 0,59) e prazo coerentes; acima de 40 km → "fora da área"; CEP inválido → HTTP 400 |
| TI02 | Gateway — Pix | Pedido com `formaPagamento: pix` | Cobrança com `metodo: pix`, status "pendente" e `pix.copiaECola` |
| TI03 | Gateway — cartão | Pedido com `formaPagamento: cartao` | Cobrança com `checkoutUrl` do gateway |
| TI04 | Webhook aprova o pedido | `POST /api/orders/webhook` (`payment.approved`, assinatura válida) | HTTP 200; pedido vai para "em separação"; código de rastreio gerado |
| TI05 | Webhook rejeita assinatura inválida | Webhook com `x-webhook-signature` falso | HTTP 401 |
| TI06 | Webhook idempotente | Reenviar o mesmo evento | 2ª chamada retorna `jaProcessado: true`, sem alterar o pedido de novo |
| TI07 | E-mail — confirmação de cadastro | Inspecionar `data/emails/` após o registro | Arquivo com assunto "Confirme seu cadastro na Focinho Feliz" |
| TI08 | E-mail — alteração de senha | Inspecionar `data/emails/` após `forgot-password` | Arquivo com assunto "Código para redefinir sua senha" |
| TI09 | **E-mail — confirmação de COMPRA** | Fechar um pedido e verificar `data/emails/` | Cliente recebe um e-mail "Pedido `PED-…` recebido" (enviado por `orders.service.enviarEmailPedido`) |

### 2.4 Testes de segurança

| ID | Objetivo | Passos | Resultado esperado |
|---|---|---|---|
| TS01 | HTTPS ativo | Acessar `https://…` e checar headers | Site servido sob HTTPS com HSTS e redirecionamento de HTTP |
| TS02 | Senhas não expostas | Ler respostas da API e `data/db.json` | Nenhuma senha em texto puro; `senhaHash` nunca na resposta; senhas e códigos como hash scrypt |
| TS03 | Dados de cartão não retidos | Fechar pedido de cartão e checar armazenamento | Sistema não coleta número/CVV; só guarda `id`/status da cobrança |
| TS04 | JWT íntegro | Requisição com assinatura do token adulterada | HTTP 401 |
| TS05 | Cabeçalhos de segurança | Checar headers da home | Presença de CSP, HSTS, X-Content-Type-Options, X-Frame-Options |
| TS06 | Força bruta no login | 25 tentativas seguidas de login inválido | A partir de N tentativas → HTTP 429 (rate limiting em `/api/auth/*`) |
| TS07 | Código de verificação na resposta | Registrar e ler o JSON | Código **não** deve aparecer no corpo da resposta em produção |
| TS08 | **Autorização do painel administrativo (v3)** | Como cliente comum: `GET /api/admin/overview`, `/api/admin/orders`, `/api/admin/appointments`, `POST /api/blog`, `GET /api/blog/comentarios`, `GET /api/banners/admin`; e uma rota sem token | Todas as rotas de admin → HTTP 403 para o cliente comum; sem token → HTTP 401 |

### 2.5 Testes de usabilidade e desempenho

| ID | Objetivo | Passos | Resultado esperado |
|---|---|---|---|
| TU01 | Responsividade | Inspecionar `<meta viewport>` e media queries do CSS | Viewport declarado; breakpoints para tablet/mobile; `prefers-reduced-motion` tratado |
| TU02 | Acessibilidade básica | Inspecionar o HTML e o `layout.js` | `lang="pt-BR"`, link "pular para o conteúdo", landmarks `main/header/footer`, uso de ARIA |
| TU03 | Velocidade | Medir 6× o tempo das páginas principais (home, catálogo, CSS, JS, APIs) | Todas < 3.000 ms |

---

## 3. Planilha de resultados

| ID | Categoria | Caso de teste | Resultado | Evidência / medição |
|---|---|---|---|---|
| TF01 | Funcional | Cadastro: criar conta nova | ✅ Passou | HTTP 201; `precisaConfirmar=true`; sem token; código dev gerado |
| TF02 | Funcional | Confirmação de cadastro por código | ✅ Passou | Código errado → HTTP 400 ("Tentativas restantes: 4"); código certo → HTTP 200, `status="ativo"`, token emitido |
| TF03 | Funcional | Login bloqueado sem confirmação | ✅ Passou | HTTP 403 · "Confirme seu e-mail antes de entrar" |
| TF04 | Funcional | Login com conta confirmada | ✅ Passou | HTTP 200 · `admin=false` · expira em 7200 s |
| TF05 | Funcional | Recuperação de senha por código | ✅ Passou | Reset HTTP 200; senha antiga → 401; senha nova → 200 |
| TF06 | Funcional | Acesso ao painel do cliente | ✅ Passou | Perfil HTTP 200; histórico HTTP 200; `senhaHash` no retorno = **false** |
| TF07 | Funcional | Busca de produtos por nome | ✅ Passou | `"ração"` → 95 itens; `"premium"` → 8 itens. Busca **normaliza acento e caixa** (`semAcento`) |
| TF08 | Funcional | Filtro por categoria | ✅ Passou | `?categoria=racao` → 38 itens, todos da categoria correta |
| TF09 | Funcional | Filtro por faixa de preço | ✅ Passou | `?precoMin=100&precoMax=200` → 52 itens, todos com preço efetivo no intervalo |
| TF10 | Funcional | Filtro combinado + paginação | ✅ Passou | `?especie=gato&porPagina=3` → página 1/84, 3 de 250 itens |
| TF11 | Funcional | Carrinho: adicionar itens | ✅ Passou | 2 produtos distintos, 3 unidades, total R$ 661,50 |
| TF12 | Funcional | Carrinho: alterar quantidade | ✅ Passou | 2 → 5; subtotal do item R$ 1.181,25 |
| TF13 | Funcional | Carrinho: remover item | ✅ Passou | Após remover o 2º produto: 1 item restante |
| TF14 | Funcional | Carrinho: bloquear acima do estoque | ✅ Passou | Pedir 999 un. → HTTP 409 · "Estoque insuficiente. Disponível: 11." |
| TF15 | Funcional | Checkout: compra do início ao fim | ✅ Passou | Pedido `PED-…` criado (201); subtotal 1.181,25 + frete 0,34 = total 1.181,59; Pix gerado |
| TF16 | Funcional | Painel administrativo (CRUD produto) | ✅ Passou | Admin cria/atualiza/remove; produto some do catálogo (404); cliente comum → **403** |
| TF17 | Funcional | Catálogo: filtro por marca + facetas | ✅ Passou | `facetas.marcas` → 59 marcas; `?marca=Alcon` → 6 itens, todos da marca; `facetas.precoMin/Max` = 2/643 |
| TF18 | Funcional | Catálogo: "só ofertas" + menor preço | ✅ Passou | `?promo=1&ordenar=menor-preco` → 156 itens, todos em oferta, preço efetivo não-decrescente |
| TF19 | Funcional | Catálogo: avaliação mínima | ✅ Passou | `?avaliacaoMin=4` → 271 itens, todos com avaliação ≥ 4 |
| TF20 | Funcional | Produto: detalhe + relacionados | ✅ Passou | Detalhe HTTP 200; 8 relacionados, todos da mesma seção e sem repetir o próprio |
| TF21 | Funcional | Painel: desativar / listar inativos / reativar | ✅ Passou | Desativado → 404 no público; visível ao admin com `?incluirInativos=1`; `POST /reativar` → 200; volta ao catálogo |
| TF22 | Funcional | Painel: visão geral (métricas) | ✅ Passou | 347 produtos (345 ativos, 156 em oferta), 1 pedido, receita R$ 0, 2 clientes; cliente comum → **403** |
| TF23 | Funcional | Painel: pedidos + mudança de status | ✅ Passou | 1 pedido, 9 status possíveis; `PATCH` status → 200 ("em separação"); status inválido → 400; cliente comum → 403 |
| TF24 | Funcional | Painel: agenda da clínica | ✅ Passou | Agendamento futuro → 201; data passada → 400; `GET /admin/appointments` → 200 (1 agendamento); cliente comum → 403 |
| TF25 | Funcional | Página de lojas + Maps | ✅ Passou | 6 pontos (5 lojas + CD FATEC), todos com `mapsUrl`; loja inexistente → 404 |
| TF26 | Funcional | Blog: listagem e leitura | ✅ Passou | 6 posts em 6 categorias; post com 4 parágrafos e lista de comentários; slug inexistente → 404 |
| TF27 | Funcional | Blog: comentar (com validação) | ✅ Passou | Sem login → 401; texto curto → 400; nota 9 → 400; válido → 201, exibido como "Cliente T." |
| TF28 | Funcional | Painel: post do blog (criar/editar/remover) | ✅ Passou | Admin cria (slug "post-de-teste-qa"), edita, remove (post some → 404); cliente comum → 403 |
| TF29 | Funcional | Painel: moderação de comentários | ✅ Passou | Admin vê a lista com o título do post; cliente comum → 403; `DELETE` → 200 |
| TF30 | Funcional | Home: banners e promoções | ✅ Passou | Público: 3 banners + 4 promoções (só ativos); `/banners/admin` sem token → 401, com admin → 200 |
| TF31 | Funcional | Painel: CRUD de promoções | ✅ Passou | Cria (201); ao desativar, some da vitrine pública; remove (200) |
| TI01 | Integração | Cálculo de frete por CEP | ✅ Passou | Taubaté 0,6 km → R$ 0,34 / 1 dia · Pinda 14,5 km → R$ 8,53 / 2 dias · SJC 38,3 km → R$ 22,60 / 3 dias · Guaratinguetá 43,6 km / SP 124,8 km / RJ 244,2 km → **fora da área** · CEP inválido → HTTP 400 |
| TI02 | Integração | Gateway — cobrança Pix | ✅ Passou | `metodo=pix`, status "pendente", `pix.copiaECola` presente |
| TI03 | Integração | Gateway — checkout de cartão | ✅ Passou | `checkoutUrl` do gateway retornada |
| TI04 | Integração | Webhook aprova o pedido | ✅ Passou | HTTP 200; "aguardando pagamento" → "em separação"; rastreio gerado |
| TI05 | Segurança | Webhook rejeita assinatura inválida | ✅ Passou | Assinatura falsa → HTTP 401 |
| TI06 | Integração | Webhook idempotente | ✅ Passou | Reenvio do mesmo evento → `jaProcessado=true` |
| TI07 | Integração | E-mail — confirmação de cadastro | ✅ Passou | Arquivo gerado com assunto "Confirme seu cadastro na Focinho Feliz" |
| TI08 | Integração | E-mail — alteração de senha | ✅ Passou | Arquivo gerado com assunto "Código para redefinir sua senha" |
| TI09 | Integração | **E-mail — confirmação de COMPRA** | ✅ Passou | E-mail "Pedido `PED-…` recebido" gravado em `data/emails/` ao criar o pedido |
| TS01 | Segurança | Certificado SSL / HTTPS | ⚠️ Atenção | Servidor atende só em HTTP. Sem TLS, redirecionamento ou HSTS — deve ser resolvido no deploy. |
| TS02 | Segurança | Senhas e dados sensíveis não expostos | ✅ Passou | Resposta sem `senhaHash`; senha no banco em hash scrypt; códigos de verificação também hasheados |
| TS03 | Segurança | Dados de cartão não retidos | ✅ Passou | Sistema não pede número/CVV; cartão gera apenas URL de checkout do gateway |
| TS04 | Segurança | JWT com assinatura adulterada | ✅ Passou | Token alterado → HTTP 401 |
| TS05 | Segurança | Cabeçalhos HTTP de segurança | ⚠️ Atenção | `x-powered-by` removido; `X-Content-Type-Options`, `X-Frame-Options` e `Referrer-Policy` presentes; **faltam CSP e HSTS** |
| TS06 | Segurança | Rate limiting no login | ✅ Passou | 25 tentativas seguidas → status 401/429. Limite por IP em `/api/auth/*` (20 req / 15 min) |
| TS07 | Segurança | Código de verificação na resposta | ⚠️ Atenção | Sem SMTP, a API devolve `codigoDev` no JSON. Intencional em dev; precisa estar desligado em produção. |
| TS08 | Segurança | Autorização do painel administrativo (v3) | ✅ Passou | Cliente comum em `/admin/overview`, `/admin/orders`, `/admin/appointments`, `POST /blog`, `/blog/comentarios`, `/banners/admin` → **403** em todas; sem token → **401** |
| TU01 | Usabilidade | Responsividade | ✅ Passou | `<meta viewport>` presente; 5 breakpoints `@media(max-width)`; `prefers-reduced-motion` tratado |
| TU02 | Usabilidade | Acessibilidade básica | ✅ Passou | `lang="pt-BR"`; link "pular para o conteúdo"; landmarks `main/header/footer`; 20 usos de ARIA no cabeçalho |
| TU03 | Desempenho | Tempo de carregamento | ✅ Passou | Home 13 ms · Catálogo 13 ms · CSS 11 ms · JS núcleo 25 ms · JS layout 9 ms · API catálogo 9 ms · API serviços 13 ms (limite 3.000 ms; medição local) |

### Resumo por categoria

| Categoria | Passou | Atenção | Falhou | Total |
|---|---:|---:|---:|---:|
| Funcional | 31 | 0 | 0 | 31 |
| Integração | 8 | 0 | 0 | 8 |
| Segurança | 6 | 3 | 0 | 9 |
| Usabilidade / Desempenho | 3 | 0 | 0 | 3 |
| **Total** | **48** | **3** | **0** | **51** |

---

## 4. Defeitos e pontos de atenção

### 4.1 Resolvidos desde a rodada da v2

| # | Achado (v2) | Como foi corrigido na v3 | Verificado por |
|---|---|---|---|
| **D1** | Não havia e-mail de confirmação de compra. | `orders.service.enviarEmailPedido` dispara "Pedido `PED-…` recebido" (com itens, valores e Pix copia-e-cola) ao criar o pedido, sem bloquear a resposta. | TI09 |
| **D2** | A busca de produtos não ignorava acentos. | `products.service` normaliza os dois lados da comparação com `normalize("NFD").replace(/\p{Diacritic}/gu, "")` (`semAcento`), e agora também busca em marca, descrição, subcategoria e tags. | TF07 |
| **D5** | Login sem limite de tentativas (força bruta). | `src/middleware/rateLimit.js` aplicado em `/api/auth/*` (20 requisições / 15 min por IP, em memória). | TS06 |

### 4.2 Em aberto

| # | Achado | Severidade | Teste | Situação atual |
|---|---|---|---|---|
| **D3** | **Site sem HTTPS/TLS.** | Alta (produção) | TS01 | O Express serve em HTTP puro; não há proxy TLS nem HSTS. Requisito para LGPD e PCI-DSS. |
| **D4** | **Faltam CSP e HSTS.** | Média | TS05 | A v3 já envia `X-Content-Type-Options`, `X-Frame-Options` e `Referrer-Policy` (`src/app.js`), mas ainda não há `Content-Security-Policy` nem `Strict-Transport-Security`. |
| **D6** | **Código de verificação no corpo da resposta** quando não há SMTP configurado. | Baixa em dev · Alta se for para produção sem SMTP | TS07 | `codigoDev` é retornado no JSON quando `SMTP_HOST` não está definido. |

### Pontos que passaram e merecem destaque

- **Painel administrativo completo e protegido**: visão geral, pedidos com troca de
  status, agenda, blog e banners. Todas as rotas exigem token **e** papel `admin`
  (TF16, TF21–TF24, TF28–TF31, TS08).
- Catálogo estilo marketplace: filtros por marca, subcategoria, promoção e
  avaliação, ordenação e **facetas** calculadas no servidor (TF17–TF19).
- Fluxo de autenticação robusto: confirmação de e-mail obrigatória, contador de
  tentativas, expiração, *throttle* de reenvio e **rate limiting** (TF01–TF05, TS06).
- Webhook de pagamento **autenticado por HMAC e idempotente** (TI04–TI06).
- Cálculo de frete coerente e com bloqueio de área de entrega no servidor (TI01, TF15).
- Nenhuma exposição de senha nem coleta de dados de cartão (TS02, TS03).
- Comentários do blog com validação (login obrigatório, tamanho, nota 1–5) e
  moderação pelo admin (TF27, TF29).
- Desempenho excelente na medição local: todas as páginas abaixo de 30 ms (TU03).

---

## 5. Sugestões de mudança para o site

### Prioridade alta (antes de ir para produção)

1. **HTTPS obrigatório** (corrige D3). Servir atrás de Nginx/Caddy ou de uma
   plataforma com TLS; redirecionar 80 → 443; adicionar `Strict-Transport-Security`.
2. **CSP e HSTS** (corrige D4). Completar os cabeçalhos de segurança — adicionar
   `helmet` no `src/app.js` com uma `Content-Security-Policy` adequada ao front-end.
3. **Bloquear boot em produção sem SMTP** (corrige D6). Se `NODE_ENV=production` e
   não houver `SMTP_HOST`, recusar iniciar; nunca retornar `codigoDev` em produção.
4. **Banco de dados real.** Migrar `data/db.json` para PostgreSQL (concorrência,
   integridade transacional, backup). A camada `src/db/store.js` já isola essa troca.
5. **Trocar segredos padrão.** `JWT_SECRET`, `PAYMENT_WEBHOOK_SECRET` e a senha do
   admin (`FocinhoFeliz#2026`) devem ser obrigatoriamente definidos por variável de
   ambiente forte em produção.
6. **Rate limiting distribuído.** O limitador atual é em memória (um processo). Com
   réplicas, usar Redis ou `express-rate-limit` com store compartilhado.

### Prioridade média (experiência e robustez)

7. **Reserva de estoque com expiração.** Hoje o estoque é reservado ao criar o
   pedido e só volta em `payment.failed`/`refunded`. Adicionar liberação automática
   de pedidos Pix não pagos após 30 min.
8. **Tela de acompanhamento do pedido.** O histórico de status já é gravado
   (`pedido.historico`); expor essa linha do tempo no painel do cliente.
9. **E-mail no webhook.** Além do e-mail ao criar o pedido, enviar "Pagamento
   confirmado — pedido em separação" no `payment.approved`.
10. **Paginação e busca no painel de pedidos e na moderação de comentários** —
    hoje as duas listas vêm inteiras.

### Prioridade baixa (evolução)

11. **CI com testes automatizados.** Rodar `npm test` a cada push (GitHub Actions),
    subindo o servidor com banco limpo.
12. **Front-end em framework** (React/Next) para telas mais ricas de conta, catálogo
    e painel.
13. **Confirmação de e-mail com link**, além do código, para reduzir atrito.
14. **Métricas reais de desempenho** (Lighthouse / WebPageTest) sobre o site
    publicado, já que a medição atual é local e sem rede.

---

## 6. Como reproduzir os testes

```bash
# 1. subir o servidor com banco limpo
npm run seed
npm start

# 2. em outro terminal, rodar a suíte (gera resultados-testes.csv/.json)
node tests/e2e.mjs
#    ou, para escrever os artefatos em docs/:
#    SAIDA=docs node tests/e2e.mjs
```

A suíte cobre os 51 casos acima e imprime PASS/FAIL/WARN por caso, com a evidência
de cada um. Os testes de segurança esgotam de propósito o rate limiting de
`/api/auth/*` (TS06), por isso os casos do marketplace/painel (TF17–TF31) rodam
**antes** dessa etapa e reaproveitam os tokens já emitidos.
