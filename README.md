
# FECAP - Fundação de Comércio Álvares Penteado

<p align="center">
<a href= "https://www.fecap.br/"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhZPrRa89Kma0ZZogxm0pi-tCn_TLKeHGVxywp-LXAFGR3B1DPouAJYHgKZGV0XTEf4AE&usqp=CAU" alt="FECAP - Fundação de Comércio Álvares Penteado" border="0"></a>
</p>

## TrocaTicket

## Nome do Grupo: Os Ticketudo

## Integrantes: <a href="https://www.linkedin.com/in/gabriel-ribeiro-alves-dev/">Gabriel Ribeiro Alves</a>, <a href="https://www.linkedin.com/in/caio-moraesdev/"> Caio Moraes</a>, <a href="https://www.linkedin.com/in/guilherme-montes/">Guilherme Montes</a>, <a href="https://www.linkedin.com/in/otavio-sanches-pierini-0b6993306?trk=contact-info"> Otavio Sanches Pierini</a>

## Professores Orientadores: <a href = "https://www.linkedin.com/in/dolemes/"> David de Oliveira Lemes </a>, <a href = "https://www.linkedin.com/in/francisco-escobar/"> Francisco de Souza Escobar </a>, <a href ="https://www.linkedin.com/in/katia-bossi/"> Kátia Bossi </a>, <a href ="https://www.linkedin.com/in/cristina-machado-corr%C3%AAa-leite-630309160/"> Cristina Machado Corrêa Leite </a>, <a href ="https://www.linkedin.com/in/j%C3%A9sus-gomes-83b769108/"> Jésus Gomes </a> 

## Descrição

<p align="center">
<video src="https://github.com/user-attachments/assets/82fa11c0-fb66-4d0a-b22c-8db80dfd8851" autoplay muted loop playsinline width="600"></video>
</p>

O **TrocaTicket** é uma plataforma web que conecta organizadores de eventos a fornecedores de serviços, simplificando tudo desde o primeiro briefing até o dia do evento.
<br><br>
Cada usuário acessa um workspace de acordo com o seu perfil: **organizadores** criam e acompanham seus eventos, recebem e avaliam propostas de fornecedores; **fornecedores** descobrem oportunidades, enviam propostas e conversam diretamente com os organizadores pelo chat integrado; e **administradores** supervisionam a plataforma, aprovando novos perfis, acompanhando a receita e mediando denúncias.
<br><br>
Com notificações, mensagens diretas e um painel de aprovações centralizado, o TrocaTicket reduz a fricção de encontrar o parceiro certo para cada evento.
<br><br>

## 🌐 Site publicado

