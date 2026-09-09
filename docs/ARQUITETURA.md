# Arquitetura de Software — Focinho Feliz

## 1. Visão geral

Arquitetura **em camadas** (layered / n-tier), padrão mais comum para
e-commerce, com a camada de negócio organizada em **módulos por domínio**
("serviços") atrás de um **API Gateway**.

O projeto é um **monólito modular**: roda como um único processo Node, mas
cada domínio é isolado (rotas próprias, service próprio, repositório próprio),
de modo que qualquer módulo poderia ser extraído para um microsserviço sem
reescrever os demais.

```
Cliente (navegador)
   │  HTTP/JSON
   ▼
┌───────────────────────────────────────────────┐
│ Apresentação      public/  (HTML, CSS, JS)     │
└───────────────────────┬───────────────────────┘
                        ▼
┌───────────────────────────────────────────────┐
│ API Gateway       src/gateway/router.js        │
│  /api  →  roteia para o serviço de domínio     │
└─┬────┬────┬────┬────┬────┬────┬────┬────┬────┬──┘
  ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼
 auth users prod cart chk orders svc stores blog/banners admin
  │    │    │    │    │    │    │    │      │       │
  ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼      ▼       ▼
┌───────────────────────────────────────────────┐
│ Camada de dados   src/db/store.js              │
│  repositórios  →  data/db.json                  │
└───────────────────────────────────────────────┘
```

## 2. Camadas

| Camada | Pasta | O que faz | Como escalar/trocar |
|---|---|---|---|
| **Apresentação** | `public/` | Páginas HTML separadas (home, catálogo, produto, serviços, lojas, blog, carrinho, conta, `/admin`) com cabeçalho/rodapé compartilhados (`js/layout.js`). JS puro consumindo `fetch`. | Migrar para React/Next.js sem tocar na API |
| **Regras de negócio** | `src/` | Autenticação, validações, cálculo de totais/frete, orquestração do pagamento. | Extrair módulos para microsserviços |
| **Armazenamento** | `src/db/` + `data/db.json` | Persistência dos dados (usuários, produtos, carrinhos, pedidos, agendamentos). | Substituir `store.js` por PostgreSQL/MongoDB |

## 3. Anatomia de um módulo

Cada módulo em `src/modules/<dominio>/` tem as mesmas camadas internas:

```
<dominio>.routes.js        camada HTTP: define rotas, valida acesso (middlewares),
                           chama o service, formata a resposta
<dominio>.service.js        regras de negócio: validação de dados, orquestração,
                           cálculos — não conhece Express nem HTTP
<dominio>.repository.js     acesso a dados: fala com src/db/store.js
```

Exemplo (fluxo de `POST /api/products`):

```
products.routes.js  ──►  autenticar ──►  exigirAdmin ──►  products.service.criar()
                                                              │
                                                validarPayload / validarCategoria
                                                              │
                                                    products.repository.inserir()
                                                              │
                                                        store.salvar()
```

## 4. API Gateway

`src/gateway/router.js` é o **ponto de entrada único**. Responsabilidades:

- Expor o índice de serviços (`GET /api/`) e o healthcheck (`GET /api/health`).
- Montar cada serviço de domínio em seu prefixo: `/auth`, `/users`, `/products`,
  `/categories`, `/cart`, `/checkout`, `/orders`, `/services`, `/appointments`,
  `/stores`, `/blog`, `/banners`, `/admin`.
- Ser o lugar único onde entram preocupações transversais. Já hoje o
  `rate limiting` está em `/api/auth/*` (`src/middleware/rateLimit.js`); no
  futuro, CORS por origem, logging de acesso e roteamento para microsserviços.

## 5. Serviços de domínio

### Serviço de Clientes — `auth` + `users`
- `auth`: registro, **confirmação de e-mail por código**, login, redefinição
  de senha e emissão de **JWT** (HS256, `src/lib/jwt.js`). Senhas e códigos
  com **scrypt** + salt (`src/lib/senha.js`).
- `verification.service.js`: ciclo de vida dos códigos (6 dígitos, expiração
  de 15 min, máx. 5 tentativas, reenvio com _throttle_, invalidação do
  código anterior). Guardados na coleção `codigos` só como hash.
