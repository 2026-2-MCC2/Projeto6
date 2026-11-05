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

O seed ja cria o administrador do banco local:
`admin@trocaticket.com.br` / `admin123` (so vale no banco local; no site
publicado a senha foi trocada). A rota de cadastro **nao** aceita `tipo: adm`, entao administrador so entra pelo seed ou direto no banco.

## Como o codigo esta organizado

Cada camada tem uma responsabilidade so (ORG-10):

| pasta | o que fica la | exemplo |
|---|---|---|
| `routes/` | recebe o pedido, chama as regras e o repositorio e devolve a resposta. Nao tem SQL. | `routes/eventos.js` |
| `regras/` | validacoes e calculos, sem banco nem HTTP. Da pra testar sozinho. | `regras/ticket.js`, `regras/orcamento.js` |
| `repositorios/` | todo o SQL, uma funcao por consulta. Quem precisa de transacao passa a `conexao`. | `repositorios/propostas.js` |
| `lib/` | ajudantes das rotas: buscam e ja respondem o erro (404, 403, 409) e juntam repositorio com regra. | `lib/eventos.js` |
| `middleware/` | login (`autenticar`) e perfil (`permitir`). | `middleware/auth.js` |
| `config/` | conexao com o banco (Supabase ou banco local). | `config/bd.js` |

Transacao (varios comandos que entram juntos ou nenhum entra):

```js
const { emTransacao } = require('../repositorios/transacao');

await emTransacao(async (conexao) => {
  await propostas.selecionar(proposta, conexao);
});
```

Se der erro dentro da funcao, tudo e desfeito (rollback).

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
| GET | `/eventos/:id/ticket` | organizador dono |

`GET /eventos/:id/ticket` calcula o ticket estimado para os cenários de
público mínimo, máximo e esperado (quando informado). A rota é exclusiva do
organizador dono do evento e usa o custo total consolidado da FLX-05:

- ticket de equilíbrio = `custo total / público`;
- ticket-alvo = `custo total / [público x (1 - margem)]`.

A margem do banco é percentual (20 significa 20%), convertida para fração
antes da conta. O custo variável atualmente é o valor total lançado em
`custo_evento`, portanto é igual em todos os cenários. Os dois resultados são
arredondados para cima ao centavo para que o preço não fique abaixo do custo.
Público precisa ser maior que zero, custo não pode ser negativo e a margem
precisa estar entre 0% (inclusive) e 100% (exclusive).

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
| GET | `/chats` | logado (minhas conversas, com `nao_lidas` e a ultima mensagem) |
| GET | `/chats/nao-lidas` | logado (total de nao lidas, o numero do menu) |
| GET | `/chats/contatos?busca=` | logado (com quem pode comecar conversa) |
| POST | `/chats` | logado (abre ou reaproveita a conversa direta) |
| GET | `/chats/:id?depois=` | participante (cabecalho + mensagens; so as novas com `depois`) |
| GET | `/chats/:id/mensagens` | participante |
| POST | `/chats/:id/mensagens` | participante |
| POST | `/chats/:id/lida` | participante (marca como lida ate a mensagem `ate`) |

### Administracao
| metodo | rota | quem |
|---|---|---|
| GET | `/admin/eventos?status=em_analise` | adm |
| POST | `/admin/eventos/:id/aprovar` `/recusar` | adm |
| GET | `/admin/credenciamentos?status=em_analise` | adm |
| POST | `/admin/credenciamentos/:id/aprovar` `/recusar` | adm |

### Matriz completa de endpoints (WEB-06)

Os códigos abaixo são os retornos previstos para entrada válida e para as
validações de cada rota. Erros inesperados retornam `500`.

