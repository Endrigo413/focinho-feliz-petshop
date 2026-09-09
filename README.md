# Focinho Feliz — E-commerce & Clínica para Pet Shop

Loja virtual **multipágina** (estilo marketplace) de produtos e serviços para
pet shop, clínica e jardinagem, com **back-end Node.js/Express** em
**arquitetura em camadas + módulos** e **front-end** em HTML, CSS e JavaScript
puro (sem framework nem build).

> Versão 3.0 — site reconstruído em páginas separadas (home, catálogo com
> filtros, produto, serviços, lojas, blog, carrinho, conta, admin), catálogo
> com 340+ produtos em 8 seções (incluindo **Jardinagem** e **Aquarismo**),
> banners e promoções, blog com comentários, página de lojas com links do
> Google Maps e um **painel administrativo** completo.
> Versões anteriores: 2.0 (auth JWT, confirmação por e-mail, frete por raio) ·
> 1.0 (vitrine única).

---

## Como rodar

```bash
npm install
npm start
```

O site abre em `http://localhost:3000` e a API em `http://localhost:3000/api`.

Na primeira execução o banco (`data/db.json`) é criado e populado. Para
recriá-lo do zero: `npm run seed`.

### Login de administrador

```
e-mail: admin@focinhofeliz.com.br
senha:  FocinhoFeliz#2026
```

O painel administrativo fica em **`/admin`** (também há um atalho no menu da
conta quando você entra com o admin). Lá dá para: ver métricas, **cadastrar /
editar / remover produtos escolhendo a seção**, ajustar preços e estoque,
acompanhar e mudar o status dos pedidos, ver agendamentos, escrever posts do
blog, moderar comentários e editar os banners e promoções da home.

Desenvolvimento com reinício automático:

```bash
npm run dev
```

Recriar o banco do zero:

```bash
npm run seed
```

Rodar a suíte de testes ponta-a-ponta (com o servidor no ar em outro terminal):

```bash
npm test        # 51 casos: funcionais (incl. marketplace, blog, lojas e
                #  painel admin), integração, segurança, usabilidade/desempenho
```

Plano de testes, planilha de resultados e recomendações em
[`docs/TESTES.md`](docs/TESTES.md).

Configuração opcional: copie `.env.example` para `.env`. Tudo tem valor
padrão — a aplicação sobe sem nenhuma variável de ambiente.

---

## Contas, login e confirmação por e-mail

- **Cadastro e login** são exigidos para **adicionar ao carrinho, finalizar
  a compra, agendar serviços e ver "Meus pedidos"**. A vitrine de produtos e
  serviços continua pública.
- Ao criar a conta, o usuário recebe um **código de 6 dígitos por e-mail** e
  precisa confirmá-lo antes do primeiro login (a conta nasce `pendente`).
- Mesma mecânica de código para **redefinir a senha** (esqueci minha senha).
- **Admin**: a conta `admin@focinhofeliz.com.br` já nasce confirmada. Ao entrar
  com ela, o site mostra a barra "modo administrador" e leva direto para o
  painel dedicado em **`/admin`**.

### E-mail — modo dev (padrão)

Sem `SMTP_HOST` no `.env`, o sistema **não envia e-mail de verdade**: cada
mensagem é gravada em `data/emails/*.txt` e o código também aparece **no
console do servidor** e na própria tela (dica "modo dev"). Assim dá para
testar todo o fluxo sem configurar nada.

Para enviar de verdade pelo Gmail:

```bash
npm install nodemailer          # dependência opcional
# no .env:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=LivrariaLeitura01@gmail.com
SMTP_PASS=<senha de app de 16 dígitos>
```

(Gere a "Senha de app" em *Conta Google → Segurança → Senhas de app*.)

---

## Arquitetura de software

O sistema segue a arquitetura clássica de e-commerce em **três camadas**, com a
camada de regras de negócio subdividida em **módulos de serviço** por domínio.

