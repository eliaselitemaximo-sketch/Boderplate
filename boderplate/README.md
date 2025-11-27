# Marketplace Boilerplate (Resumo Original)

Boilerplate de backend para integração de marketplace e autenticação, construído com Express, TypeScript, Drizzle ORM e PostgreSQL.

## 🏗️ Arquitetura

Este projeto segue uma **Arquitetura em Camadas** (Layered Architecture) para garantir a separação de responsabilidades, escalabilidade e manutenibilidade.

### Stack Tecnológica
- **Runtime**: Node.js
- **Linguagem**: TypeScript
- **Framework**: Express.js
- **ORM**: Drizzle ORM
- **Banco de Dados**: PostgreSQL
- **Cache**: Redis (via `ioredis`)
- **Validação**: express-validator
- **Logs**: Pino

### Camadas da Arquitetura
O fluxo da aplicação percorre as seguintes camadas:

1.  **Rotas (`src/routes`)**: Definem os endpoints da API e os mapeiam para os controllers. Middlewares (como autenticação) são aplicados aqui.
2.  **Controllers (`src/controllers`)**: Lidam com as requisições HTTP recebidas, validam os dados de entrada e chamam os serviços apropriados. Retornam as respostas HTTP.
3.  **DTOs (`src/dtos`)**: Validação de objetos utilizados para transportar dados entre as camadas.
4.  **Serviços (`src/services`)**: Contêm a lógica de negócio. Eles orquestram o fluxo de dados e interagem com os repositórios.
5.  **Repositórios (`src/repositories`)**: Lidam com as interações diretas com o banco de dados usando o Drizzle ORM. Eles abstraem a camada de acesso a dados e instanciam nossas **entidades (`src/entities`)** para validação dos dados.
6.  **Entidades/Schema (`src/infra`)**: Definem a estrutura do que é externo a aplicação, configuração de database e cache.