- `src/lib/email.js`: envio com transporte plugável — **SMTP** (nodemailer,
  opcional) ou **arquivo** (`data/emails/*.txt` + console) no modo dev.
- Estados do usuário: `pendente` → `ativo`. Login é bloqueado (`403` com
  `detalhes.precisaConfirmar`) enquanto `pendente`. O admin já nasce `ativo`.
- `users`: perfil e endereços de entrega. Papéis: `cliente` e `admin`.
- Middlewares: `autenticar` (exige token), `autenticarOpcional` (token se
  houver), `exigirAdmin`.

**Front-end** (`public/js/core.js` → `window.FF`, e as telas em `public/conta/`):
páginas separadas de entrar / criar / confirmar código / recuperar senha / painel.
`FF` guarda `{token, usuario}` em `localStorage` e expõe helpers de API e de sessão;
as ações que exigem login (carrinho, checkout, agendamento, comentar no blog)
redirecionam para `/conta/entrar` e retomam depois. Ao entrar com o admin, o site
mostra a barra "modo administrador" e leva direto para `/admin`.

### Serviço de Produtos — `products` + `categories`
- Catálogo estilo marketplace com filtros (`busca` — nome, marca, descrição,
  subcategoria e tags, sem acento/caixa; `categoria`, `subcategoria`, `especie`,
  `marca` (várias, separadas por vírgula), faixa de preço, `promo`, `avaliacaoMin`),
  ordenação (`ordenar`: `relevancia` / `menor-preco` / `maior-preco` / `avaliacao` /
  `nome`), paginação e **facetas** (marcas disponíveis + faixa de preço do conjunto
  filtrado) na resposta.
- Preço efetivo = `precoPromocional` quando menor que `preco`; filtros e ordenação
  de preço usam o efetivo.
- `GET /api/products/:id/relacionados` devolve produtos da mesma seção.
- CRUD restrito a admin. `DELETE` é **remoção lógica** (`ativo: false`);
  `POST /api/products/:id/reativar` desfaz. O admin lista inativos com
  `?incluirInativos=1`.
- `categories` deriva as seções do catálogo (slug, rótulo, emoji, cor,
  subcategorias) e conta produtos ativos.

### Serviço de Carrinho — `cart`
- Um carrinho por usuário autenticado, persistido.
- Valida estoque a cada adição/alteração.
- `GET /api/cart` devolve itens com preço atual, subtotal e total.

### Serviço de Pedidos e Pagamento — `orders` + `checkout`
- `checkout/shipping`: **área de entrega por raio**. Centro de distribuição na
  FATEC Taubaté; `geo.js` converte o CEP em coordenadas aproximadas (tabela de
  faixas) e calcula a distância (Haversine). Entregável se ≤ 40 km; frete =
  distância × R$ 0,59; prazo por faixa de distância.
- `orders`: ao criar o pedido com `cep`, o `resolverFrete()` **recalcula o
  frete no servidor** (não confia no cliente) e recusa (`422`) endereços fora
  do raio.
- `orders`:
  - **Com login**: `POST /api/orders` fecha o carrinho → cria o pedido →
    reserva estoque → limpa o carrinho → gera a cobrança no gateway.
  - **Sem login**: aceita `{ cliente, itens }` (compatível com a v1).
  - Histórico (`GET /api/orders`) e rastreamento (`GET /api/orders/:id`).
- **Gateway de pagamento** (`payment.gateway.js`): simulado, mas com a
  interface de um provedor real (cria cobrança Pix/cartão/boleto, assina e
  verifica webhooks).

### Serviço da Clínica — `services` + `appointments`
- Catálogo fixo de serviços (banho, tosa, veterinário, hospedagem…).
- Agendamentos persistidos; recusa datas passadas; exige serviço válido e dados do
  pet; vincula ao usuário se houver token.

### Serviço de Conteúdo — `stores` + `blog` + `banners`
- `stores`: dados fixos (`data/stores.js`) das 5 lojas de Taubaté + o centro de
  distribuição, cada um com `mapsUrl` do Google Maps. Só leitura.