- [`docs/DOCUMENTACAO.md`](docs/DOCUMENTACAO.md) — documentação de engenharia:
  visão geral, requisitos (RF/RNF), arquitetura, modelagem de dados e os
  diagramas (casos de uso, DER, sequência).
- [`docs/TESTES.md`](docs/TESTES.md) — plano de testes, planilha de resultados
  (`docs/resultados-testes.csv`) e sugestões de melhoria.
- [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) — arquitetura detalhada, com
  diagrama de camadas e fluxos.

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
│        ├── auth        (registro, login, JWT, rate limit)    │
│        ├── users       (perfil, endereços)                   │
│        ├── products    (catálogo marketplace + CRUD admin)   │
│        ├── categories  (seções de produtos)                  │
│        ├── cart        (carrinho do usuário)                 │
│        ├── checkout    (cálculo de frete)                    │
│        ├── orders      (pedidos, pagamento, webhook, e-mail) │
│        ├── services    (serviços da clínica + agendamentos)  │
│        ├── stores      (lojas físicas + centro de distr.)    │
│        ├── blog        (posts + comentários + moderação)     │
│        ├── banners     (banners e promoções da home)         │
│        └── admin       (visão geral, pedidos, agenda)        │
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
| **Serviço de Clientes** | `src/modules/auth/` + `users/` | Cadastro, confirmação de e-mail por código, login (JWT), redefinição de senha, perfil e endereços |
| **Serviço de Pedidos e Pagamento** | `src/modules/orders/` + `checkout/` | Fechamento do carrinho, frete, cobrança, atualização de status via webhook |
| **Serviço da Clínica** | `src/modules/services/` | Catálogo de banho/tosa/veterinário e agendamentos |
| **Serviços de Conteúdo** | `src/modules/stores/` + `blog/` + `banners/` | Lojas físicas, blog com comentários/moderação, banners e promoções da home |
| **Serviço Administrativo** | `src/modules/admin/` | Visão geral (métricas), pedidos com troca de status e agenda da clínica — atrás de `exigirAdmin` |
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
│   ├── products.js              # catálogo (gerado por templates: 340+ produtos, 8 seções)
│   ├── services.js              # catálogo de serviços da clínica
│   ├── stores.js                # 5 lojas em Taubaté + centro de distribuição (FATEC)
│   ├── blog.js                  # posts semente do blog
│   ├── banners.js               # banners da home + cards de promoção
│   └── db.json / emails/        # gerados em runtime (fora do git)
├── src/
│   ├── app.js                   # monta o Express (headers de segurança + gateway)
│   ├── config/  gateway/  lib/  middleware/ (auth, admin, rateLimit, erro)  db/
│   └── modules/
│       ├── auth/    users/    products/    categories/
│       ├── cart/    checkout/ (+ geo.js)   orders/ (+ payment.gateway)
│       ├── services/ (services + appointments)
│       ├── stores/  blog/     banners/     admin/  (overview, pedidos, agenda)
├── tests/e2e.mjs                # suíte de testes (npm test)
└── public/                      # front-end multipágina
    ├── index.html  produtos.html  produto.html  servicos.html
    ├── lojas.html  blog.html  blog-post.html  carrinho.html  admin.html
    ├── conta/  entrar · criar · confirmar · recuperar · painel .html
    ├── css/style.css
    └── js/
        ├── core.js         # window.FF: sessão, API, utilitários
        ├── cart.js         # window.FFCart: carrinho no localStorage
        ├── layout.js       # cabeçalho + rodapé compartilhados (injetados)
        ├── componentes.js  # window.FFUI: card de produto + grade
        └── <página>.js     # home, catalogo, produto, servicos, lojas,
                            #   blog, blog-post, carrinho, conta, painel, admin
