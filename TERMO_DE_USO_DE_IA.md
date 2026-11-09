# Termo de Uso de Inteligência Artificial
### **DECLARAÇÃO DE USO DE INTELIGÊNCIA ARTIFICIAL**

No formato do template de entrega da FECAP (`documentos/README.md` e `src/README.md`), conforme o Guia para o Uso Responsável de Inteligência Artificial na FECAP (versão 2.0). Cada integrante também entrega a **Ficha de Declaração de Uso de IA** individual, assinada, na pasta [`Entrega2/DeclaracaoIA`](Entrega2/DeclaracaoIA).

Grupo Os Ticketudo · TrocaTicket · Ciência da Computação (2º CCOMP) · FECAP

Em todos os usos abaixo, a IA atuou como apoio. As decisões de produto, as regras de negócio e a escolha do que entrava em cada entrega foram do grupo. Todo material gerado com apoio de IA foi lido, ajustado e revisado pelos integrantes antes de entrar no repositório.

> Campos entre colchetes ainda dependem da confirmação do integrante responsável.

## Documentos das disciplinas

### Entrega 2: Projeto Interdisciplinar, gestão do projeto (Kanban)

| **Aluno(s) Responsável(veis)** | Caio Moraes |
| :--- | :--- |
| **Ferramenta utilizada** | Claude (Claude Code) |
| **Versão/modelo** | Claude Opus 5.5 |
| **Disciplina / Trabalho** | Projeto Interdisciplinar, Entrega 2 |
| **Finalidade de uso** | Organização do Kanban do GitHub Project: redação das issues a partir das tarefas definidas pelo grupo (código, critérios de aceite, passos de teste), sugestão de ordem e prioridade das tarefas e textos de revisão dos pull requests. A divisão das tarefas e a aprovação dos PRs foram do grupo. |
| ***Prompts* principais utilizados** | "Me fala os próximos passos e quais tarefas faltam para a entrega 2"; "junta tudo isso em um corpo e título de issue para eu colocar no project e atribuir ao Montes"; "avalia o PR que o Montes subiu e me dá o corpo da mensagem explicando a decisão" |
| **Trechos ou entregas afetadas** | Issues e descrições de PR no GitHub, e o modelo de PR em `.github/pull_request_template.md` |

### Entrega 2: Projeto Interdisciplinar, documento de extensão e banner

| **Aluno(s) Responsável(veis)** | Caio Moraes |
| :--- | :--- |
| **Ferramenta utilizada** | Claude (Claude Code) |
| **Versão/modelo** | Claude Opus 5.5 |
| **Disciplina / Trabalho** | Projeto Interdisciplinar, Entrega 2 (banner) |
| **Finalidade de uso** | **Banner:** criação da faixa "Tecnologias utilizadas" (cartões com o logo e o papel de cada tecnologia), inserida no banner feito pelo grupo, e correção da resolução para impressão. |
| ***Prompts* principais utilizados** | "Dentro desse banner tem um espaço vazio lá embaixo, quero que esteja reservado para as tecnologias usadas no projeto, você consegue completar com a logo e o texto dessas tecnologias?"|
| **Trechos ou entregas afetadas** | `Entrega2/PI/banner-os-ticketudo.pdf` (faixa de tecnologias)|


### Entrega 2: Gestão Empresarial

| **Aluno(s) Responsável(veis)** | Caio Moraes |
| :--- | :--- |
| **Ferramenta utilizada** | Claude (Claude Code) |
| **Versão/modelo** | Claude Opus 5.5 |
| **Disciplina / Trabalho** | Gestão Empresarial, Entrega 2 (mapa de processos e documento individual, parte 2) |
| **Finalidade de uso** | Criação dos gráficos: o fluxograma em raias do mapa de processos e os diagramas de cada trecho nos documentos individuais. Apoio na redação do mapa de processos do grupo e do modelo do documento individual |
| ***Prompts* principais utilizados** | "Monta o mapa de processos do planejamento e cotação do evento com as etapas, os gargalos e o fluxograma em raias" |
| **Trechos ou entregas afetadas** | `Entrega2/GestãoEmpresarial/Fluxograma Mapa de Processos.png`, `Mapa de Processos Grupo Ticketudo.docx` |

### Entrega 2: Projetos em Banco de Dados

| **Aluno(s) Responsável(veis)** | Caio Moraes |
| :--- | :--- |
| **Ferramenta utilizada** | Claude (Claude Code) |
| **Versão/modelo** | Claude Opus 5.5 |
| **Disciplina / Trabalho** | Projetos em Banco de Dados, Entrega 2 |
| **Finalidade de uso** | Conversão do script do banco de PostgreSQL para MySQL e apoio na descrição de campos e tipos no README da pasta BD. A modelagem (DER) é do grupo, da Entrega 1. |
| ***Prompts* principais utilizados** | "Gera a versão MySQL do script do banco para a entrega de Banco de Dados"; "atualiza o README do banco com as tabelas novas" |
| **Trechos ou entregas afetadas** | `Entrega2/Proj.BancodeDados/trocaticket_mysql.sql`, `seed_mysql.sql` e `README.md` |

