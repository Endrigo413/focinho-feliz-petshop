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
└───┬───────┬───────┬───────┬───────┬───────┬────┘
    ▼       ▼       ▼       ▼       ▼       ▼
  auth   users  products  cart  checkout orders   services
    │       │       │       │       │       │        │
    ▼       ▼       ▼       ▼       ▼       ▼        ▼
┌───────────────────────────────────────────────┐
│ Camada de dados   src/db/store.js              │
│  repositórios  →  data/db.json                  │
└───────────────────────────────────────────────┘
```

## 2. Camadas

| Camada | Pasta | O que faz | Como escalar/trocar |
|---|---|---|---|
| **Apresentação** | `public/` | Interface: vitrine, filtros, carrinho, checkout, agendamento. JS puro consumindo `fetch`. | Migrar para React/Next.js sem tocar na API |
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
- Montar cada serviço de domínio em seu prefixo (`/auth`, `/products`, …).
- Ser o lugar único onde, no futuro, entram preocupações transversais:
  rate limiting, CORS por origem, logging de acesso, roteamento para
  microsserviços externos.

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

**Front-end** (`public/js/auth.js`, `window.FFAuth`): modal com os painéis
login / cadastro / código / esqueci / redefinir; guarda `{token, usuario}` em
`localStorage`; `FFAuth.exigirLogin(cb)` bloqueia carrinho, checkout e
agendamento e reexecuta a ação após o login; barra "modo administrador"
quando `usuario.papel === "admin"`.

### Serviço de Produtos — `products` + `categories`
- Catálogo com filtros (`busca`, `categoria`, `especie`, faixa de preço) e
  paginação (`pagina`, `porPagina`).
- CRUD restrito a admin. `DELETE` é **remoção lógica** (`ativo: false`).
- `categories` deriva as categorias do catálogo e conta produtos ativos.

### Serviço de Carrinho — `cart`
- Um carrinho por usuário autenticado, persistido.
- Valida estoque a cada adição/alteração.
- `GET /api/cart` devolve itens com preço atual, subtotal e total.

### Serviço de Pedidos e Pagamento — `orders` + `checkout`
- `checkout/shipping`: cálculo de frete (mock) por região do CEP e valor da
  compra, com regra de frete grátis.
- `orders`:
  - **Com login**: `POST /api/orders` fecha o carrinho → cria o pedido →
    reserva estoque → limpa o carrinho → gera a cobrança no gateway.
  - **Sem login**: aceita `{ cliente, itens }` (compatível com a v1).
  - Histórico (`GET /api/orders`) e rastreamento (`GET /api/orders/:id`).
- **Gateway de pagamento** (`payment.gateway.js`): simulado, mas com a
  interface de um provedor real (cria cobrança Pix/cartão/boleto, assina e
  verifica webhooks).

### Serviço da Clínica — `services`
- Catálogo fixo de serviços (banho, tosa, veterinário, hospedagem…).
- Agendamentos persistidos; recusa datas passadas; vincula ao usuário se
  houver token.

## 6. Fluxo de compra completo

```
1. POST /api/auth/register  ──────►  código por e-mail (conta "pendente")
1b. POST /api/auth/verify-email  ─►  { accessToken }  (conta "ativa")
2. GET  /api/products?categoria=racao  ──►  vitrine
3. POST /api/cart/items {produtoId,qtd} ─►  carrinho no servidor
4. POST /api/checkout/shipping {cep}  ───►  opções de frete
5. POST /api/orders {formaPagamento,frete}
        │  valida estoque, reserva, limpa carrinho
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
| Autorização | Middleware de papel (`exigirAdmin`); dono-ou-admin em pedidos |
| Webhook | Assinatura HMAC-SHA256 do corpo cru; idempotência por `evento.id` |
| Entrada | Validação em cada `service`; `AppError` → resposta JSON padronizada |
| Cabeçalhos | `x-powered-by` desabilitado; limite de corpo em 1 MB |

## 8. Evolução sugerida

- **Banco real**: implementar `store.js` sobre PostgreSQL (Prisma/Knex) ou
  MongoDB — nenhuma outra camada muda.
- **Pagamento real**: substituir `payment.gateway.js` pela SDK do Mercado Pago
  ou Stripe, mantendo `criarCobranca` / `verificarAssinatura`.
- **Microsserviços**: promover `orders` e `products` a serviços próprios,
  deixando o gateway como proxy.
- **Front-end**: SPA em React/Next.js consumindo a mesma API.
- **Infra**: rate limiting, CORS restrito, refresh tokens, HTTPS, observabilidade.