```

### Decisões de projeto

- **Sem dependências além do Express.** JWT (HS256), hash de senha e de códigos
  (scrypt) usam só o módulo `crypto` do Node. `nodemailer` é opcional (só para
  SMTP real). Em produção, troque por `jsonwebtoken` / `bcrypt` e um banco real.
- **Confirmação de e-mail obrigatória**: conta nasce `pendente`; códigos de
  6 dígitos com validade, limite de tentativas e reenvio com _throttle_.
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
| POST | `/api/auth/register` | público | Cria conta (`status: pendente`) e envia código por e-mail. **Não** retorna token |
| POST | `/api/auth/verify-email` | público | Confirma o cadastro com `{ email, codigo }` e retorna o token JWT |
| POST | `/api/auth/resend-code` | público | Reenvia o código — `{ email, proposito }` (`confirmar_email` \| `redefinir_senha`) |
| POST | `/api/auth/login` | público | Autentica e retorna o token JWT. Se o e-mail não foi confirmado, responde `403` com `detalhes.precisaConfirmar` |
| POST | `/api/auth/forgot-password` | público | Envia código para redefinir a senha — `{ email }` |
| POST | `/api/auth/reset-password` | público | Troca a senha com `{ email, codigo, novaSenha }` e retorna o token |
| GET | `/api/users/profile` | cliente | Dados do usuário logado |
| PUT | `/api/users/profile` | cliente | Atualiza nome, telefone e endereços |

> Em **modo dev** (sem SMTP), as respostas de `register` / `resend-code` /
> `forgot-password` incluem `codigoDev` para facilitar o teste. Isso nunca
> acontece com SMTP real configurado.

### Produtos e Categorias

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/products` | público | Lista com paginação, filtros (`busca`, `categoria`, `subcategoria`, `especie`, `marca`, `precoMin`, `precoMax`, `promo`, `avaliacaoMin`), `ordenar` e `facetas` na resposta — ver "Conteúdo (v3)" |
| GET | `/api/products/:id` | público | Detalhe de um produto |
| GET | `/api/products/:id/relacionados` | público | Produtos da mesma seção |
| POST | `/api/products` | **admin** | Cadastra produto |
| PUT | `/api/products/:id` | **admin** | Atualiza dados / estoque |
| DELETE | `/api/products/:id` | **admin** | Desativa produto (remoção lógica) |
| POST | `/api/products/:id/reativar` | **admin** | Reativa um produto desativado |
| GET | `/api/categories` | público | Lista as seções e a contagem de produtos |

### Carrinho (exige login)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/cart` | Itens do carrinho do usuário, com subtotais e total |
| POST | `/api/cart/items` | Adiciona produto ou soma quantidade — `{ produtoId, quantidade }` |
| PUT | `/api/cart/items/:productId` | Define a quantidade de um item (`0` remove) |
| DELETE | `/api/cart/items/:productId` | Remove um item |

### Pedidos, Frete e Pagamento

**Área de entrega**: centro de distribuição na **FATEC Taubaté**. Entregamos
num raio de **40 km** (distância em linha reta até o centro do CEP), a
**R$ 0,59 por km**. Fora do raio, o pedido é recusado (`422`). O cálculo usa
uma tabela de faixas de CEP → coordenadas (`src/modules/checkout/geo.js`).

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/api/checkout/shipping` | público | `{ cep }` → `{ distanciaKm, entregavel, valor, prazoDiasUteis, mensagem }` |
| POST | `/api/orders` | cliente **ou** visitante | Com token: fecha o carrinho. Sem token: aceita `{ cliente, itens }` (v1). Se enviar `cep`, o servidor recalcula o frete e recusa endereços fora da área |
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

### Conteúdo (v3)

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/products` | público | Agora com filtros `subcategoria`, `marca` (várias, vírgula), `promo`, `avaliacaoMin`, `ordenar` (`relevancia`/`menor-preco`/`maior-preco`/`avaliacao`/`nome`) e `facetas` (marcas + faixa de preço) na resposta |
| GET | `/api/products/:id/relacionados` | público | Produtos da mesma seção |
| GET | `/api/stores` | público | Lojas + centro de distribuição, com `mapsUrl` |
| GET | `/api/banners` | público | Banners da home e cards de promoção ativos |
| GET | `/api/blog` · `/api/blog/:slug` | público | Lista e detalhe dos posts (com comentários) |
| POST | `/api/blog/:slug/comentarios` | cliente | Leitor deixa uma opinião (`texto`, `nota` 1–5) |
| POST/PUT/DELETE | `/api/products`, `/api/blog`, `/api/banners/*` | **admin** | CRUD de catálogo, posts e banners |
| DELETE | `/api/blog/comentarios/:id` | **admin** | Moderação de comentários |
| GET | `/api/admin/overview` | **admin** | Métricas do painel |
| GET | `/api/admin/orders` · PATCH `/api/admin/orders/:id/status` | **admin** | Todos os pedidos e mudança de status |
| GET | `/api/admin/appointments` | **admin** | Todos os agendamentos |

