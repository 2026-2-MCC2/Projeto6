# Backend TrocaTicket

API em Node + Express 5 com PostgreSQL (Supabase ou banco local embutido),
autenticacao por JWT e senha guardada com bcrypt.

## Como rodar

Tudo sai da **raiz do repositorio**, com um comando so. Nao precisa de
`.env`, senha do banco nem Codespaces:

```
npm install
npm run dev
```

Abra `http://localhost:5173`. Esse comando sobe o backend (porta 3000) e o
site (porta 5173) juntos; os logs aparecem marcados com `[api]` e `[site]`.

O site chama a API em `/api/...` e o Vite repassa para o backend, entao nao
existe mais `CORS_ORIGIN` nem `VITE_API_URL` para configurar. No Codespaces
basta abrir a porta 5173.

### Banco de dados

Sem `DATABASE_URL`, o backend usa um **Postgres embutido**
([PGlite](https://pglite.dev)) que roda dentro do proprio Node e grava em
`backend/.banco-local/` (fora do Git). Na primeira vez ele cria as tabelas
e roda o seed sozinho. Cada pessoa tem o seu banco, entao ninguem apaga os
dados de ninguem, e funciona na rede da faculdade.

Para usar o banco compartilhado do Supabase, crie `backend/.env` com a
`DATABASE_URL` (modelo no `.env.example`). Lembrando que a rede da faculdade
bloqueia essa conexao.

### Recriar o banco do zero

Pare o `npm run dev` e, na raiz:

```
npm run db:reset
```

Roda `Entrega1/tabelas_bd/trocaticket.sql` e depois o `seed.sql` no banco
em uso (o local ou, se tiver `DATABASE_URL`, o Supabase; neste caso apaga
os dados de todo mundo). Para o banco local tambem da pra simplesmente
apagar a pasta `backend/.banco-local`.

### Teste de fumaca

Com o `npm run dev` no ar e o banco recem-recriado, `npm test` (na raiz)
percorre o fluxo inteiro (cadastro, credenciamento, evento, aprovacao,
compra e revenda). Ele cria usuarios e eventos de teste, entao depois rode
`npm run db:reset` de novo.

### Vercel

O repositorio ja esta pronto para a Vercel (`vercel.json` e `api/index.js`
na raiz): o site vira arquivos estaticos e o Express roda como funcao em
`/api`. Na Vercel cadastre `DATABASE_URL` (de preferencia o *Transaction
pooler* do Supabase, porta 6543) e `JWT_SECRET` em Settings > Environment
Variables. Detalhes no README da raiz.

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

Todas as rotas ficam em `/api` (ex.: `POST /api/auth/login`). Tudo que pede login espera o cabecalho `Authorization: Bearer <token>`.

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
