# Marketplace Boilerplate

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