Descoberta: `GET /api/` lista os serviços; `GET /api/health` é o healthcheck.
As rotas `/api/auth/*` têm **rate limiting** (20 requisições / 15 min por IP).

---

## Exemplos rápidos (cURL)

```bash
# 1. registrar — retorna { precisaConfirmar, codigoDev } no modo dev
REG=$(curl -s -X POST localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Ana Souza","email":"ana@ex.com","senha":"segredo123"}')
CODIGO=$(echo "$REG" | node -pe 'JSON.parse(require("fs").readFileSync(0)).codigoDev')

# 2. confirmar o e-mail com o código → agora sim vem o token
TOKEN=$(curl -s -X POST localhost:3000/api/auth/verify-email \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"ana@ex.com\",\"codigo\":\"$CODIGO\"}" \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).accessToken')

# 3. adicionar ao carrinho
curl -X POST localhost:3000/api/cart/items \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"produtoId":"p01","quantidade":1}'

# 4. calcular frete / testar a área de entrega
curl -X POST localhost:3000/api/checkout/shipping \
  -H 'Content-Type: application/json' -d '{"cep":"12080-000"}'   # Taubaté → entrega
curl -X POST localhost:3000/api/checkout/shipping \
  -H 'Content-Type: application/json' -d '{"cep":"01310-100"}'   # SP capital → fora da área

# 5. fechar o pedido (o servidor recalcula o frete pelo CEP e gera a cobrança Pix)
curl -X POST localhost:3000/api/orders \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"itens":[{"id":"p01","quantidade":1}],"formaPagamento":"pix","cep":"12400-000"}'
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

- Home com carrossel de banners, cards de promoção, seções e prévia do blog
- Catálogo com filtros (seção, subcategoria, espécie, marca, preço, promoção,
  avaliação), ordenação, paginação e chips dos filtros ativos
- Página de produto com galeria, avaliação e relacionados; badge de "Destaque" e
  aviso/bloqueio de "Esgotado"
- Carrinho em página própria com controle de quantidade, persistência local
  (`localStorage`) e **caixa de frete**: digita o CEP, mostra a distância até a
  FATEC Taubaté, o valor e o prazo — ou avisa que está fora da área de entrega e
  bloqueia o "Finalizar pedido"
- Telas separadas de conta (entrar, criar, confirmar código, recuperar senha,
  painel de pedidos/dados/endereços)
- Página de lojas com links do Google Maps; blog com post e comentários
- **Painel `/admin`** com abas: visão geral, produtos (CRUD por seção), pedidos
  (+status), agendamentos, blog (posts + moderação), banners/promoções
- Vitrine de serviços com agendamento (não aceita datas passadas)
- Animações com respeito a `prefers-reduced-motion` e layout responsivo

---

## Observações

- `data/db.json` é gerado em runtime e está no `.gitignore`.
- Pedidos e agendamentos agora **persistem** entre reinícios (antes eram em memória).
- Para produção: banco real, `jsonwebtoken`/`bcrypt`, HTTPS, rate limiting e
  variáveis de ambiente com segredos fortes.
