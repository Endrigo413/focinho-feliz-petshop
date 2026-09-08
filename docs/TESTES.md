# Focinho Feliz — Plano de Testes e Resultados

**1ª Solução — E-commerce · Testes**

| | |
|---|---|
| **Projeto** | Focinho Feliz — E-commerce v2 |
| **Repositório** | https://github.com/Endrigo413/focinho-feliz-petshop |
| **Data da execução** | 08/09/2026 |
| **Ambiente** | Node.js 24 · Windows · servidor local `http://localhost:3000` · banco recém-populado (`npm run seed`) |
| **Forma de execução** | Suíte automatizada `tests/e2e.mjs` (35 casos) via `fetch`, inspeção de `data/emails/`, `data/db.json` e dos arquivos servidos (`/`, `/css`, `/js`) |
| **Resultado geral** | **35 casos — 29 Passou · 1 Falhou · 5 Atenção** |

> Artefatos brutos: `resultados-testes.csv` e `resultados-testes.json` (gerados pela suíte).

---

## 1. Objetivo e escopo

Validar, no e-commerce Focinho Feliz, os quatro eixos pedidos na atividade:

1. **Testes funcionais** — cadastro/login, busca e filtros, carrinho e checkout.
2. **Testes de integração** — cálculo de frete, gateway de pagamento e e-mails transacionais.
3. **Testes de segurança** — HTTPS, exposição de senhas e dados de cartão.
4. **Testes de usabilidade e desempenho** — responsividade e velocidade.

Fora de escopo: teste de carga/estresse, testes visuais em dispositivos físicos
(apenas inspeção de código responsivo) e testes com o gateway de pagamento real
(o projeto usa um gateway simulado com a mesma interface).

---

## 2. Plano de testes

Legenda de resultado: **P** = Passou · **F** = Falhou · **A** = Atenção (funciona, mas há risco/limitação).

### 2.1 Testes funcionais

| ID | Objetivo | Passos | Resultado esperado |
|---|---|---|---|
| TF01 | Criar conta nova | `POST /api/auth/register` com nome, e-mail e senha | HTTP 201; conta criada como `pendente`; **não** retorna token; código enviado por e-mail |
| TF02 | Confirmar cadastro por código | Enviar código errado e depois o correto em `POST /api/auth/verify-email` | Código errado → HTTP 400 com contador de tentativas; código correto → HTTP 200, `status: ativo`, token emitido |
| TF03 | Bloquear login sem confirmação | `POST /api/auth/login` com conta ainda `pendente` | HTTP 403 com `detalhes.precisaConfirmar = true` |
| TF04 | Login com conta confirmada | `POST /api/auth/login` | HTTP 200 com `accessToken` e validade |
| TF05 | Recuperar senha | `forgot-password` → `reset-password` com o código → login | Senha antiga passa a falhar (401); senha nova funciona (200) |
| TF06 | Acessar painel do cliente | `GET /api/users/profile` e `GET /api/orders` com token | HTTP 200; dados do perfil sem `senhaHash`; histórico de pedidos acessível |
| TF07 | Buscar produto por nome | `GET /api/products?busca=…` com e sem acento | Retornar os produtos correspondentes independentemente de acento/caixa |
| TF08 | Filtrar por categoria | `GET /api/products?categoria=racao` | Só produtos da categoria informada |
| TF09 | Filtrar por faixa de preço | `GET /api/products?precoMin=100&precoMax=200` | Só produtos com preço no intervalo |
| TF10 | Filtro combinado + paginação | `GET /api/products?especie=gato&porPagina=3` | Paginação correta (`pagina`/`paginas`), no máx. 3 itens por página |
| TF11 | Carrinho: adicionar itens | `POST /api/cart/items` (2 produtos) | Itens somados, quantidade e total corretos |
| TF12 | Carrinho: alterar quantidade | `PUT /api/cart/items/:id` para 5 | Quantidade e subtotal atualizados |
| TF13 | Carrinho: remover item | `DELETE /api/cart/items/:id` | Item removido do carrinho |
| TF14 | Carrinho: respeitar estoque | Adicionar quantidade acima do estoque | HTTP 409 com mensagem de estoque insuficiente |
| TF15 | Checkout completo | Carrinho → frete → `POST /api/orders` (Pix) | HTTP 201; `total = subtotal + frete`; cobrança Pix gerada; status "aguardando pagamento" |
| TF16 | Painel administrativo | Admin cria, atualiza e remove produto; cliente comum tenta criar | Admin: 201/200/200 e produto some do catálogo público (404); cliente comum → 403 |