| método | rota | perfil | sucesso | erros de negócio |
|---|---|---|---|---|
| GET | `/health` | público | 200 | 500 |
| POST | `/auth/cadastro` | público | 201 | 400, 409 |
| POST | `/auth/login` | público | 200 | 400, 401 |
| GET | `/auth/eu` | logado | 200 | 401, 404 |
| GET | `/categorias`, `/locais` | público | 200 | 500 |
| POST | `/categorias` | adm | 201 | 400, 401, 403 |
| POST | `/locais` | organizador, adm | 201 | 400, 401, 403 |
| GET | `/fornecedores`, `/fornecedores/:id/servicos` | público | 200 | 500 |
| GET | `/fornecedores/perfil` | fornecedor | 200 | 401, 403, 404 |
| POST | `/fornecedores/servicos` | fornecedor credenciado/em análise | 201 | 400, 401, 403, 404 |
| GET | `/fornecedores/meus-servicos` | fornecedor | 200 | 401, 403 |
| GET | `/credenciamento/meu` | organizador, fornecedor | 200 | 401, 403 |
| POST | `/credenciamento` | organizador, fornecedor | 201 | 400, 401, 403, 409 |
| GET | `/eventos`, `/eventos/:id` | público | 200 | 404 |
| GET | `/eventos/meus` | organizador | 200 | 401, 403 |
| POST | `/eventos` | organizador credenciado/em análise | 201 | 400, 401, 403 |
| PUT/DELETE | `/eventos/:id` | organizador dono | 200 | 400, 401, 403, 404, 409 |
| POST | `/eventos/:id/lotes` | organizador dono | 201 | 400, 401, 403, 404, 409 |
| POST | `/eventos/:id/fornecedores-externos` | organizador dono | 201 | 400, 401, 403, 404 |
| POST | `/eventos/:id/solicitacoes` | organizador dono | 201 | 400, 401, 403, 404, 409 |
| POST | `/eventos/:id/enviar-analise`, `/abrir-cotacao`, `/encerrar-cotacao` | organizador dono | 200 | 400, 401, 403, 404, 409 |
| GET | `/eventos/:id/planejamento`, `/propostas`, `/orcamento`, `/ticket` | organizador dono | 200 | 401, 403, 404, 422 |
| POST/PUT/DELETE | `/eventos/:id/itens[/:idItem]` | organizador dono | 200/201 | 400, 401, 403, 404, 409 |
| POST/PUT/DELETE | `/eventos/:id/custos[/:idCusto]` | organizador dono | 200/201 | 400, 401, 403, 404, 409 |
| GET | `/cotacoes`, `/cotacoes/:idEvento` | fornecedor credenciado | 200 | 401, 403, 404 |
| POST/PUT | `/itens/:id/propostas`, `/propostas/:id` | fornecedor credenciado, dono | 200/201 | 400, 401, 403, 404, 409 |
| POST/GET | `/propostas/:id/cancelar`, `/propostas/minhas` | fornecedor credenciado | 200 | 401, 403, 404, 409 |
| POST | `/propostas/:id/selecionar`, `/desmarcar` | organizador dono | 200 | 401, 403, 404, 409 |
| GET/POST | `/solicitacoes`, `/solicitacoes/:id/aceitar`, `/recusar` | fornecedor | 200 | 401, 403, 404, 409 |
| GET/POST/DELETE | `/ingressos/meus`, `/ingressos/:id/anunciar`, `/ingressos/:id/anuncio` | logado/dono | 200 | 400, 401, 403, 404, 409, 422 |
| GET | `/ingressos/revenda/:idEvento` | público | 200 | 500 |
| POST/GET | `/pedidos`, `/pedidos/revenda`, `/pedidos/meus` | logado | 200/201 | 400, 401, 404, 409 |
| GET/POST | `/chats`, `/chats/contatos`, `/chats/:id`, `/chats/:id/mensagens`, `/chats/:id/lida` | logado/participante | 200/201 | 400, 401, 403, 404 |
| GET | `/admin/eventos`, `/admin/eventos/:id` | adm | 200 | 401, 403, 404 |
| POST | `/admin/eventos/:id/aprovar`, `/recusar` | adm | 200 | 400, 401, 403, 404, 409 |
| GET | `/admin/credenciamentos`, `/relatorios`, `/aprovacoes` | adm | 200 | 400, 401, 403 |
| POST | `/admin/credenciamentos/:id/aprovar`, `/recusar` | adm | 200 | 400, 401, 403, 404, 409 |

`400` = corpo inválido; `401` = token ausente, inválido ou expirado;
`403` = perfil sem permissão ou usuário sem acesso ao recurso; `404` =
recurso inexistente; `409` = conflito de estado ou duplicidade; `422` =
regra de negócio com dados bem formados, mas inviáveis.

A coleção exportada e o ambiente ficam em
`Entrega2/DesenvolvimentoWebFullstack/postman/`. Para rodar:

1. Na raiz do repositório: `npm run db:reset`, `npm run db:demo` e `npm run dev`.
2. Importe os dois arquivos no Postman, escolha o ambiente "TrocaTicket - Local" e
   preencha `admSenha` (no banco local, a senha do administrador do seed). As contas de
   organizador e fornecedor já vêm com as contas de demonstração (`demo1234`).
3. Rode a coleção inteira, na ordem das pastas (Collection Runner), ou pelo terminal:
   `npx newman run TrocaTicket.postman_collection.json -e TrocaTicket.postman_environment.json --env-var admSenha=SUA_SENHA`.

A pasta "1. Autenticação" faz o login dos três perfis e guarda `organizadorToken`,
`fornecedorToken` e `admToken`; cada pasta usa o token do seu perfil. As pastas
seguintes repetem o fluxo do PI: evento e custos, cotação, proposta, escolha,
envio para análise e aprovação. Cada execução cria um evento novo.

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
- Conversa direta: o administrador fala com qualquer pessoa; qualquer pessoa
  fala com o administrador (suporte); organizador e fornecedor conversam
  entre si quando os dois estao credenciados. A mesma dupla tem uma conversa
  direta so (abrir de novo reaproveita). Mensagem de 1 a 2000 caracteres.
- Nao lidas: cada participante guarda a ultima mensagem que viu
  (`chat_participante.ultima_lida`). E o que gera o numero no menu e o
  "Visto" na conversa.
