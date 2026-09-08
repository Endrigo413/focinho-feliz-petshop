# Focinho Feliz — E-commerce & Clínica para Pet Shop

Loja virtual de produtos e agendamento de serviços para pet shop, com
**back-end Node.js/Express** organizado em **arquitetura em camadas + módulos**
e **front-end** em HTML, CSS e JavaScript puro.

> Versão 2.0 — adiciona autenticação JWT, usuários, categorias, carrinho,
> cálculo de frete, pedidos com pagamento e webhook, mantendo tudo o que a
> versão 1 já tinha (vitrine, filtros, agendamento de serviços, carrinho local).

---

## Como rodar

```bash
npm install
npm start
```

O site abre em `http://localhost:3000` e a API em `http://localhost:3000/api`.

Na primeira execução o banco (`data/db.json`) é criado e populado
automaticamente a partir de `data/products.js`, incluindo uma conta admin:

```
e-mail: admin@focinhofeliz.com.br
senha:  admin123
```

Desenvolvimento com reinício automático:

```bash
npm run dev
```

Recriar o banco do zero:

```bash
npm run seed
```

Configuração opcional: copie `.env.example` para `.env`. Tudo tem valor
padrão — a aplicação sobe sem nenhuma variável de ambiente.

---

## Arquitetura de software

O sistema segue a arquitetura clássica de e-commerce em **três camadas**, com a
camada de regras de negócio subdividida em **módulos de serviço** por domínio.
Detalhes e diagrama em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md).

```
┌─────────────────────────────────────────────────────────────┐
│  CAMADA DE APRESENTAÇÃO  (public/)                           │
│  HTML + CSS + JS puro — vitrine, carrinho, checkout, modais  │
└───────────────────────────────┬─────────────────────────────┘
                                │ HTTP / JSON
┌───────────────────────────────▼─────────────────────────────┐
│  CAMADA DE REGRAS DE NEGÓCIO  (src/)                         │
│                                                             │
│   API Gateway  (src/gateway/router.js)                       │
│   ponto de entrada único /api → distribui para os serviços   │
│        │                                                    │
│        ├── auth        (registro, login, JWT)                │
│        ├── users       (perfil, endereços)                   │
│        ├── products    (catálogo + CRUD admin)               │
│        ├── categories  (categorias de produtos)              │
│        ├── cart        (carrinho do usuário)                 │
│        ├── checkout    (cálculo de frete)                    │
│        ├── orders      (pedidos, pagamento, webhook)         │
│        └── services    (serviços da clínica + agendamentos)  │
│                                                             │
│   Cada módulo:  rotas → controller → service → repositório   │
└───────────────────────────────┬─────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────┐
│  CAMADA DE ARMAZENAMENTO  (src/db/store.js → data/db.json)   │
│  Persistência em arquivo JSON. Trocar por PostgreSQL/MongoDB │
│  significa reescrever só esta camada.                        │
└─────────────────────────────────────────────────────────────┘
```

### Componentes essenciais

| Componente | Onde fica | Responsabilidade |
|---|---|---|
| **API Gateway** | `src/gateway/router.js` | Ponto de entrada único; recebe as requisições e direciona para o serviço correto |
| **Serviço de Produtos** | `src/modules/products/` + `categories/` | Catálogo, preços, estoque, categorias |
| **Serviço de Clientes** | `src/modules/auth/` + `users/` | Cadastro, login (JWT), perfil e endereços de entrega |
| **Serviço de Pedidos e Pagamento** | `src/modules/orders/` + `checkout/` | Fechamento do carrinho, frete, cobrança, atualização de status via webhook |
| **Serviço da Clínica** | `src/modules/services/` | Catálogo de banho/tosa/veterinário e agendamentos |
| **Armazenamento** | `src/db/` | Persistência (JSON) e seed inicial |

### Estrutura de pastas

```
petshop/
├── server.js                    # bootstrap (config → seed → HTTP)
├── package.json
├── .env.example
├── docs/
│   └── ARQUITETURA.md           # arquitetura detalhada + diagrama + fluxos
├── data/
│   ├── products.js              # catálogo semente de produtos
│   ├── services.js              # catálogo de serviços da clínica
│   └── db.json                  # banco (gerado; fora do git)
├── src/
│   ├── app.js                   # monta o Express (middlewares + gateway)
│   ├── config/                  # configuração + carregador de .env
│   ├── gateway/router.js        # API Gateway
│   ├── lib/                     # jwt, hash de senha, ids, AppError
│   ├── middleware/              # auth, admin, erro, asyncHandler
│   ├── db/                      # store (persistência) + seed
│   └── modules/
│       ├── auth/                # auth.routes · auth.service
│       ├── users/               # + users.repository
│       ├── products/            # + products.repository
│       ├── categories/
│       ├── cart/
│       ├── checkout/
│       ├── orders/              # + orders.repository · payment.gateway
│       └── services/            # services + appointments
└── public/                      # front-end estático (index.html, css, js)
```

### Decisões de projeto

- **Sem dependências além do Express.** JWT (HS256) e hash de senha (scrypt)
  usam só o módulo `crypto` do Node. Em produção, troque por `jsonwebtoken` /
  `bcrypt` e um banco real.