### 2.2 Testes de integração

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
| TI09 | E-mail — confirmação de COMPRA | Fechar um pedido e verificar se há e-mail | Cliente deve receber um e-mail confirmando o pedido |

### 2.3 Testes de segurança

| ID | Objetivo | Passos | Resultado esperado |
|---|---|---|---|
| TS01 | HTTPS ativo | Acessar `https://…` e checar headers | Site servido sob HTTPS com HSTS e redirecionamento de HTTP |
| TS02 | Senhas não expostas | Ler respostas da API e `data/db.json` | Nenhuma senha em texto puro; `senhaHash` nunca na resposta; senhas e códigos como hash scrypt |
| TS03 | Dados de cartão não retidos | Fechar pedido de cartão e checar armazenamento | Sistema não coleta número/CVV; só guarda `id`/status da cobrança |
| TS04 | JWT íntegro | Requisição com assinatura do token adulterada | HTTP 401 |
| TS05 | Cabeçalhos de segurança | Checar headers da home | Presença de CSP, HSTS, X-Content-Type-Options, X-Frame-Options |
| TS06 | Força bruta no login | 12 tentativas seguidas de login inválido | A partir de N tentativas → HTTP 429 (rate limiting) |
| TS07 | Código de verificação na resposta | Registrar e ler o JSON | Código **não** deve aparecer no corpo da resposta em produção |

### 2.4 Testes de usabilidade e desempenho