## Código do sistema (Desenvolvimento Web Full)

Por módulo do sistema, como pede o modelo `src/README.md` do template da FECAP.

O código entrou por pull request, com revisão de outro integrante, e passou por lint, build, teste automático da API (`npm test`) e teste manual no site publicado. Os commits com coautoria do Copilot estão listados na seção seguinte.


### Entrega 2: chat entre os perfis

| **Aluno(s) Responsável(veis)** | Caio Moraes |
| :--- | :--- |
| **Ferramenta utilizada** | Claude (Claude Code) |
| **Versão/modelo** | Claude Opus 5.5 |
| **Disciplina / Trabalho** | Desenvolvimento Web Full, Entrega 2 |
| **Finalidade de uso** | Reescrita do chat, que travava depois da primeira mensagem: regras de quem conversa com quem, mensagens não lidas, "visto" e o painel de mensagens no visual do site. |
| ***Prompts* principais utilizados** | "O chat é muito precário: você consegue mandar a primeira mensagem mas não consegue mandar mais, nem voltar e falar com outra pessoa. Melhora todo o sistema de chat usando o front-end atual" |
| **Trechos ou entregas afetadas** | `backend/routes/chat.js`, `backend/regras/chat.js`, `backend/repositorios/chat.js` e `ticketudo/src/components/panels/` (CHAT-01) |

### Entrega 2: visual e documentação técnica

| **Aluno(s) Responsável(veis)** | Caio Moraes |
| :--- | :--- |
| **Ferramenta utilizada** | Claude (Claude Code) |
| **Versão/modelo** | Claude Opus 5.5 |
| **Disciplina / Trabalho** | Desenvolvimento Web Full, Entrega 2 |
| **Finalidade de uso** | Apoio na paleta de cores e no modelo visual "Noite", na revisão de acessibilidade, na collection do Postman e na redação dos READMEs (principal, backend e roteiro de demonstração). |
| ***Prompts* principais utilizados** | "Não estou satisfeito com as cores do projeto, consegue estabelecer uma nova paleta?"; "confere o README atual e as pastas do projeto para ver se não tem algo morto ou antigo" |
| **Trechos ou entregas afetadas** | `ticketudo/src/styles/tokens.css` e CSS das telas (VIS-03 a VIS-05), `Entrega2/DesenvolvimentoWebFullstack/postman/`, `README.md` e `backend/README.md` |

### Entrega 2: commits com coautoria do Copilot

| **Aluno(s) Responsável(veis)** | Gabriel Ribeiro Alves |
| :--- | :--- |
| **Ferramenta utilizada** | GitHub Copilot |
| **Versão/modelo** | [preencher] |
| **Disciplina / Trabalho** | Desenvolvimento Web Full, Entrega 2 |
| **Finalidade de uso** | Apoio na atualização do README (tarefa ORG-09): organização e descrição da estrutura de pastas do projeto e sugestões de como melhorar o texto. O primeiro resultado não ficou bom e foi desfeito pelo próprio Gabriel (commit de *revert*). A versão final foi ajustada, revisada e registrada por ele, que decidiu o que entrava no arquivo. |
| ***Prompts* principais utilizados** | [confirmar com o Gabriel o texto usado, ex.: "Atualize a seção de estrutura de pastas do README com as pastas atuais do projeto e o que cada uma contém"] |
| **Trechos ou entregas afetadas** | Seção "Estrutura de pastas" do `README.md`. Commits `c80339e` (atualização), `186606f` (revert da primeira versão) e `c9083d3` (versão final), todos de 31/10/2026. Esses commits têm a linha `Co-authored-by: Copilot`, e é por isso que o GitHub mostra o Copilot na lista de contribuidores do repositório. |

## Como o grupo revisou o que a IA produziu

Todo conteúdo feito com apoio de IA foi lido e conferido pelo integrante responsável antes de entrar no projeto. O código entrou por pull request, com revisão de outro integrante, e passou por lint, build, teste automático da API (`npm test`) e teste manual no site publicado. Os documentos foram revisados e ajustados pelo grupo, e o que não ficou bom foi desfeito, como no *revert* do README.

## Cuidados adotados

O grupo não compartilhou senhas, chaves de acesso nem dados pessoais ou confidenciais com as ferramentas. As sugestões foram tratadas como apoio, nunca aceitas automaticamente: os integrantes buscaram entender, revisar e validar cada conteúdo antes de colocá-lo no projeto. As regras de negócio, os requisitos, a divisão das tarefas e as decisões de implementação ficaram com o grupo.

 descrito está em conformidade com o GUIA PARA O USO RESPONSÁVEL DE
INTELIGÊNCIA ARTIFICIAL NA FECAP e que o conteúdo final é de minha plena responsabilidade
autoral.***