- **Remoção lógica de produtos** (`ativo: false`) para não quebrar o histórico
  de pedidos.
- **Gateway de pagamento simulado** (`src/modules/orders/payment.gateway.js`)
  com a mesma interface que teria uma integração real (Mercado Pago, Stripe).
- **Webhook idempotente** e autenticado por assinatura HMAC.

---

## Rotas da API

Base: `/api`. Corpo e respostas em JSON. Rotas protegidas exigem o header
`Authorization: Bearer <token>`.

### Autenticação e Usuários

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/api/auth/register` | público | Cria conta de cliente e retorna o token JWT |
| POST | `/api/auth/login` | público | Autentica e retorna o token JWT |
| GET | `/api/users/profile` | cliente | Dados do usuário logado |
| PUT | `/api/users/profile` | cliente | Atualiza nome, telefone e endereços |

### Produtos e Categorias

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/products` | público | Lista com paginação e filtros: `busca`, `categoria`, `especie`, `precoMin`, `precoMax`, `pagina`, `porPagina` |
| GET | `/api/products/:id` | público | Detalhe de um produto |
| POST | `/api/products` | **admin** | Cadastra produto |
| PUT | `/api/products/:id` | **admin** | Atualiza dados / estoque |
| DELETE | `/api/products/:id` | **admin** | Desativa produto (remoção lógica) |
| GET | `/api/categories` | público | Lista as categorias e a contagem de produtos |

### Carrinho (exige login)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/cart` | Itens do carrinho do usuário, com subtotais e total |
| POST | `/api/cart/items` | Adiciona produto ou soma quantidade — `{ produtoId, quantidade }` |
| PUT | `/api/cart/items/:productId` | Define a quantidade de um item (`0` remove) |
| DELETE | `/api/cart/items/:productId` | Remove um item |

### Pedidos, Frete e Pagamento

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/api/checkout/shipping` | público | Calcula opções de frete e prazo pelo `cep` |
| POST | `/api/orders` | cliente **ou** visitante | Com token: fecha o carrinho. Sem token: aceita `{ cliente, itens }` (compatível com a v1) |
| GET | `/api/orders` | cliente | Histórico de pedidos do usuário logado |
| GET | `/api/orders/:id` | dono / admin / pedido de visitante | Detalhe e rastreamento de um pedido |
| POST | `/api/orders/webhook` | gateway (assinatura HMAC) | Recebe atualizações de status do pagamento |

### Serviços da clínica (mantido da v1)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/services` | Lista serviços (filtro `categoria`) |
| GET | `/api/services/:id` | Detalhe de um serviço |
| POST | `/api/appointments` | Cria agendamento |
| GET | `/api/appointments/:id` | Consulta um agendamento |

Descoberta: `GET /api/` lista os serviços; `GET /api/health` é o healthcheck.

---

## Exemplos rápidos (cURL)

```bash
# 1. registrar e guardar o token
TOKEN=$(curl -s -X POST localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Ana Souza","email":"ana@ex.com","senha":"segredo123"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).accessToken')

# 2. adicionar ao carrinho
curl -X POST localhost:3000/api/cart/items \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"produtoId":"p01","quantidade":1}'

# 3. calcular frete
curl -X POST localhost:3000/api/checkout/shipping \
  -H 'Content-Type: application/json' -d '{"cep":"01001-000"}'

# 4. fechar o pedido (gera a cobrança Pix)
curl -X POST localhost:3000/api/orders \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"formaPagamento":"pix","frete":{"servico":"PAC","valor":19.9}}'
```

Simular o webhook do gateway (a assinatura é HMAC-SHA256 do corpo com
`PAYMENT_WEBHOOK_SECRET`):

```bash
BODY='{"id":"evt-123","tipo":"payment.approved","dados":{"pagamentoId":"PAY-xxxx"}}'
SIG=$(node -pe "require('crypto').createHmac('sha256','troque-este-segredo-de-webhook').update(process.argv[1]).digest('hex')" "$BODY")
curl -X POST localhost:3000/api/orders/webhook \
  -H 'Content-Type: application/json' -H "x-webhook-signature: $SIG" -d "$BODY"
```

Eventos suportados: `payment.approved`, `payment.pending`, `payment.failed`,
`payment.refunded`, `payment.chargeback`.

---

## Funcionalidades do front-end

- Vitrine de produtos com busca por texto e filtros por categoria/espécie
- Badge de "Destaque" e aviso/bloqueio de "Esgotado"
- Carrinho lateral com controle de quantidade e persistência local (`localStorage`)
- Checkout com formulário de dados do cliente (enviado à API)
- Vitrine de serviços com agendamento por modal (não aceita datas passadas)
- Animações com respeito a `prefers-reduced-motion` e layout responsivo

---

## Observações

- `data/db.json` é gerado em runtime e está no `.gitignore`.
- Pedidos e agendamentos agora **persistem** entre reinícios (antes eram em memória).
- Para produção: banco real, `jsonwebtoken`/`bcrypt`, HTTPS, rate limiting e
  variáveis de ambiente com segredos fortes.