| ID | Objetivo | Passos | Resultado esperado |
|---|---|---|---|
| TU01 | Responsividade | Inspecionar `<meta viewport>` e media queries do CSS | Viewport declarado; breakpoints para tablet/mobile; `prefers-reduced-motion` tratado |
| TU02 | Acessibilidade básica | Inspecionar o HTML | `lang="pt-BR"`, link "pular para o conteúdo", uso de ARIA |
| TU03 | Velocidade | Medir 6× o tempo das páginas principais | Todas < 3.000 ms |

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
| TF07 | Funcional | Busca de produtos por nome | ⚠️ Atenção | `"ração"` → 3 itens, mas `"racao"` (sem acento) → **0**. A busca não normaliza acentos. |
| TF08 | Funcional | Filtro por categoria | ✅ Passou | `?categoria=racao` → 2 itens, todos da categoria correta |
| TF09 | Funcional | Filtro por faixa de preço | ✅ Passou | `?precoMin=100&precoMax=200` → 3 itens, preços [189,90 · 149,00 · 129,90] |
| TF10 | Funcional | Filtro combinado + paginação | ✅ Passou | `?especie=gato&porPagina=3` → página 1/3, 3 de 7 itens |
| TF11 | Funcional | Carrinho: adicionar itens | ✅ Passou | 2 produtos distintos, 3 unidades, total R$ 404,70 |
| TF12 | Funcional | Carrinho: alterar quantidade | ✅ Passou | p01: 2 → 5; subtotal do item R$ 949,50 |
| TF13 | Funcional | Carrinho: remover item | ✅ Passou | Após remover p05: 1 item restante |
| TF14 | Funcional | Carrinho: bloquear acima do estoque | ✅ Passou | Pedir 999 un. → HTTP 409 · "Estoque insuficiente. Disponível: 9." |
| TF15 | Funcional | Checkout: compra do início ao fim | ✅ Passou | Pedido `PED-…` criado (201); subtotal 949,50 + frete 0,34 = total 949,84; Pix gerado |
| TF16 | Funcional | Painel administrativo (CRUD produto) | ✅ Passou | Admin cria/atualiza/remove; produto some do catálogo (404); cliente comum → **403** |
| TI01 | Integração | Cálculo de frete por CEP | ✅ Passou | Taubaté 0,6 km → R$ 0,34 / 1 dia · Pinda 14,5 km → R$ 8,53 / 2 dias · SJC 38,3 km → R$ 22,60 / 3 dias · Guaratinguetá 43,6 km / SP 124,8 km / RJ 244,2 km → **fora da área** · CEP inválido → HTTP 400 |
| TI02 | Integração | Gateway — cobrança Pix | ✅ Passou | `metodo=pix`, status "pendente", `pix.copiaECola` presente |
| TI03 | Integração | Gateway — checkout de cartão | ✅ Passou | `checkoutUrl` do gateway retornada |
| TI04 | Integração | Webhook aprova o pedido | ✅ Passou | HTTP 200; "aguardando pagamento" → "em separação"; rastreio gerado |
| TI05 | Segurança | Webhook rejeita assinatura inválida | ✅ Passou | Assinatura falsa → HTTP 401 |
| TI06 | Integração | Webhook idempotente | ✅ Passou | Reenvio do mesmo evento → `jaProcessado=true` |
| TI07 | Integração | E-mail — confirmação de cadastro | ✅ Passou | Arquivo gerado com assunto "Confirme seu cadastro na Focinho Feliz" |
| TI08 | Integração | E-mail — alteração de senha | ✅ Passou | Arquivo gerado com assunto "Código para redefinir sua senha" |
| TI09 | Integração | **E-mail — confirmação de COMPRA** | ❌ **Falhou** | Nenhum e-mail é enviado ao fechar o pedido. O sistema só envia e-mail para código de cadastro e de senha. |
| TS01 | Segurança | Certificado SSL / HTTPS | ⚠️ Atenção | Servidor atende só em HTTP. Sem TLS, redirecionamento ou HSTS — deve ser resolvido no deploy. |
| TS02 | Segurança | Senhas e dados sensíveis não expostos | ✅ Passou | Resposta sem `senhaHash`; senha no banco em hash scrypt; códigos de verificação também hasheados |
| TS03 | Segurança | Dados de cartão não retidos | ✅ Passou | Sistema não pede número/CVV; cartão gera apenas URL de checkout do gateway |
| TS04 | Segurança | JWT com assinatura adulterada | ✅ Passou | Token alterado → HTTP 401 |
| TS05 | Segurança | Cabeçalhos HTTP de segurança | ⚠️ Atenção | `x-powered-by` removido, mas faltam CSP, HSTS, X-Content-Type-Options e X-Frame-Options |
| TS06 | Segurança | Rate limiting no login | ⚠️ Atenção | 12 tentativas seguidas → todas processadas (HTTP 401). Sem limite por IP. |
| TS07 | Segurança | Código de verificação na resposta | ⚠️ Atenção | Sem SMTP, a API devolve `codigoDev` no JSON. Intencional em dev; precisa estar desligado em produção. |
| TU01 | Usabilidade | Responsividade | ✅ Passou | `<meta viewport>` presente; 2 breakpoints `@media(max-width)`; `prefers-reduced-motion` tratado |
| TU02 | Usabilidade | Acessibilidade básica | ✅ Passou | `lang="pt-BR"`; link "pular para o conteúdo"; 25 atributos ARIA |
| TU03 | Desempenho | Tempo de carregamento | ✅ Passou | Home 9 ms · CSS 12 ms · JS 19 ms · API catálogo 7 ms · API serviços 10 ms (medição local; limite 3.000 ms). Assets: HTML 18,6 KB · CSS 24,2 KB · JS 29,8 KB |

### Resumo por categoria

| Categoria | Passou | Atenção | Falhou | Total |
|---|---:|---:|---:|---:|
| Funcional | 15 | 1 | 0 | 16 |
| Integração | 8 | 0 | 1 | 9 |
| Segurança | 5 | 4 | 0 | 9 |
| Usabilidade / Desempenho | 3 | 0 | 0 | 3 |
| **Total** | **29** | **5** | **1** | **35** |

---

## 4. Defeitos e pontos de atenção

