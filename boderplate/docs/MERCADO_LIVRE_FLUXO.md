# 📘 Documentação do Fluxo de Funcionamento - Mercado Livre

## 📋 Índice

1. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
2. [Fluxo de Autenticação OAuth](#fluxo-de-autenticação-oauth)
3. [Fluxo de Webhooks e Processamento de Pedidos](#fluxo-de-webhooks-e-processamento-de-pedidos)
4. [Fluxo de Recuperação de Notificações](#fluxo-de-recuperação-de-notificações)
5. [Estrutura de Dados](#estrutura-de-dados)
6. [Componentes e Responsabilidades](#componentes-e-responsabilidades)

---

## 🏗️ Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                    MERCADO LIVRE INTEGRATION                    │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   ENTITIES   │      │   SERVICES   │      │ REPOSITORIES │
│              │      │              │      │              │
│ MercadoLivre │◄────►│ TokenMlb     │◄────►│ UserMarket   │
│ WebhookNotif │      │ ApiMlb       │      │ AuthMercado   │
│              │      │ AuthMercado  │      │ WebhookNotif  │
│              │      │ Queue        │      │ VendaCompleta │
│              │      │ OrderProcess │      │              │
│              │      │ NotifRecover │      │              │
└──────────────┘      └──────────────┘      └──────────────┘
       ▲                     ▲                      ▲
       │                     │                      │
       └─────────────────────┴──────────────────────┘
                            │
                   ┌────────▼────────┐
                   │   FACTORY       │
                   │ MercadoLivre    │
                   │ Factory          │
                   └─────────────────┘
                            │
       ┌────────────────────┼────────────────────┐
       │                    │                     │
┌──────▼──────┐    ┌────────▼────────┐   ┌───────▼──────┐
│ CONTROLLERS│    │   EXTERNAL API  │   │   DATABASE   │
│             │    │                 │   │              │
│ Webhook     │    │ Mercado Livre  │   │ PostgreSQL   │
│ AuthMarket  │    │ API             │   │ Redis        │
└─────────────┘    └─────────────────┘   └──────────────┘
```

---

## 🔐 Fluxo de Autenticação OAuth

### 1. Inicialização do Fluxo

```
Cliente (Frontend/Postman)
    │
    │ GET /api/marketplace/auth/:userMarketplaceId
    ▼
AuthMarketplaceController.createAuthorizationURL()
    │
    │ Busca UserMarketplace no banco
    ▼
AuthMercadoLivreService.createAuthorizationURL()
    │
    │ Gera URL de autorização com:
    │ - clientId (CLIENT_KEY_ML)
    │ - redirectUri (REDIRECT_URL_ML)
    │ - state (gerado por AuthStateService)
    ▼
Retorna: { authUrl: "https://auth.mercadolivre.com.br/authorization?..." }
```

**Código:**
- `src/controllers/AuthMarketplaceController.ts` → `createAuthorizationURL()`
- `src/services/mercadolivre/mlb_api/AuthMercadoLivreService.ts` → `createAuthorizationURL()`

### 2. Autorização do Usuário

```
Cliente acessa authUrl
    │
    │ Redireciona para Mercado Livre
    ▼
Mercado Livre - Tela de Autorização
    │
    │ Usuário autoriza a aplicação
    ▼
Mercado Livre redireciona para REDIRECT_URL_ML
    │
    │ Query params: ?code=XXX&state=YYY
    ▼
GET /api/marketplace/auth/mercadolivre/callback
```

### 3. Troca de Código por Token

```
AuthMarketplaceController.mercadoLivreCallback()
    │
    │ Valida code e state
    ▼
AuthMercadoLivreService.exchangeCodeForToken()
    │
    │ POST https://api.mercadolibre.com/oauth/token
    │ Body: {
    │   grant_type: "authorization_code",
    │   client_id: CLIENT_KEY_ML,
    │   client_secret: CLIENT_SECRET_ML,
    │   code: code,
    │   redirect_uri: REDIRECT_URL_ML
    │ }
    ▼
Mercado Livre API retorna:
    {
      access_token: "...",
      refresh_token: "...",
      expires_in: 21600,
      token_type: "Bearer",
      user_id: "...",
      scope: "..."
    }
    │
    │ Salva tokens no banco
    ▼
UserMarketplaceRepository.update()
    │
    │ Salva accessToken e refreshToken
    │ em user_marketplace table
    ▼
AuthMercadoLivreRepository.create()
    │
    │ Salva userId e scope
    │ em auth_mercadolivre table
    ▼
TokenMlbService.clearCache()
    │
    │ Limpa cache do token em memória
    ▼
Retorna tokens para o cliente
```

**Arquivos envolvidos:**
- `src/controllers/AuthMarketplaceController.ts` → `mercadoLivreCallback()`
- `src/services/mercadolivre/mlb_api/AuthMercadoLivreService.ts` → `exchangeCodeForToken()`
- `src/repositories/UserMarketplaceRepository.ts`
- `src/repositories/mercadolivre/AuthMercadoLivreRepository.ts`
- `src/services/mercadolivre/mlb_api/TokenMlbService.ts` → `clearCache()`

### 4. Refresh Token (Renovação)

```
Cliente
    │
    │ POST /api/marketplace/auth/refresh-token
    │ Body: { userMarketplaceId: "..." }
    ▼
AuthMarketplaceController.refreshToken()
    │
    │ Busca UserMarketplace
    ▼
AuthMercadoLivreService.refreshAccessToken()
    │
    │ POST https://api.mercadolibre.com/oauth/token
    │ Body: {
    │   grant_type: "refresh_token",
    │   client_id: CLIENT_KEY_ML,
    │   client_secret: CLIENT_SECRET_ML,
    │   refresh_token: refreshToken do banco
    │ }
    ▼
Mercado Livre retorna novos tokens
    │
    │ Atualiza no banco
    ▼
UserMarketplaceRepository.update()
    │
    │ Limpa cache
    ▼
TokenMlbService.clearCache()
```

---

## 📨 Fluxo de Webhooks e Processamento de Pedidos

### 1. Recepção do Webhook

```
Mercado Livre
    │
    │ POST /api/marketplace/webhook
    │ Body: {
    │   _id: "notification_id",
    │   resource: "/orders/123456789",
    │   topic: "orders",
    │   user_id: "...",
    │   application_id: "...",
    │   sent: "2024-01-01T00:00:00Z"
    │ }
    ▼
WebhookController.handleWebhook()
    │
    │ Responde imediatamente: 200 OK
    │ (não espera processamento)
    ▼
Valida se é tópico de interesse
    │
    │ topic === 'orders' OU resource.includes('/orders/')
    ▼
Cria WebhookNotification entity
    │
    │ new WebhookNotification(...)
    ▼
WebhookNotificationRepository.create()
    │
    │ Salva no Redis
    │ Key: webhook:notification:{notificationId}
    │ TTL: 30 dias (configurável)
    ▼
Extrai orderId do resource
    │
    │ resource.split('/').pop() → "123456789"
    ▼
QueueService.adicionar()
    │
    │ Adiciona tarefa à fila:
    │ {
    │   tipo: 'order',
    │   orderId: '123456789',
    │   notificationId: 'notification_id'
    │ }
    ▼
QueueService.processar() (assíncrono)
```

**Arquivos:**
- `src/controllers/WebhookController.ts` → `handleWebhook()`
- `src/repositories/mercadolivre/WebhookNotificationRepository.ts` → `create()`
- `src/services/mercadolivre/QueueService.ts` → `adicionar()`

### 2. Processamento da Fila

```
QueueService.processar() (chamado automaticamente)
    │
    │ Verifica se pode processar
    │ (maxConcorrente, fila não vazia)
    ▼
Remove tarefa da fila
    │
    │ task = fila.shift()
    ▼
QueueService.executarTarefa()
    │
    │ switch (task.tipo) {
    │   case 'order':
    │     OrderProcessingService.processOrder(orderId)
    │ }
    ▼
OrderProcessingService.processOrder()
    │
    │ 1. Busca dados da ordem
    ▼
ApiMlbService.getOrder(orderId)
    │
    │ GET https://api.mercadolibre.com/orders/{orderId}
    │ Headers: { Authorization: "Bearer {accessToken}" }
    │
    │ TokenMlbService.getAccessToken()
    │   │
    │   │ Busca no banco (com cache em memória)
    │   ▼
    │   UserMarketplaceRepository.findAll()
    │     │
    │     │ Filtra: type='ml' AND status=true
    │     ▼
    │   Retorna accessToken
    ▼
Retorna dados da ordem
    │
    │ 2. Busca dados do envio (se existir)
    ▼
ApiMlbService.getShipment(shipmentId)
    │
    │ GET https://api.mercadolibre.com/shipments/{shipmentId}
    │ (com delay de API_DELAY ms entre requisições)
    ▼
Retorna dados do envio
    │
    │ 3. Busca dados do pagamento (se existir)
    ▼
ApiMlbService.getPayment(paymentId)
    │
    │ GET https://api.mercadolibre.com/collections/{paymentId}
    ▼
Retorna dados do pagamento
    │
    │ 4. Processa e salva venda
    ▼
OrderProcessingService.processarVenda()
```

**Arquivos:**
- `src/services/mercadolivre/QueueService.ts` → `processar()`, `executarTarefa()`
- `src/services/mercadolivre/OrderProcessingService.ts` → `processOrder()`
- `src/services/mercadolivre/mlb_api/ApiMlbService.ts` → `getOrder()`, `getShipment()`, `getPayment()`
- `src/services/mercadolivre/mlb_api/TokenMlbService.ts` → `getAccessToken()`

### 3. Processamento da Venda

```
OrderProcessingService.processarVenda()
    │
    │ Verifica se é pacote
    │ if (order.pack_id)
    ▼
OrderProcessingService.verifyRealPack()
    │
    │ Busca pack e verifica se tem 2+ itens únicos
    │ Se sim → processa como pacote
    │ Se não → processa como venda individual
    ▼
Para cada item em order.order_items:
    │
    │ Extrai dados:
    │ - Dados do item (título, SKU, quantidade, preço)
    │ - Dados do comprador
    │ - Status da venda (traduzido)
    │ - Dados de pagamento (método, parcelas, etc.)
    │ - Dados de envio (rastreio, transportadora, etc.)
    │ - Dados de cancelamento/reembolso (se houver)
    ▼
VendaCompletaRepository.salvarVenda()
    │
    │ Insere na tabela vendas_completas
    │ tipo_registro: 'venda_item'
    │ (ou 'item_pacote' se for pacote)
    ▼
Se for pacote real:
    │
    │ 1. Salva registro do pacote (tipo_registro: 'pacote')
    │ 2. Salva cada item do pacote (tipo_registro: 'item_pacote')
    ▼
Marca notificação como processada
    │
    │ WebhookNotificationRepository.updateByNotificationId()
    │ processed: true
    │ processedAt: new Date()
    ▼
Atualiza estatísticas da fila
    │
    │ estatisticas.totalProcessado++
```

**Arquivos:**
- `src/services/mercadolivre/OrderProcessingService.ts` → `processarVenda()`, `processarPacote()`
- `src/repositories/mercadolivre/VendaCompletaRepository.ts` → `salvarVenda()`
- `src/repositories/mercadolivre/WebhookNotificationRepository.ts` → `updateByNotificationId()`

### 4. Tratamento de Erros e Retry

```
Se erro ocorrer durante processamento:
    │
    │ task.tentativas++
    ▼
Se tentativas < maxTentativas (padrão: 3):
    │
    │ Agenda retry após QUEUE_RETRY_DELAY ms
    │ (padrão: 5000ms)
    ▼
    fila.push(task) // Recoloca na fila
    │
    │ estatisticas.totalRetries++
    ▼
Se tentativas >= maxTentativas:
    │
    │ Marca notificação com erro
    ▼
    WebhookNotificationRepository.updateByNotificationId()
    │
    │ processed: false
    │ errorMessage: error.message
    ▼
    estatisticas.totalErros++
```

---

## 🔄 Fluxo de Recuperação de Notificações

### 1. Recuperação Automática (A cada 30 minutos)

```
index.ts - verificacaoAutomaticaNotificacoes()
    │
    │ Executado a cada 30 minutos
    │ (primeira execução após 5 minutos)
    ▼
NotificationRecoveryService.processarNotificacoesPerdidas()
    │
    │ 1. Busca notificações perdidas na API
    ▼
NotificationRecoveryService.buscarNotificacoesPerdidas()
    │
    │ GET https://api.mercadolibre.com/missed_feeds
    │ ?app_id={CLIENT_KEY_ML}&user_id={userId}
    │
    │ TokenMlbService.getAccessToken()
    │ TokenMlbService.getUserId()
    ▼
Retorna array de notificações perdidas
    │
    │ Para cada notificação:
    │
    │ 2. Salva no Redis
    ▼
    WebhookNotificationRepository.create()
    │
    │ 3. Se for orders, adiciona à fila
    ▼
    QueueService.adicionar()
    │
    │ tipo: 'order',
    │ orderId: ...,
    │ notificationId: ...,
    │ isRecuperacao: true
    ▼
NotificationRecoveryService.reprocessarNotificacoesNaoProcessadas()
    │
    │ Busca notificações não processadas no Redis
    ▼
WebhookNotificationRepository.findUnprocessed(limit: 100)
    │
    │ Busca no Redis: processed = false
    ▼
Para cada notificação:
    │
    │ Adiciona à fila para reprocessamento
    ▼
QueueService.adicionar()
    │
    │ tipo: 'order',
    │ orderId: ...,
    │ notificationId: ...,
    │ isReprocessamento: true
```

**Arquivos:**
- `src/index.ts` → `verificacaoAutomaticaNotificacoes()`
- `src/services/mercadolivre/NotificationRecoveryService.ts` → `processarNotificacoesPerdidas()`, `reprocessarNotificacoesNaoProcessadas()`
- `src/services/mercadolivre/mlb_api/ApiMlbService.ts` → `getMissedFeeds()`

### 2. Recuperação Manual

```
Cliente
    │
    │ POST /api/marketplace/webhook/recuperar-notificacoes
    ▼
WebhookController.recuperarNotificacoes()
    │
    │ Chama o mesmo fluxo automático
    ▼
NotificationRecoveryService.processarNotificacoesPerdidas()
    │
    │ Retorna estatísticas
    ▼
{
  success: true,
  total: 10,
  processadas: 8,
  erros: 2,
  queue: { ... }
}
```

---

## 📊 Estrutura de Dados

### 1. Entidade MercadoLivre

**Localização:** `src/entities/MercadoLivre.ts`

```typescript
MercadoLivre {
  // Identificação
  id?: string
  userMarketplaceId: string
  userId?: string
  applicationId?: string
  
  // Dados do Usuário
  nome: string
  status: boolean
  createdIn?: Date
  
  // Autenticação OAuth
  accessToken?: string
  refreshToken?: string
  tokenType?: string
  expiresIn?: number
  scope?: string
  tokenExpiresAt?: Date
  
  // Configurações do App
  clientId: string
  clientSecret: string
  redirectUri: string
  webhookUrl: string
  appName: string
  
  // Configurações Operacionais
  timeoutMs: number
  maxRetries: number
  retryDelayMs: number
  apiDelayMs: number
  queueConcurrent: number
  queueRetryDelay: number
  maxTentativas: number
  
  // Estatísticas
  lastTokenRefresh?: Date
  lastApiCall?: Date
  totalApiCalls: number
  totalErrors: number
  isAuthenticated: boolean
}
```

### 2. WebhookNotification (Redis)

**Localização:** `src/entities/WebhookNotification.ts`

```typescript
WebhookNotification {
  id?: string
  notificationId?: string
  resource?: string          // "/orders/123456789"
  userId?: string
  topic?: string            // "orders"
  applicationId?: string
  attempts?: string
  sentAt?: Date
  receivedAt?: Date
  requestData?: any         // Payload completo do webhook
  responseData?: any
  processed: boolean
  processedAt?: Date
  errorMessage?: string
  updatedAt?: Date
}
```

**Armazenamento no Redis:**
- Key: `webhook:notification:{notificationId}`
- TTL: 30 dias (configurável)
- Formato: JSON stringificado

### 3. Venda Completa (PostgreSQL)

**Tabela:** `vendas_completas`

**Tipos de Registro:**
1. **`venda_item`** - Venda individual de um item
2. **`pacote`** - Registro do pacote completo (resumo)
3. **`item_pacote`** - Item dentro de um pacote

**Campos Principais:**
```sql
- id (bigint, PK)
- tipo_registro (varchar) -- 'venda_item', 'pacote', 'item_pacote'
- id_venda (bigint) -- ID da ordem no ML
- pack_id (varchar) -- ID do pacote (se aplicável)
- is_pacote (boolean)
- mlb_anuncio (varchar) -- ID do anúncio
- titulo_item (text)
- sku (varchar)
- quantidade (integer)
- preco_unitario (decimal)
- total_venda_geral (decimal)
- total_pago (decimal)
- taxa_mlb_item (decimal)
- comprador_id (bigint)
- nome_comprador (varchar)
- status_venda (varchar) -- Traduzido: "Pago", "Confirmado", etc.
- metodo_pagamento (varchar) -- Traduzido: "Cartão de Crédito", etc.
- parcelas (integer)
- detalhe_parcelas (varchar) -- "3x de R$ 100,00"
- id_envio (bigint)
- status_envio (varchar) -- Traduzido: "Enviado", "Entregue", etc.
- rastreio_codigo (varchar)
- transportadora (varchar)
- cep, endereco_completo, cidade, estado, pais
- data_venda, data_fechamento, data_entrega
- frete_vendedor, frete_comprador, frete_pago_por
- data_cancelamento, motivo_cancelamento, cancelado_por
- tem_reembolso, valor_reembolsado, data_reembolso
```

### 4. UserMarketplace (PostgreSQL)

**Tabela:** `user_marketplace`

```sql
- id (uuid, PK)
- nome (varchar)
- type (varchar) -- 'ml', 'sh', 'tk'
- status (boolean)
- accessToken (varchar) -- Token de acesso
- refreshToken (varchar) -- Token de renovação
- createdIn (timestamp)
```

### 5. AuthMercadoLivre (PostgreSQL)

**Tabela:** `auth_mercadolivre`

```sql
- userMarketplaceId (uuid, PK, FK -> user_marketplace.id)
- userId (varchar) -- User ID do Mercado Livre
- scope (text) -- Escopos autorizados
- createdAt (timestamp)
- updatedAt (timestamp)
```

---

## 🔧 Componentes e Responsabilidades

### Factory Pattern

**Arquivo:** `src/services/mercadolivre/MercadoLivreFactory.ts`

**Função:** Gerencia instâncias singleton de todos os serviços do Mercado Livre.

**Funções principais:**
- `getMercadoLivreApp()` - Retorna instância da entidade principal
- `getTokenService()` - Retorna TokenMlbService
- `getApiService()` - Retorna ApiMlbService
- `getAuthService()` - Retorna AuthMercadoLivreService
- `getQueueService()` - Retorna QueueService
- `getOrderProcessingService()` - Retorna OrderProcessingService
- `getNotificationRecoveryService()` - Retorna NotificationRecoveryService
- `getWebhookNotificationRepository()` - Retorna WebhookNotificationRepository

### TokenMlbService

**Arquivo:** `src/services/mercadolivre/mlb_api/TokenMlbService.ts`

**Responsabilidades:**
- Buscar access token do banco de dados
- Cache em memória do token
- Buscar userId do Mercado Livre
- Limpar cache quando necessário

**Métodos principais:**
- `getAccessToken()` - Busca token do banco (com cache)
- `getUserId()` - Busca userId do Mercado Livre
- `getTokenInfo()` - Retorna token e userId
- `clearCache()` - Limpa cache em memória

### ApiMlbService

**Arquivo:** `src/services/mercadolivre/mlb_api/ApiMlbService.ts`

**Responsabilidades:**
- Fazer requisições HTTP para a API do Mercado Livre
- Gerenciar retries automáticos
- Adicionar token de autenticação nas requisições

**Métodos principais:**
- `getOrder(orderId)` - Busca dados da ordem
- `getShipment(shipmentId)` - Busca dados do envio
- `getPayment(paymentId)` - Busca dados do pagamento
- `getPack(packId)` - Busca dados do pacote
- `getMediation(mediationId)` - Busca dados de mediação/reclamação
- `getMissedFeeds(appId, userId)` - Busca notificações perdidas

**Retry Logic:**
- Máximo de tentativas: `maxRetries` (padrão: 3)
- Delay entre tentativas: `retryDelayMs` (padrão: 2000ms)
- Retry em: status 429 (rate limit) ou 5xx (erro servidor)

### AuthMercadoLivreService

**Arquivo:** `src/services/mercadolivre/mlb_api/AuthMercadoLivreService.ts`

**Responsabilidades:**
- Gerar URL de autorização OAuth
- Trocar código de autorização por tokens
- Renovar access token usando refresh token

**Métodos principais:**
- `createAuthorizationURL(userMarketplaceId)` - Gera URL de autorização
- `exchangeCodeForToken(code, state)` - Troca código por tokens
- `refreshAccessToken(userMarketplaceId)` - Renova access token

### QueueService

**Arquivo:** `src/services/mercadolivre/QueueService.ts`

**Responsabilidades:**
- Gerenciar fila de processamento de pedidos/pacotes
- Processar tarefas de forma assíncrona
- Gerenciar retries em caso de erro
- Manter estatísticas da fila

**Configurações:**
- `QUEUE_CONCURRENT` - Máximo de tarefas simultâneas (padrão: 1)
- `QUEUE_RETRY_DELAY` - Delay entre retries (padrão: 5000ms)
- `API_MAX_RETRIES` - Máximo de tentativas (padrão: 3)

**Métodos principais:**
- `adicionar(tarefa)` - Adiciona tarefa à fila
- `processar()` - Processa próxima tarefa da fila
- `limpar()` - Limpa toda a fila
- `getEstatisticas()` - Retorna estatísticas

### OrderProcessingService

**Arquivo:** `src/services/mercadolivre/OrderProcessingService.ts`

**Responsabilidades:**
- Processar pedidos individuais
- Processar pacotes (múltiplos itens)
- Extrair e traduzir dados de vendas
- Salvar dados completos no banco

**Métodos principais:**
- `processOrder(orderId)` - Processa uma ordem individual
- `processPack(packId)` - Processa um pacote completo
- `verifyRealPack(packId)` - Verifica se é pacote real (2+ itens únicos)
- `processarVenda(dadosCompletos)` - Processa e salva venda
- `processarPacote(packId, payment, primaryOrder)` - Processa e salva pacote

**Traduções:**
- Status de venda: "paid" → "Pago", "confirmed" → "Confirmado", etc.
- Método de pagamento: "credit_card" → "Cartão de Crédito", etc.
- Status de envio: "shipped" → "Enviado", "delivered" → "Entregue", etc.

### NotificationRecoveryService

**Arquivo:** `src/services/mercadolivre/NotificationRecoveryService.ts`

**Responsabilidades:**
- Buscar notificações perdidas na API do Mercado Livre
- Reprocessar notificações que falharam
- Salvar notificações recuperadas no Redis

**Métodos principais:**
- `buscarNotificacoesPerdidas()` - Busca na API `/missed_feeds`
- `processarNotificacoesPerdidas()` - Processa notificações perdidas
- `buscarNotificacoesNaoProcessadas(limit)` - Busca no Redis
- `reprocessarNotificacoesNaoProcessadas()` - Reprocessa falhas

### WebhookNotificationRepository

**Arquivo:** `src/repositories/mercadolivre/WebhookNotificationRepository.ts`

**Responsabilidades:**
- Salvar notificações no Redis
- Buscar notificações por critérios
- Atualizar status de processamento
- Gerar estatísticas

**Métodos principais:**
- `create(notification)` - Salva no Redis
- `findByNotificationId(id)` - Busca por ID
- `findUnprocessed(limit)` - Busca não processadas
- `updateByNotificationId(id, data)` - Atualiza notificação
- `findAll(limit, offset, filters)` - Lista com filtros
- `getStatistics()` - Retorna estatísticas

### VendaCompletaRepository

**Arquivo:** `src/repositories/mercadolivre/VendaCompletaRepository.ts`

**Responsabilidades:**
- Salvar vendas completas no PostgreSQL
- Gerenciar inserções/atualizações na tabela `vendas_completas`

**Métodos principais:**
- `salvarVenda(dados)` - Salva ou atualiza venda no banco

---

## 🔄 Diagrama de Fluxo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO COMPLETO - MERCADO LIVRE                │
└─────────────────────────────────────────────────────────────────┘

1. AUTENTICAÇÃO
   Cliente → AuthController → AuthService → Mercado Livre API
   ↓
   Mercado Livre → Callback → AuthService → Salva tokens no DB
   ↓
   TokenService (cache atualizado)

2. WEBHOOK
   Mercado Livre → WebhookController → Redis (salva notificação)
   ↓
   QueueService (adiciona à fila)
   ↓
   QueueService.processar() (assíncrono)
   ↓
   OrderProcessingService.processOrder()
   ↓
   ApiMlbService (busca ordem, envio, pagamento)
   ↓
   OrderProcessingService.processarVenda()
   ↓
   VendaCompletaRepository (salva no PostgreSQL)
   ↓
   WebhookNotificationRepository (marca como processada)

3. RECUPERAÇÃO (a cada 30 min)
   NotificationRecoveryService
   ↓
   ApiMlbService.getMissedFeeds() → Busca notificações perdidas
   ↓
   Redis (salva notificações)
   ↓
   QueueService (adiciona à fila)
   ↓
   (mesmo fluxo do webhook)
```

---

## 📝 Variáveis de Ambiente Necessárias

```env
# Mercado Livre OAuth
CLIENT_KEY_ML=seu_client_id
CLIENT_SECRET_ML=seu_client_secret
REDIRECT_URL_ML=https://seu-dominio.com/api/marketplace/auth/mercadolivre/callback
WEBHOOK_URL_ML=https://seu-dominio.com/api/marketplace/webhook
NAME_APP_ML=Marketplace Boilerplate

# API Configuration
API_TIMEOUT=10000
API_MAX_RETRIES=3
API_RETRY_DELAY=2000
API_DELAY=200

# Queue Configuration
QUEUE_CONCURRENT=1
QUEUE_RETRY_DELAY=5000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
REDIS_URL=redis://localhost:6379
```

---

## 🚀 Endpoints da API

### Autenticação
- `GET /api/marketplace/auth/:userMarketplaceId` - Gera URL de autorização
- `GET /api/marketplace/auth/mercadolivre/callback?code=XXX&state=YYY` - Callback OAuth
- `POST /api/marketplace/auth/refresh-token` - Renova access token

### Webhooks
- `POST /api/marketplace/webhook` - Recebe webhooks do Mercado Livre
- `GET /api/marketplace/webhook/health` - Health check
- `GET /api/marketplace/webhook/status` - Status e estatísticas
- `POST /api/marketplace/webhook/processar-ordem/:orderId` - Processa ordem manualmente
- `POST /api/marketplace/webhook/processar-pacote/:packId` - Processa pacote manualmente
- `POST /api/marketplace/webhook/recuperar-notificacoes` - Recupera notificações perdidas
- `POST /api/marketplace/webhook/reprocessar-notificacoes` - Reprocessa falhas
- `GET /api/marketplace/webhook/historico-notificacoes` - Histórico de notificações
- `GET /api/marketplace/webhook/estatisticas-notificacoes` - Estatísticas
- `POST /api/marketplace/webhook/limpar-fila` - Limpa a fila de processamento

---

## 📌 Observações Importantes

1. **Cache de Token**: O `TokenMlbService` mantém um cache em memória do access token. Sempre chame `clearCache()` após atualizar tokens.

2. **Rate Limiting**: A API do Mercado Livre tem limites de requisições. O `ApiMlbService` implementa retry automático para status 429.

3. **Processamento Assíncrono**: Webhooks são processados de forma assíncrona. A resposta 200 OK é enviada imediatamente, sem esperar o processamento.

4. **Pacotes vs Vendas Individuais**: O sistema detecta automaticamente se uma ordem faz parte de um pacote real (2+ itens únicos) e processa adequadamente.

5. **Recuperação Automática**: O sistema busca notificações perdidas automaticamente a cada 30 minutos.

6. **Armazenamento**: Notificações são armazenadas no Redis (não no PostgreSQL) para melhor performance.

7. **Traduções**: Todos os status, métodos de pagamento e informações são traduzidos para português antes de salvar no banco.

---

## 🔍 Debugging

### Verificar Token
```bash
GET /api/marketplace/webhook/status
```

### Verificar Fila
```bash
GET /api/marketplace/webhook/health
# Retorna: queue.estatisticas
```

### Verificar Notificações
```bash
GET /api/marketplace/webhook/historico-notificacoes?limit=10&processed=false
```

### Processar Manualmente
```bash
POST /api/marketplace/webhook/processar-ordem/123456789
```

---

**Última atualização:** 2024
**Versão:** 1.0.0

