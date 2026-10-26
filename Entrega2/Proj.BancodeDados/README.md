# Banco de Dados — TrocaTicket

Banco relacional em **PostgreSQL** (Supabase no site publicado e um Postgres local no `npm run dev`).

- Criação das tabelas: [`Entrega1/tabelas_bd/trocaticket.sql`](../../Entrega1/tabelas_bd/trocaticket.sql)
- Dados iniciais (administrador e categorias): [`Entrega1/tabelas_bd/seed.sql`](../../Entrega1/tabelas_bd/seed.sql)
- Diagrama entidade-relacionamento da primeira entrega: [`Entrega1/Proj.BancodeDados/DER_TT.pdf`](../../Entrega1/Proj.BancodeDados/DER_TT.pdf)

## Tabelas

O banco tem 17 tabelas. Todas têm chave primária (PK), e as ligações entre elas são feitas por chaves estrangeiras (FK).

| Tabela | Para que serve | PK | FKs |
|---|---|---|---|
| `usuario` | Todas as contas (comprador, organizador, fornecedor e administrador) | `id_usuario` | — |
| `fornecedor` | Dados da empresa de um usuário fornecedor | `id_fornecedor` | `id_usuario` → `usuario` |
| `credenciamento` | Pedidos de credenciamento do fornecedor, analisados pelo administrador | `id_credenciamento` | `id_fornecedor` → `fornecedor`; `id_adm` → `usuario` |
| `servico` | Serviços que cada fornecedor oferece, com preço | `id_servico` | `id_fornecedor` → `fornecedor` |
| `categoria` | Categorias de evento (show, teatro, festival…) | `id_categoria` | — |
| `local_evento` | Locais onde os eventos acontecem | `id_local` | — |
| `evento` | Eventos criados pelos organizadores | `id_evento` | `id_organizador` → `usuario`; `id_local` → `local_evento`; `id_categoria` → `categoria`; `id_adm_revisor` → `usuario` |
| `lote` | Lotes de ingresso de um evento (setor, preço, quantidade, janela de venda e margem de revenda) | `id_lote` | `id_evento` → `evento` |
| `fornecedor_externo` | Fornecedores que o organizador contratou por fora da plataforma | `id_fornecedor_externo` | `id_evento` → `evento` |
| `solicitacao_servico` | Pedido de um serviço de fornecedor para um evento | `id_solicitacao` | `id_evento` → `evento`; `id_servico` → `servico` |
| `ingresso` | Cada ingresso gerado a partir de um lote, com código único e dono atual | `id_ingresso` | `id_evento` → `evento`; `id_lote` → `lote`; `id_vendedor` → `usuario` |
| `pedido` | Compras feitas por um usuário | `id_pedido` | `id_comprador` → `usuario` |
| `item_pedido` | Ingressos de cada pedido | `id_pedido` + `id_ingresso` (composta) | `id_pedido` → `pedido`; `id_ingresso` → `ingresso` |
| `pagamento` | Pagamento de um pedido | `id_pagamento` | `id_pedido` → `pedido` |
| `chat` | Conversas | `id_chat` | `id_solicitacao` → `solicitacao_servico` |
| `chat_participante` | Quem participa de cada conversa | `id_chat` + `id_usuario` (composta) | `id_chat` → `chat`; `id_usuario` → `usuario` |
| `mensagem` | Mensagens de uma conversa | `id_mensagem` | `id_chat` → `chat`; `id_remetente` → `usuario` |

## Exemplo: `evento` e `lote`

**`evento`** guarda o evento. A PK é `id_evento`. Ele aponta para quem organizou (`id_organizador`), onde acontece (`id_local`) e a categoria (`id_categoria`). O campo `status` só aceita `rascunho`, `em_analise`, `aprovado` ou `recusado`.

**`lote`** guarda os lotes de ingresso. A PK é `id_lote` e a FK `id_evento` liga cada lote ao seu evento. Se o evento for apagado, os lotes vão junto (`ON DELETE CASCADE`). Regras:

- não pode repetir o mesmo `setor` + `nome` no mesmo evento (`UNIQUE`);
- preço não pode ser negativo e quantidade tem que ser maior que zero (`CHECK`);
- a venda tem que terminar depois de começar (`data_fim > data_inicio`).

## Diagrama

```mermaid
erDiagram
    usuario ||--o| fornecedor : "tem perfil de"
    fornecedor ||--o{ credenciamento : "pede"
    usuario ||--o{ credenciamento : "analisa"
    fornecedor ||--o{ servico : "oferece"
    usuario ||--o{ evento : "organiza"
    local_evento ||--o{ evento : "recebe"
    categoria ||--o{ evento : "classifica"
    evento ||--o{ lote : "tem"
    evento ||--o{ fornecedor_externo : "contrata"
    evento ||--o{ solicitacao_servico : "pede"
    servico ||--o{ solicitacao_servico : "é pedido em"
    lote ||--o{ ingresso : "gera"
    evento ||--o{ ingresso : "tem"
    usuario ||--o{ ingresso : "é dono de"
    usuario ||--o{ pedido : "faz"
    pedido ||--|{ item_pedido : "contém"
    ingresso ||--o{ item_pedido : "entra em"
    pedido ||--o{ pagamento : "é pago por"
    solicitacao_servico |o--o{ chat : "abre"
    chat ||--|{ chat_participante : "tem"
    usuario ||--o{ chat_participante : "participa"
    chat ||--o{ mensagem : "tem"
    usuario ||--o{ mensagem : "envia"
```

## Como criar o banco

- **No computador:** na raiz do repositório, `npm run dev` cria o banco local sozinho na primeira vez. Para recriar do zero: `npm run db:reset`.
- **No Supabase:** colar o `trocaticket.sql` e depois o `seed.sql` no **SQL Editor** e clicar em **Run**.