| # | Achado | Severidade | Teste | Situação atual |
|---|---|---|---|---|
| **D1** | **Não há e-mail de confirmação de compra.** O cliente fecha o pedido e não recebe nenhuma notificação por e-mail. | Média | TI09 | O `src/lib/email.js` só é usado para códigos de cadastro e de senha. |
| **D2** | **A busca de produtos não ignora acentos.** Quem digita "racao" (sem acento — muito comum) não encontra "Ração". | Média (conversão / UX) | TF07 | `products.service.listar` compara com `String.includes`, sem normalizar. |
| **D3** | **Site sem HTTPS/TLS.** | Alta (produção) | TS01 | O Express serve em HTTP puro; não há proxy TLS nem HSTS. Requisito para LGPD e PCI-DSS. |
| **D4** | **Faltam cabeçalhos de segurança HTTP** (CSP, HSTS, X-Content-Type-Options, X-Frame-Options). | Média | TS05 | Só o `x-powered-by` é removido. |
| **D5** | **Login sem limite de tentativas.** Vulnerável a ataque de força bruta. | Média/Alta | TS06 | Nenhum rate limiting nas rotas de autenticação. |
| **D6** | **Código de verificação no corpo da resposta** quando não há SMTP configurado. | Baixa em dev · Alta se for para produção sem SMTP | TS07 | `codigoDev` é retornado no JSON quando `SMTP_HOST` não está definido. |

### Pontos que passaram e merecem destaque

- Fluxo de autenticação robusto: confirmação de e-mail obrigatória, contador de tentativas, expiração e *throttle* de reenvio (TF01–TF05).
- Webhook de pagamento **autenticado por HMAC e idempotente** (TI04–TI06) — evita fraude e processamento duplicado.
- Cálculo de frete coerente e com bloqueio de área de entrega já validado no servidor (TI01, TF15).
- Nenhuma exposição de senha nem coleta de dados de cartão (TS02, TS03).
- Desempenho excelente na medição local: todas as páginas abaixo de 20 ms (TU03).

---

## 5. Sugestões de mudança para o site

### Prioridade alta (antes de ir para produção)

1. **Enviar e-mail de confirmação de compra** (corrige D1). Ao criar o pedido, disparar
   "Pedido `PED-xxx` recebido" e, no webhook `payment.approved`, "Pagamento confirmado —
   pedido em separação". Reutilizar `src/lib/email.js`.
2. **HTTPS obrigatório** (corrige D3). Servir atrás de Nginx/Caddy ou de uma plataforma com
   TLS; redirecionar 80 → 443; adicionar `Strict-Transport-Security`.
3. **Rate limiting na autenticação** (corrige D5). `express-rate-limit` em `/api/auth/*`
   (ex.: 10 tentativas / 15 min por IP), com atraso progressivo.
4. **Cabeçalhos de segurança** (corrige D4). Adicionar `helmet` no `src/app.js`.
5. **Bloquear boot em produção sem SMTP** (corrige D6). Se `NODE_ENV=production` e não
   houver `SMTP_HOST`, recusar iniciar; nunca retornar `codigoDev` em produção.
6. **Banco de dados real.** Migrar `data/db.json` para PostgreSQL (concorrência,
   integridade transacional, backup). A camada `src/db/store.js` já isola essa troca.

### Prioridade média (experiência e robustez)

7. **Busca tolerante a acento e caixa** (corrige D2). Normalizar
   (`.normalize("NFD").replace(/\p{Diacritic}/gu, "")`) os dois lados da comparação.
   Extra: ordenação por preço/relevância e contador de resultados visível.
8. **Reserva de estoque com expiração.** Hoje o estoque é reservado ao criar o pedido e só
   volta em `payment.failed`/`refunded`. Adicionar liberação automática de pedidos Pix não
   pagos após 30 min.
9. **Tela de acompanhamento do pedido.** O código de rastreio é gerado, mas não há
   histórico de status visível para o cliente — expor a linha do tempo do pedido no painel.
10. **Trocar segredos padrão.** `JWT_SECRET` e a senha do admin (`admin123`) devem ser
    obrigatoriamente definidos por variável de ambiente forte em produção.

### Prioridade baixa (evolução)

11. **CI com testes automatizados.** Rodar a suíte `testes.mjs` a cada push (GitHub Actions).
12. **Front-end em framework** (React/Next) para telas mais ricas de conta e catálogo.
13. **Confirmação de e-mail com link**, além do código, para reduzir atrito.
14. **Métricas reais de desempenho** (Lighthouse / WebPageTest) sobre o site publicado, já
    que a medição atual é local e sem rede.

---

## 6. Como reproduzir os testes

```bash
# 1. subir o servidor com banco limpo
npm run seed
npm start

# 2. em outro terminal, rodar a suíte (gera resultados-testes.csv/.json)
node tests/e2e.mjs
```

A suíte cobre os 35 casos acima e imprime PASS/FAIL/WARN por caso, com a evidência de cada um.