### Fluxo da Requisição
![Fluxo da Requisição](https://mermaid.ink/img/CnNlcXVlbmNlRGlhZ3JhbQogICAgcGFydGljaXBhbnQgQ2xpZW50ZQogICAgcGFydGljaXBhbnQgUm90YQogICAgcGFydGljaXBhbnQgTWlkZGxld2FyZQogICAgcGFydGljaXBhbnQgQ29udHJvbGxlcgogICAgcGFydGljaXBhbnQgU2VydmljbwogICAgcGFydGljaXBhbnQgUmVwb3NpdG9yaW8KICAgIHBhcnRpY2lwYW50IEJhbmNvRGVEYWRvcwoKICAgIENsaWVudGUtPj5Sb3RhOiBSZXF1aXNpw6fDo28gSFRUUAogICAgUm90YS0+Pk1pZGRsZXdhcmU6IFZhbGlkYXIgVG9rZW4vQXV0aAogICAgTWlkZGxld2FyZS0tPj5Sb3RhOiBOZXh0KCkKICAgIFJvdGEtPj5Db250cm9sbGVyOiBEZXNwYWNoYXIgUmVxdWlzacOnw6NvCiAgICBDb250cm9sbGVyLT4+U2VydmljbzogQ2hhbWFyIEzDs2dpY2EgZGUgTmVnw7NjaW8KICAgIFNlcnZpY28tPj5SZXBvc2l0b3JpbzogU29saWNpdGFyIE9wZXJhw6fDo28gZGUgRGFkb3MKICAgIFJlcG9zaXRvcmlvLT4+QmFuY29EZURhZG9zOiBFeGVjdXRhciBRdWVyeSAoRHJpenpsZSkKICAgIEJhbmNvRGVEYWRvcy0tPj5SZXBvc2l0b3JpbzogUmV0b3JuYXIgRGFkb3MKICAgIFJlcG9zaXRvcmlvLS0+PlNlcnZpY286IFJldG9ybmFyIEVudGlkYWRlCiAgICBTZXJ2aWNvLT4+Q29udHJvbGxlcjogUmV0b3JuYXIgUmVzdWx0YWRvCiAgICBDb250cm9sbGVyLS0+PkNsaWVudGU6IFJlc3Bvc3RhIEhUVFAK)

## 🗄️ Schema do Banco de Dados e Entidades

O schema do banco de dados é definido usando Drizzle ORM em `src/infra/database/schema.ts`.

### Entidades

1.  **`user_marketplace`**
    *   **Descrição**: A entidade principal representando um usuário ou conta no sistema.
    *   **Campos Chave**: `id` (UUID), `nome`, `type` (Tipo de Marketplace: 'ml', 'sh', 'tk'), `status`, `accessToken`, `refreshToken`.

2.  **`auth_mercadolivre`**
    *   **Descrição**: Armazena detalhes de autenticação específicos para a integração com Mercado Livre.
    *   **Relacionamento**: Um-para-Um com `user_marketplace`.
    *   **Campos Chave**: `userMarketplaceId` (FK), `userId`, `scope`.

3.  **`auth_shopee`**
    *   **Descrição**: Armazena detalhes de autenticação específicos para a integração com Shopee.
    *   **Relacionamento**: Um-para-Um com `user_marketplace`.
    *   **Campos Chave**: `userMarketplaceId` (FK), `shopId`, `mainAccountId`.

4.  **`auth_tiktokshop`**
    *   **Descrição**: Armazena detalhes de autenticação específicos para a integração com TikTok Shop.
    *   **Relacionamento**: Um-para-Um com `user_marketplace`.
    *   **Campos Chave**: `userMarketplaceId` (FK), `userId`, `scope`.

5.  **`webhook_logs`**
    *   **Descrição**: Armazena detalhes de logs de webhooks em cache.
    *   **Campos Chave**: `id` (UUID), `request`, `created_at`.

### Diagrama de Relacionamento de Entidades (ERD)

![Diagrama ER](https://mermaid.ink/img/CmVyRGlhZ3JhbQogICAgdXNlcl9tYXJrZXRwbGFjZSB8fC0tfHwgYXV0aF9tZXJjYWRvbGl2cmUgOiAicG9zc3VpIGF1dGVudGljYcOnw6NvIHBhcmEiCiAgICB1c2VyX21hcmtldHBsYWNlIHx8LS18fCBhdXRoX3Nob3BlZSA6ICJwb3NzdWkgYXV0ZW50aWNhw6fDo28gcGFyYSIKICAgIHVzZXJfbWFya2V0cGxhY2UgfHwtLXx8IGF1dGhfdGlrdG9rc2hvcCA6ICJwb3NzdWkgYXV0ZW50aWNhw6fDo28gcGFyYSIKCiAgICB1c2VyX21hcmtldHBsYWNlIHsKICAgICAgICB1dWlkIGlkIFBLCiAgICAgICAgdmFyY2hhciBub21lCiAgICAgICAgdmFyY2hhciB0eXBlCiAgICAgICAgYm9vbGVhbiBzdGF0dXMKICAgICAgICB2YXJjaGFyIGFjY2Vzc190b2tlbgogICAgICAgIHZhcmNoYXIgcmVmcmVzaF90b2tlbgogICAgICAgIHRpbWVzdGFtcCBjcmVhdGVkX2luCiAgICB9CgogICAgYXV0aF9tZXJjYWRvbGl2cmUgewogICAgICAgIHV1aWQgdXNlcl9tYXJrZXRwbGFjZV9pZCBQSywgRksKICAgICAgICB2YXJjaGFyIHVzZXJfaWQKICAgICAgICB0ZXh0IHNjb3BlCiAgICAgICAgdGltZXN0YW1wIGNyZWF0ZWRfYXQKICAgICAgICB0aW1lc3RhbXAgdXBkYXRlZF9hdAogICAgfQoKICAgIGF1dGhfc2hvcGVlIHsKICAgICAgICB1dWlkIHVzZXJfbWFya2V0cGxhY2VfaWQgUEssIEZLCiAgICAgICAgdmFyY2hhciBzaG9wX2lkCiAgICAgICAgdmFyY2hhciBtYWluX2FjY291bnRfaWQKICAgICAgICB0ZXh0IG1lcmNoYW50X2lkX2xpc3QKICAgICAgICB0ZXh0IHNocF9pZF9saXN0CiAgICAgICAgdGltZXN0YW1wIGNyZWF0ZWRfYXQKICAgICAgICB0aW1lc3RhbXAgdXBkYXRlZF9hdAogICAgfQoKICAgIGF1dGhfdGlrdG9rc2hvcCB7CiAgICAgICAgdXVpZCB1c2VyX21hcmtldHBsYWNlX2lkIFBLLCBGSwogICAgICAgIHZhcmNoYXIgdXNlcl9pZAogICAgICAgIHRleHQgc2NvcGUKICAgICAgICB0aW1lc3RhbXAgY3JlYXRlZF9hdAogICAgICAgIHRpbWVzdGFtcCB1cGRhdGVkX2F0CiAgICB9CgogICAgd2ViaG9va19sb2dzIHsKICAgICAgICB1dWlkIGlkIFBLCiAgICAgICAganNvbmIgcmVxdWVzdAogICAgICAgIHRpbWVzdGFtcCBjcmVhdGVkX2F0CiAgICB9Cg==)

## 🚀 Como Começar

1.  **Instalar Dependências**:
    ```bash
    npm install
    ```

2.  **Configuração de Ambiente**:
   `.env` credenciais de banco de dados e redis e auth marketplace.

3.  **Migração de Banco de Dados**:
    ```bash
    npm run db:generate
    npm run db:migrate
    npm run db:push
    ```

4.  **Rodar Servidor de Desenvolvimento**:
    ```bash
    npm run dev
    ```
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------





## ⚠️ Limitações e Próximos Passos

1. **Redis obrigatório**  
   A aplicação depende de um Redis acessível em `REDIS_URL`. Se não houver instância disponível, as filas e o histórico de notificações deixam de funcionar, mesmo que a API esteja respondendo. Configure um Redis local (`redis://localhost:6379`), um container (`docker run redis`) ou um serviço gerenciado antes de iniciar o servidor.

2. **Cache de tokens do Mercado Livre**  
   O serviço `TokenMlbService` mantém o último `accessToken` em memória. Depois de executar `/api/marketplace/auth/refresh-token`, limpe manualmente o cache (reiniciando a API) ou ajuste o serviço para chamar `clearCache()` após atualizar o token, evitando 401 quando o token expira.

3. **Endpoint `/api/marketplace/webhook/status` expõe credenciais**  
   Essa rota não usa `authMiddleware` e retorna `accessToken`/`userId`. Proteja o endpoint com autenticação ou remova os dados sensíveis antes de expor o status em produção.

4. **Endpoint `/api/marketplace/webhook/logs`**  
   Atualmente responde com as notificações salvas em cache. Para consultar os logs reais, adapte o controller para utilizar `WebhookLogRepository` (ou o `WebhookService`) até que o ajuste seja implementado.

5. **Execução com Docker**  
   - Alinhe o `PORT` exposto no `docker-compose.yaml` com a porta que a app lê (`process.env.PORT || 3000`). Ex.: defina `PORT=4000` no `.env` e mantenha `ports: - "4000:4000"`.  
   - O alvo `target: production` exige um estágio com esse nome no `Dockerfile`. Inclua `AS production` no estágio final ou remova o `target` para que `docker compose build` funcione.  
   - Inclua serviços auxiliares (Postgres/Redis) no `docker-compose.yaml` se quiser subir o ambiente completo com um único comando.

Documente as correções implementadas na mesma seção para manter o projeto alinhado com o estado atual do código.

---

# Marketplace Boilerplate (Documentação Detalhada)
# Marketplace Boilerplate

Backend de referência para integrações com marketplaces (Mercado Livre, Shopee e TikTok Shop). O projeto centraliza autenticação, ingestão de webhooks, recuperação de notificações perdidas e persistência de dados de vendas utilizando Express + TypeScript.

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Stack e Arquitetura](#stack-e-arquitetura)
3. [Principais Recursos](#principais-recursos)
4. [Estrutura de Pastas](#estrutura-de-pastas)
5. [Requisitos](#requisitos)
6. [Configuração de Ambiente](#configuração-de-ambiente)
7. [Banco de Dados e Migrations](#banco-de-dados-e-migrations)
8. [Execução (Dev, Build e Docker)](#execução)
9. [Fluxos de Autenticação](#fluxos-de-autenticação)
10. [Webhooks e Processamento de Pedidos](#webhooks-e-processamento-de-pedidos)
11. [Monitoramento e Logs](#monitoramento-e-logs)
12. [Testes e Checklist Manual](#testes-e-checklist-manual)
13. [Roadmap & Pendências Conhecidas](#roadmap--pendências-conhecidas)

---

## Visão Geral

- **Objetivo:** acelerar integrações com marketplaces oferecendo endpoints padronizados para onboarding de sellers, gestão de tokens OAuth, consumo de notificações e sincronização de pedidos.
- **Linguagem:** TypeScript
- **Framework:** Express.js
- **Banco:** PostgreSQL (Drizzle ORM)
- **Cache & fila leve:** Redis (ioredis)
- **Logs:** Pino + pino-pretty

---

## Stack e Arquitetura

| Camada | Descrição | Local |
| --- | --- | --- |
| Entrada HTTP | Rotas + middlewares (CORS, auth) | `src/routes`, `src/middleware` |
| Controllers | Tratam requisições e formam respostas | `src/controllers` |
| Serviços | Lógica de negócio por domínio/marketplace | `src/services` |
| Repositórios | Postgres (Drizzle) e Redis | `src/repositories`, `src/infra` |
| Entidades/DTOs | Objetos de domínio e contratos | `src/entities`, `src/dtos` |
| Infra | Configurações de DB, cache e log | `src/infra` |

Fluxo base:
```
Cliente -> Rotas -> Controller -> Serviço -> Repositório -> DB/Redis
                                          ↘ Queue -> Services externos
```

---

## Principais Recursos

- **Autenticação administrativa** via API Key + JWT (`/api/auth/login`, `/api/auth/verify`).
- **Gestão de marketplaces de usuários** (CRUD completo em `/api/marketplace/user`).
- **Autorização OAuth por marketplace**, com geração de URL e callbacks dedicados:
  - Mercado Livre: `AuthMercadoLivreService`
  - Shopee: `AuthShopeeService`
  - TikTok Shop: `AuthTikTokShopService`
- **Módulo Mercado Livre unificado** (`src/modules/mercadolivre`), com a entidade `MercadoLivreApp` centralizando credenciais e o `MercadoLivreModule` entregando serviços (tokens, API client, fila e recuperação de notificações) prontos para uso.
- **Recepção de Webhooks** (Mercado Livre `orders`) com persistência em Redis + fila interna (`QueueService`).
- **Recuperação de notificações perdidas** e reprocessamento através da API oficial do Mercado Livre (`NotificationRecoveryService`).
- **Processamento de pedidos/pacotes** com enriquecimento via API Mercado Livre e armazenado em `vendas_completas`.

---

## Estrutura de Pastas

```
src
 ├─ controllers/        # Admin, Marketplace, Webhook...
 ├─ routes/             # Definição dos endpoints REST
 ├─ middleware/         # Auth JWT
 ├─ services/           # Lógica de negócio por domínio
 │   ├─ mercadolivre/
 │   ├─ mlb_api/
 │   ├─ shopee/
 │   └─ tiktokshop/
 ├─ repositories/       # Postgres + Redis
 ├─ entities/           # Modelos de domínio
 ├─ dtos/               # Contratos de entrada/saída
 └─ infra/
     ├─ database/
     ├─ cache/
     └─ logs/
```

---

## Requisitos

- Node.js 20+
- npm 9+
- PostgreSQL 14+ com acesso via URL única (`DATABASE_URL`)
- Redis 6+ (local, Docker ou serviço gerenciado)
- `drizzle-kit` instalado via `npm install`

---

## Configuração de Ambiente

Crie um `.env` na raiz com, pelo menos:

```
PORT=3000
API_KEY=admin-secret
SESSION_SECRET=jwt-secret

DATABASE_URL=postgres://user:pass@host:5432/dbname
REDIS_URL=redis://localhost:6379

# Mercado Livre
NAME_APP_ML=MinhaAppML
CLIENT_KEY_ML=<app-id>
CLIENT_SECRET_ML=<client-secret>
REDIRECT_URL_ML=https://meuapp.com/meli/callback
WEBHOOK_URL_ML=https://meuapp.com/api/marketplace/webhook

# Shopee
NAME_APP_SH=MinhaAppShopee
CLIENT_KEY_SH=<partner-id>
CLIENT_SECRET_SH=<partner-key>
REDIRECT_URL_SH=https://meuapp.com/shopee/callback

# TikTok Shop
NAME_APP_TK=MinhaAppTikTok
CLIENT_KEY_TK=<app-key>
CLIENT_SECRET_TK=<app-secret>
REDIRECT_URL_TK=https://meuapp.com/tiktok/callback

WEBHOOK_LOGS_TTL=604800
MAX_WEBHOOK_LOGS=90000
QUEUE_CONCURRENT=1
QUEUE_RETRY_DELAY=5000
API_MAX_RETRIES=3
```

> **Importante:** o Redis precisa estar acessível antes de rodar a API. Sem ele, a fila e os históricos não funcionam.

---

## Banco de Dados e Migrations

- Schema definido em `src/infra/database/schema.ts`.
- Config Drizzle: `drizzle.config.ts`.

Comandos úteis:

```bash
npm run db:generate   # gera SQL a partir dos schemas
npm run db:migrate    # aplica migrações em ./drizzle
npm run db:push       # sincroniza schema atual diretamente
npm run db:studio     # visualização via drizzle-kit
```

Tabelas principais:
- `user_marketplace`, `auth_mercadolivre`, `auth_shopee`, `auth_tiktokshop`
- `webhook_logs` (cache em Redis)
- `vendas_completas` (dados enriquecidos de pedidos/pacotes)

---

## Execução

### Desenvolvimento
```bash
npm install
npm run dev   # tsx watch src/index.ts
```

### Build & Produção local
```bash
npm run build
npm start     # executa dist/index.js
```

### Docker

1. Ajuste `docker-compose.yaml` para garantir que:
   - `PORT` exposto bate com `process.env.PORT` (ex.: `PORT=4000` → `ports: - "4000:4000"`).
   - O `Dockerfile` tenha estágio `AS production` ou remova `target: production`.
   - Opcional: adicione serviços `postgres` e `redis` ao compose.

2. Execute:
```bash
docker compose up --build
```

---

## Fluxos de Autenticação

1. **Admin**
   - `POST /api/auth/login` → envia `{ apiKey }`, recebe JWT válido por 7 dias.
   - `POST /api/auth/verify` → valida token.
   - Middleware `authMiddleware` protege rotas privadas (user marketplace, credenciais e refresh de tokens).

2. **Mercado Livre**
   - `GET /api/marketplace/auth/:id` → gera URL de autorização (usa `AuthStateService`).
   - Callback `GET /api/marketplace/auth/mercadolivre/code` faz `exchange` e salva `accessToken/refreshToken`.
   - Refresh manual via `POST /api/marketplace/auth/refresh-token`.
   - **Observação:** `TokenMlbService` mantém cache em memória; limpe com `clearCache()` (ou reinicie a API) após refresh para evitar usar token expirado.

3. **Shopee / TikTok Shop**
   - Fluxo equivalente, com assinatura HMAC específica de cada marketplace.

---

## Webhooks e Processamento de Pedidos

- Recepção em `POST /api/marketplace/webhook/` ou `/webhook`.
- Só tópicos/orders são enfileirados. Cada payload vira um `WebhookNotification` no Redis.
- `QueueService` processa a fila e chama `OrderProcessingService`, que:
  1. Consulta ordem, envio e pagamento via API Mercado Livre (`ApiMlbService`).
  2. Traduz status, frete, parcelamento, cancelamentos.
  3. Persiste em `vendas_completas` (tipo `venda_item`, `item_pacote` ou `pacote`).

Recuperação automática:
- `NotificationRecoveryService` roda a cada 30 min (config em `src/index.ts`), busca notificações perdidas (`/missed_feeds`) e reprocessa falhas.

Rotas de suporte (`/api/marketplace/webhook/*`):
- `health`, `status`, `processar-ordem/:orderId`, `recuperar-notificacoes`, `reprocessar-notificacoes`, `historico-notificacoes`, `estatisticas-notificacoes`, `limpar-fila`.
- **Pendente:** `GET /status` ainda expõe `accessToken`/`userId` e não exige autenticação.

---

## Monitoramento e Logs

- Logger padrão: `src/infra/logs/logger.ts` (Pino Pretty).
- Cada controller/service adiciona `context`, `action`, `status` e payloads resumidos.
- Webhook logs são persistidos em Redis (`WebhookLogRepository`) com TTL configurável.
- Para consultar rapidamente:
  ```ts
  import logger from './utils/logger';
  logger.info({ context: 'custom', message: '...' });
  ```

---

## Testes e Checklist Manual

Não há testes automatizados ainda. Recomenda-se o seguinte checklist manual após alterações relevantes:

1. `npm run build` sem erros.
2. `npm run dev` com Redis e Postgres ativos → verificar `/health`.
3. Fluxo Mercado Livre:
   - Criar `user_marketplace` (tipo `ml`).
   - `GET /api/marketplace/auth/:id` → abrir URL, autorizar e confirmar callback salvando tokens.
   - Chamar `POST /api/marketplace/auth/refresh-token` e garantir que os tokens mudaram.
4. Enviar webhook fake `orders` e verificar:
   - registro em Redis,
   - item na fila,
   - entrada em `vendas_completas`.
5. `POST /api/marketplace/webhook/recuperar-notificacoes` com tokens válidos → observar logs.
6. Rotas protegidas retornam 401 quando sem Bearer token.

---

## Roadmap & Pendências Conhecidas

1. **Redis obrigatório:** adicionar fallback/graceful shutdown quando indisponível.
2. **Token cache (Mercado Livre):** invalidar automaticamente após refresh para evitar 401.
3. **Segurança do `/api/marketplace/webhook/status`:** proteger com `authMiddleware` e/ou remover campos sensíveis.
4. **`/api/marketplace/webhook/logs`:** apontar para `WebhookLogRepository` em vez de reutilizar o repositório de notificações.
5. **Docker Compose:** alinhar `PORT` e estágios do `Dockerfile`; adicionar serviços auxiliares para facilitar `docker compose up`.
6. **Cobertura de testes:** incluir mocks para APIs externas e testes de integração do webhook.

Atualizações no fluxo do Mercado Livre devem ser registradas nesta seção até que os ajustes pendentes (cache e segurança de endpoints) sejam concluídos.

---

> Sinta-se à vontade para abrir issues ou PRs descrevendo novas integrações, melhorias no pipeline de processamento e automações de observabilidade. Contributions são bem-vindas! 🙌

