import base64

sequence_diagram = """
sequenceDiagram
    participant Cliente
    participant Rota
    participant Middleware
    participant Controller
    participant Servico
    participant Repositorio
    participant BancoDeDados

    Cliente->>Rota: Requisição HTTP
    Rota->>Middleware: Validar Token/Auth
    Middleware-->>Rota: Next()
    Rota->>Controller: Despachar Requisição
    Controller->>Servico: Chamar Lógica de Negócio
    Servico->>Repositorio: Solicitar Operação de Dados
    Repositorio->>BancoDeDados: Executar Query (Drizzle)
    BancoDeDados-->>Repositorio: Retornar Dados
    Repositorio-->>Servico: Retornar Entidade
    Servico->>Controller: Retornar Resultado
    Controller-->>Cliente: Resposta HTTP
"""

er_diagram = """
erDiagram
    user_marketplace ||--|| auth_mercadolivre : "possui autenticação para"
    user_marketplace ||--|| auth_shopee : "possui autenticação para"
    user_marketplace ||--|| auth_tiktokshop : "possui autenticação para"

    user_marketplace {
        uuid id PK
        varchar nome
        varchar type
        boolean status
        varchar access_token
        varchar refresh_token
        timestamp created_in
    }

    auth_mercadolivre {
        uuid user_marketplace_id PK, FK
        varchar user_id
        text scope
        timestamp created_at
        timestamp updated_at
    }

    auth_shopee {
        uuid user_marketplace_id PK, FK
        varchar shop_id
        varchar main_account_id
        text merchant_id_list
        text shp_id_list
        timestamp created_at
        timestamp updated_at
    }

    auth_tiktokshop {
        uuid user_marketplace_id PK, FK
        varchar user_id
        text scope
        timestamp created_at
        timestamp updated_at
    }

    webhook_logs {
        uuid id PK
        jsonb request
        timestamp created_at
    }
"""

def generate_link(graph):
    graphbytes = graph.encode("utf8")
    base64_bytes = base64.b64encode(graphbytes)
    base64_string = base64_bytes.decode("ascii")
    return "https://mermaid.ink/img/" + base64_string

with open("diagram_urls.txt", "w") as f:
    f.write("Sequence URL:\n")
    f.write(generate_link(sequence_diagram))
    f.write("\n\nER URL:\n")
    f.write(generate_link(er_diagram))
