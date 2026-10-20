# Backend TrocaTicket

API em Node + Express 5 com PostgreSQL no [Supabase](https://supabase.com),
autenticacao por JWT e senha guardada com bcrypt.

## Como rodar

O banco fica no [Supabase](https://supabase.com) e ja esta criado. Cada
pessoa do grupo so precisa configurar o proprio ambiente.

> A rede da faculdade bloqueia as portas do banco (5432 e 6543). Por isso
> rodamos pelo **GitHub Codespaces**, que fica na nuvem e nao tem esse
> bloqueio. Em casa da pra rodar no computador normalmente.

### 1. Backend

```
cd Entrega1/DesenvolvimentoWebFullstack/backend
cp .env.example .env
```

No `.env`, preencha a `DATABASE_URL` com a senha do banco (pedir no grupo,
**nunca** commitar). A senha vai sem colchetes. Depois:

```
npm install
npm run dev
```

Tem que aparecer `Servidor rodando na porta 3000`.

### 2. Site

Em outro terminal:

```
cd Entrega1/DesenvolvimentoWebFullstack/ticketudo
npm install
npm run dev
```

### 3. So no Codespaces: ligar o site ao backend

No Codespaces pelo navegador, o site nao enxerga o backend em `localhost`.
Na aba **Portas**:

1. Porta **3000**: botao direito > **Visibilidade da porta** > **Publica**.
2. Portas **3000** e **5173**: botao direito > **Alterar protocolo da
   porta** > **HTTP** (em HTTPS da `ERR_HTTP2_PROTOCOL_ERROR`).
3. Crie `ticketudo/.env` com o endereco da porta 3000, **sem barra no fim**:
   `VITE_API_URL=https://SEU-CODESPACE-3000.app.github.dev`
4. No `.env` do backend, ponha o endereco da porta 5173, **sem barra no fim**:
   `CORS_ORIGIN=https://SEU-CODESPACE-5173.app.github.dev`
5. Reinicie os dois (`Ctrl+C` e `npm run dev`).

Cada Codespace tem enderecos proprios: se criar outro, refaca este passo.

### Recriar o banco do zero

```
npm run db:reset
```

Roda `Entrega1/tabelas_bd/trocaticket.sql` e depois o `seed.sql`.
**Apaga todos os dados de todo mundo**, entao so use combinando com o
grupo. Se a rede bloquear o banco, da pra colar os dois arquivos no **SQL
Editor** do painel do Supabase e clicar em Run.

### Teste de fumaca

Com o servidor no ar e o banco recem-recriado, `npm test` percorre o fluxo
inteiro (cadastro, credenciamento, evento, aprovacao, compra e revenda).
Ele cria usuarios e eventos de teste, entao depois rode `npm run db:reset`
de novo.

### Problemas comuns

| erro | causa |
|---|---|
| `password authentication failed` | senha errada ou com colchetes `[ ]` na URL |
| `tenant/user ... not found` | endereco do servidor errado; o projeto e `aws-0-us-east-1` |
| `ETIMEDOUT` | a rede bloqueia o banco; use o Codespaces |
| "Nao consegui falar com o servidor" | porta 3000 privada, ou `CORS_ORIGIN`/`VITE_API_URL` com barra no fim |
| `ERR_HTTP2_PROTOCOL_ERROR` | protocolo da porta em HTTPS; troque para HTTP |

O seed ja cria o administrador:
`admin@trocaticket.com.br` / `admin123`. A rota de cadastro **nao** aceita
`tipo: adm`, entao administrador so entra pelo seed ou direto no banco.

## Perfis

| tipo | o que faz |
|---|---|
| `comprador` | compra ingresso e revende dentro do teto |
| `organizador` | cria evento, lotes e contrata fornecedor |
| `fornecedor` | cadastra servicos e pede credenciamento |
| `adm` | aprova evento e credenciamento |

## Rotas

Tudo que pede login espera o cabecalho `Authorization: Bearer <token>`.

### Autenticacao
| metodo | rota | quem |
|---|---|---|
| POST | `/auth/cadastro` | aberto |
| POST | `/auth/login` | aberto |
| GET | `/auth/eu` | logado |

### Catalogo
| metodo | rota | quem |
|---|---|---|
| GET | `/categorias` `/locais` | aberto |
| POST | `/categorias` | adm |
| POST | `/locais` | organizador, adm |

### Fornecedor
| metodo | rota | quem |
|---|---|---|
| GET | `/fornecedores` | aberto (so credenciados) |
| GET | `/fornecedores/:id/servicos` | aberto |
| POST | `/fornecedores/perfil` | fornecedor |
| GET | `/fornecedores/perfil` | fornecedor |
| POST | `/fornecedores/servicos` | fornecedor |
| GET | `/fornecedores/meus-servicos` | fornecedor |
| POST | `/fornecedores/credenciamento` | fornecedor |
| GET | `/solicitacoes` | fornecedor |
| POST | `/solicitacoes/:id/aceitar` `/recusar` | fornecedor |

### Evento
| metodo | rota | quem |
|---|---|---|
| GET | `/eventos` | aberto (so aprovados) |
| GET | `/eventos/:id` | aberto |
| GET | `/eventos/meus` | organizador |
| POST | `/eventos` | organizador |
| POST | `/eventos/:id/lotes` | organizador |
| POST | `/eventos/:id/fornecedores-externos` | organizador |
| POST | `/eventos/:id/solicitacoes` | organizador |
| POST | `/eventos/:id/enviar-analise` | organizador |

### Ingresso e pedido
| metodo | rota | quem |
|---|---|---|
| GET | `/ingressos/meus` | logado |
| GET | `/ingressos/revenda/:idEvento` | aberto |
| POST | `/ingressos/:id/anunciar` | dono do ingresso |
| DELETE | `/ingressos/:id/anuncio` | dono do ingresso |
| POST | `/pedidos` | logado (compra do lote) |
| POST | `/pedidos/revenda` | logado |
| GET | `/pedidos/meus` | logado |

### Chat
| metodo | rota | quem |
|---|---|---|
| GET | `/chats` | participante |
| GET | `/chats/:id/mensagens` | participante |
| POST | `/chats/:id/mensagens` | participante |

### Administracao
| metodo | rota | quem |
|---|---|---|
| GET | `/admin/eventos?status=em_analise` | adm |
| POST | `/admin/eventos/:id/aprovar` `/recusar` | adm |
| GET | `/admin/credenciamentos?status=em_analise` | adm |
| POST | `/admin/credenciamentos/:id/aprovar` `/recusar` | adm |

## Como funciona o lote

O lote cruza os dois eixos de venda numa linha so:

| coluna | o que e | exemplo |
|---|---|---|
| `setor` | onde a pessoa fica | Pista, Camarote, Cadeira inferior |
| `nome` | a fase da venda | 1o lote, 2o lote, ultima chamada |

Entao um evento com pista e camarote em duas fases tem quatro lotes:

```
Pista    / 1o lote   R$ 100   500 un   01/02 a 28/02
Pista    / 2o lote   R$ 150   500 un   01/03 a 13/03
Camarote / 1o lote   R$ 300   100 un   01/02 a 28/02
Camarote / 2o lote   R$ 400   100 un   01/03 a 13/03
```

Cada linha tem o seu preco, a sua quantidade, a sua janela de venda e a sua
margem de revenda. O par `setor + nome` nao pode repetir dentro do mesmo
evento, e a venda nao pode terminar depois da data do show.

Corpo de `POST /eventos/:id/lotes`:

```json
{
  "setor": "Pista",
  "nome": "1o lote",
  "preco": 100,
  "quantidade": 500,
  "margem_revenda": 20,
  "data_inicio": "2027-02-01 00:00:00",
  "data_fim": "2027-02-28 23:59:59"
}
```

`GET /eventos/:id` devolve cada lote com `aberto` (se esta dentro da janela
agora) e `disponiveis` (quantos ingressos sobraram).

## Regras que o backend garante

- Evento so fica publico depois que um adm aprova, e precisa ter pelo menos
  um lote para ir para analise.
- A aprovacao gera um ingresso por unidade de cada lote, com codigo unico e
  o setor do lote.
- Compra so passa se o lote estiver dentro da janela: antes volta 409 com
  `abre_em`, depois volta 409 com `fechou_em`.
- Fornecedor so aparece na vitrine depois de credenciado, e so pede
  credenciamento se tiver pelo menos um servico cadastrado.
- Revenda tem teto: `preco do lote x (1 + margem_revenda / 100)`. Anuncio
  acima disso volta 422 com o teto no corpo da resposta.
- Maximo de 6 ingressos por pedido.
- Compra usa `select ... for update` dentro de transacao, entao duas pessoas
  nao levam o mesmo ingresso.
- Ninguem le um chat em que nao e participante.