- `blog`: posts semeados em `data/blog.js` (coleção `postsBlog`) e comentários dos
  leitores (coleção `comentariosBlog`). Ler é público; comentar exige login e passa
  por validação (texto de 3 a 1200 caracteres, nota opcional 1–5, nome exibido
  abreviado). Criar/editar/remover post e remover comentário são ações de admin.
- `banners`: banners do carrossel e cards de promoção da home (coleções `banners` e
  `promocoes`). `GET /api/banners` devolve só os ativos, ordenados; `GET
  /api/banners/admin` devolve tudo. CRUD via `/banner` e `/promocao` (admin).

### Serviço Administrativo — `admin`
- Todo o roteador está atrás de `autenticar` + `exigirAdmin`.
- `GET /api/admin/overview`: números do painel (produtos por situação e seção,
  pedidos por status, receita dos pedidos pagos, contagem de clientes e
  agendamentos, últimos 8 pedidos).
- `GET /api/admin/orders` (com busca e filtro por status) e
  `PATCH /api/admin/orders/:id/status` (valida contra a lista de status e registra
  no `historico` do pedido com `origem: "admin"`).
- `GET /api/admin/appointments`: a agenda completa da clínica.
- As demais telas do painel (produtos, blog, banners) reaproveitam os endpoints dos
  respectivos serviços de domínio.

## 6. Fluxo de compra completo

```
1. POST /api/auth/register  ──────►  código por e-mail (conta "pendente")
1b. POST /api/auth/verify-email  ─►  { accessToken }  (conta "ativa")
2. GET  /api/products?categoria=racao  ──►  vitrine
3. POST /api/cart/items {produtoId,qtd} ─►  carrinho no servidor
4. POST /api/checkout/shipping {cep}  ───►  distância, entregável?, frete, prazo
5. POST /api/orders {itens,formaPagamento,cep}
        │  valida estoque, reserva, limpa carrinho
        │  e-mail "Pedido PED-... recebido" (assíncrono)
        └──────────────────────────────►  { pedido, pagamento: {pix|checkoutUrl} }
6. (cliente paga no app do banco)
7. Gateway  ──POST /api/orders/webhook──►  status do pedido: "em separação"
        │  (assinatura HMAC verificada, evento idempotente)
8. GET /api/orders/:id  ─────────────────►  status + código de rastreio
```

## 7. Segurança

| Preocupação | Implementação |
|---|---|
| Autenticação | JWT assinado (HS256), expiração via claim `exp` |
| Confirmação de conta | Código de 6 dígitos por e-mail; hash scrypt; expira em 15 min; 5 tentativas; reenvio com throttle |
| Senhas | `crypto.scrypt` + salt aleatório; comparação `timingSafeEqual` |
| Autorização | Middleware de papel (`exigirAdmin`) em `/api/admin/*` e nas rotas de escrita de `products`, `blog` e `banners`; dono-ou-admin em pedidos e agendamentos |
| Força bruta | `rate limiting` em memória por IP em `/api/auth/*` (20 req / 15 min) |
| Webhook | Assinatura HMAC-SHA256 do corpo cru; idempotência por `evento.id` |
| Entrada | Validação em cada `service`; `AppError` → resposta JSON padronizada |
| Cabeçalhos | `x-powered-by` desabilitado; `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` (faltam CSP e HSTS); limite de corpo em 1 MB |

## 8. Evolução sugerida

- **Banco real**: implementar `store.js` sobre PostgreSQL (Prisma/Knex) ou
  MongoDB — nenhuma outra camada muda.
- **Pagamento real**: substituir `payment.gateway.js` pela SDK do Mercado Pago
  ou Stripe, mantendo `criarCobranca` / `verificarAssinatura`.
- **Microsserviços**: promover `orders` e `products` a serviços próprios,
  deixando o gateway como proxy.
- **Front-end**: SPA em React/Next.js consumindo a mesma API.
- **Infra**: rate limiting, CORS restrito, refresh tokens, HTTPS, observabilidade.