**Acesse:** [projeto6-pearl.vercel.app](https://projeto6-pearl.vercel.app)

O site e a API ficam no mesmo endereço (a API responde em `/api`). Para percorrer o cenário completo (cadastro e aprovação, evento e itens de custo, propostas, orçamento e ticket), siga o roteiro de [Como demonstrar](Entrega2/DesenvolvimentoWebFullstack/README.md).


## 🚀 Como rodar

Precisa de Node 20.19+ (recomendado o 22, do `.nvmrc`). Na raiz do repositorio:

```
npm install
npm run dev
```

Abra `http://localhost:5173`. Um comando sobe o site e a API juntos, sem
`.env` e sem senha: o banco de desenvolvimento e um Postgres embutido que se
cria sozinho com o seed. O login do administrador do banco local aparece no
terminal na primeira vez que o `npm run dev` cria o banco.

| comando | o que faz |
|---|---|
| `npm run dev` | sobe a API (3000) e o site (5173) |
| `npm run build` | gera o site em `ticketudo/dist` |
| `npm run lint` | ESLint do site |
| `npm test` | teste de fumaca da API (com o `dev` no ar) |
| `npm run db:reset` | recria o banco do zero (com o `dev` parado) |

Mais detalhes (banco compartilhado no Supabase, rotas da API) no
[README do backend](Entrega1/DesenvolvimentoWebFullstack/backend/README.md).

Vai mexer no código? Leia antes o [guia de contribuição](CONTRIBUTING.md): como criar branch,
fazer commit e abrir Pull Request.

### Publicar na Vercel

1. Em [vercel.com/new](https://vercel.com/new), importe este repositorio. Deixe
   o *Root Directory* na raiz; o `vercel.json` ja define build e saida.
2. Em **Settings > Environment Variables**, cadastre:
   - `DATABASE_URL`: no Supabase, **Connect > Transaction pooler** (porta 6543), com a senha do banco.
   - `JWT_SECRET`: uma frase longa e aleatoria.
3. Faca o deploy. Cada push na `main` publica de novo, e cada PR ganha um link de preview.

O site e a API ficam no mesmo endereco (`/` e `/api`), entao nao ha CORS
nem URL de API para configurar.

## 🛠 Estrutura de pastas

```text
.
├── .github/                          # template de pull request
├── api/                              # entrada da API na Vercel
├── Entrega1/                         # primeira entrega do projeto
│   ├── Cálculo/                      # documento de Séries de Taylor
│   ├── DesenvolvimentoWebFullstack/  # código do sistema web
│   │   ├── backend/                  # API Express e regras do servidor
│   │   │   ├── config/               # configuração do banco
│   │   │   ├── lib/                  # ajudantes das rotas (respostas de erro e orçamento)
│   │   │   ├── middleware/           # middlewares da API
│   │   │   ├── regras/               # regras de negócio: validações e cálculos, sem SQL
│   │   │   ├── repositorios/         # todo o SQL, uma função por consulta
│   │   │   ├── routes/               # rotas HTTP: recebem o pedido e respondem
│   │   │   ├── scripts/              # scripts de banco e demonstração
│   │   │   └── testes/               # testes de fluxo da API e do cálculo do ticket
│   │   └── ticketudo/                # site React com Vite
│   │       ├── public/               # arquivos públicos do site
│   │       └── src/                  # código-fonte do frontend
│   │           ├── api/              # clientes das chamadas à API
│   │           ├── assets/           # imagens e outros recursos
│   │           ├── components/       # componentes reutilizáveis
│   │           │   └── panels/       # painéis de interface
│   │           ├── data/             # textos fixos das telas; dados reais vêm da API
│   │           ├── hooks/            # hooks de acesso e estado assíncrono
│   │           ├── layout/           # sidebar, topbar e workspace
│   │           ├── pages/            # telas por perfil
│   │           │   ├── admin/        # telas administrativas
│   │           │   ├── organizer/    # telas do organizador
│   │           │   └── supplier/     # telas do fornecedor
│   │           ├── state/            # contexto e estado global
│   │           ├── styles/           # estilos CSS
│   │           └── utils/            # funções auxiliares
│   ├── GestãoEmpresarial/            # documentos de Gestão Empresarial
│   ├── PI/                           # materiais do projeto integrador
│   ├── Proj.BancodeDados/            # diagrama entidade-relacionamento
│   └── tabelas_bd/                   # scripts SQL de tabelas e seeds
├── Entrega2/                         # segunda entrega do projeto
│   ├── Cálculo/                      # materiais de Cálculo II
│   ├── DesenvolvimentoWebFullstack/  # roteiro e evidências de demonstração
│   │   └── evidencias/               # evidências da demonstração
│   ├── GestãoEmpresarial/            # mapa de processos e documentos
│   ├── PI/                           # documento de extensão e banner
│   └── Proj.BancodeDados/            # scripts e documentação MySQL
├── .gitignore                        # arquivos ignorados pelo Git
├── .nvmrc                            # versão do Node usada no projeto
├── CONTRIBUTING.md                   # padrão de branches, commits e PRs
├── package.json                      # comandos e workspaces do projeto
├── README.md                         # guia geral do projeto
├── TERMO_DE_USO_DE_IA.md             # onde e como a IA foi usada no projeto
└── vercel.json                       # configuração de publicação
```

A pasta raiz contém o arquivo <b>README.md</b> (guia e explicação geral do projeto, o mesmo que você está lendo agora) e as pastas <b>Entrega1</b> e <b>Entrega2</b>, que reúnem as entregas do projeto organizadas por disciplina:

<b>Entrega1/Cálculo</b>: Entrega da disciplina de Cálculo (documento sobre Séries de Taylor aplicado ao projeto).

<b>Entrega1/DesenvolvimentoWebFullstack</b>: Código-fonte do sistema web. O frontend fica em `ticketudo`, uma aplicação React criada com Vite, e a API fica em `backend`. Dentro de `ticketudo/src`, `api` concentra as chamadas ao backend, `hooks` os hooks reutilizáveis, `state` o estado global, `components` as peças de interface, `layout` a estrutura do workspace, `pages` as telas por perfil, `data` os dados auxiliares das telas, `styles` o CSS e `utils` as funções auxiliares.

<b>Entrega1/tabelas_bd</b>: Scripts SQL do banco, incluindo a criação das tabelas e os seeds usados pelo backend.

<b>Entrega1/GestãoEmpresarial</b>: Entregas da disciplina de Gestão Empresarial, incluindo o documento do grupo e as análises individuais de cada integrante.

<b>Entrega1/PI</b>: Entregas da Materia de PI, com o design do Figma

<b>Entrega1/Proj.BancodeDados</b>: Entrega da disciplina de Banco de Dados, com o diagrama entidade-relacionamento (DER) do projeto.

<b>Entrega2/Cálculo</b>: Entrega da disciplina de Cálculo II (máximos, mínimos e concavidade da função de engajamento com notificações, com quadros de sinais e gráficos).

<b>Entrega2/DesenvolvimentoWebFullstack</b>: Roteiro para demonstrar o cenário de ponta a ponta do PI (cadastro e aprovação, evento e itens de custo, cotação e propostas, orçamento consolidado e visão do administrador), com as contas de demonstração e as evidências. Veja [Como demonstrar](Entrega2/DesenvolvimentoWebFullstack/README.md).

<b>Entrega2/GestãoEmpresarial</b>: Mapa de Processos do planejamento e cotação de um evento: justificativa, fluxograma em raias, etapas, gargalos e melhorias. Veja o [documento](Entrega2/GestãoEmpresarial/Mapa%20de%20Processos%20Grupo%20Ticketudo.docx) e o [fluxograma](Entrega2/GestãoEmpresarial/Fluxograma%20Mapa%20de%20Processos.png).

<b>Entrega2/Proj.BancodeDados</b>: Entrega da disciplina de Banco de Dados: script do banco em MySQL, com as tabelas, chaves primárias e estrangeiras e o diagrama. Veja o [README do banco](Entrega2/Proj.BancodeDados/README.md).

<b>Entrega2/PI</b>: Entrega do Projeto Interdisciplinar: documento do Projeto de Extensão (modelo do Moodle) e banner da apresentação.


<b>TERMO_DE_USO_DE_IA.md</b>: Registro de onde e como ferramentas de inteligência artificial foram usadas no projeto. Veja o [termo](TERMO_DE_USO_DE_IA.md).

## 🎨 Paleta de cores

Todas as cores do site ficam num arquivo só: [`tokens.css`](Entrega1/DesenvolvimentoWebFullstack/ticketudo/src/styles/tokens.css). Nenhum outro arquivo de CSS escreve cor direto; eles usam os nomes abaixo. Para mudar uma cor, mude a linha dela no `tokens.css`.

| Nome | Cor | Para que serve |
|---|---|---|
| `--tt-preto` | `#0c0c0c` | Fundo do site |
| `--tt-branco` | `#ffffff` | Texto principal e botão de ação |
| `--tt-palido` | `#d7e2ea` | Destaque e texto secundário (com opacidade) |
| `--tt-azul` | `#23aafb` | Cor da logo (aproximada, a confirmar) |
| `--tt-roxo` | `#6a4cff` | Cor da logo (aproximada, a confirmar) |
| `--tt-rosa` | `#ed0092` | Cor da logo (aproximada, a confirmar) |
| `--tt-laranja` | `#ff8e1e` | Cor da logo (aproximada, a confirmar) |
| `--tt-azul-profundo` | `#1e5cb3` | Brilhos do fundo e borda de destaque |
| `--tt-azul-claro` | `#5b9bf0` | Destaques do pop-up de credenciamento |
| `--tt-cinza-08` a `--tt-cinza-f2` | `#080808` a `#f2f2f2` | Superfícies, campos e textos de apoio (o número é o valor de cada canal) |
| `--tt-branco-1` a `--tt-branco-20` | branco com 1% a 20% de opacidade | Bordas e superfícies translúcidas |
| `--tt-sombra-35` a `--tt-sombra-100` | preto com 35% a 100% de opacidade | Sombras |
| `--tt-verde` | `#10b981` | Status positivo (aprovado, credenciado) |
| `--tt-ambar` | `#f5b84b` | Status em análise |
| `--tt-vermelho` | `#f87171` | Status negativo e erros |

As telas e componentes não usam a paleta direto: usam os **tokens de uso** do mesmo arquivo, que dizem para que a cor serve (`--bg`, `--surface`, `--text`, `--border`, `--acao`, `--positive`, `--negative`…).

## 🎓 Referências

Aqui estão as referências usadas no projeto.

1. <https://github.com/iuricode/readme-template>
2. <https://github.com/gabrieldejesus/readme-model>
5. <https://www.toptal.com/developers/gitignore>
