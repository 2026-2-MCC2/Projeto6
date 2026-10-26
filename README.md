
# FECAP - Fundação de Comércio Álvares Penteado

<p align="center">
<a href= "https://www.fecap.br/"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhZPrRa89Kma0ZZogxm0pi-tCn_TLKeHGVxywp-LXAFGR3B1DPouAJYHgKZGV0XTEf4AE&usqp=CAU" alt="FECAP - Fundação de Comércio Álvares Penteado" border="0"></a>
</p>

# Nome do Projeto

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


## 🚀 Como rodar

Precisa de Node 20.19+ (recomendado o 22, do `.nvmrc`). Na raiz do repositorio:

```
npm install
npm run dev
```

Abra `http://localhost:5173`. Um comando sobe o site e a API juntos, sem
`.env` e sem senha: o banco de desenvolvimento e um Postgres embutido que se
cria sozinho com o seed. Login do administrador: `admin@trocaticket.com.br` /
`admin123`.

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

|-->Entrega1<br>
&emsp;|-->Cálculo<br>
&emsp;&emsp;|Taylor_TrocaTicket_Grupo_Ticketudo.docx<br>
&emsp;|-->DesenvolvimentoWebFullstack<br>
&emsp;&emsp;|-->ticketudo <i>(app React + Vite)</i><br>
&emsp;&emsp;&emsp;|-->public<br>
&emsp;&emsp;&emsp;|-->src<br>
&emsp;&emsp;&emsp;&emsp;|-->assets<br>
&emsp;&emsp;&emsp;&emsp;|-->components <i>(peças reutilizáveis de interface)</i><br>
&emsp;&emsp;&emsp;&emsp;&emsp;|-->panels<br>
&emsp;&emsp;&emsp;&emsp;|-->data <i>(dados de exemplo)</i><br>
&emsp;&emsp;&emsp;&emsp;|-->layout <i>(barra lateral, barra superior e workspace)</i><br>
&emsp;&emsp;&emsp;&emsp;|-->pages <i>(telas por perfil)</i><br>
&emsp;&emsp;&emsp;&emsp;&emsp;|-->admin<br>
&emsp;&emsp;&emsp;&emsp;&emsp;|-->organizer<br>
&emsp;&emsp;&emsp;&emsp;&emsp;|-->supplier<br>
&emsp;&emsp;&emsp;&emsp;|-->styles <i>(CSS organizado por camada)</i><br>
&emsp;&emsp;&emsp;&emsp;|-->utils<br>
&emsp;&emsp;&emsp;&emsp;|App.jsx<br>
&emsp;&emsp;&emsp;&emsp;|main.jsx<br>
&emsp;&emsp;&emsp;|index.html<br>
&emsp;&emsp;&emsp;|package.json<br>
&emsp;&emsp;&emsp;|vite.config.js<br>
&emsp;|-->GestãoEmpresarial<br>
&emsp;&emsp;|Entrega Gestão Empresarial Grupo Ticketudo.docx<br>
&emsp;&emsp;|TrocaTicket_Individual_Caio_Moraes.docx<br>
&emsp;&emsp;|TrocaTicket_Individual_GM.docx<br>
&emsp;&emsp;|TrocaTicket_Individual_Gabriel_Visao.docx<br>
&emsp;&emsp;|TrocaTicket_Individual_Otavio_Sanches.docx<br>
&emsp;|-->PI<br>
&emsp;&emsp;|README.md<br>
&emsp;|-->Proj.BancodeDados<br>
&emsp;&emsp;|DER_TT.pdf<br>
|-->Entrega2<br>
&emsp;|-->Cálculo<br>
&emsp;&emsp;|MaximosMinimos_TrocaTicket_Grupo_Ticketudo.pdf<br>
&emsp;|-->Proj.BancodeDados<br>
&emsp;&emsp;|README.md<br>
|-->api <i>(entrada da API na Vercel)</i><br>
|.gitignore<br>
|package.json <i>(comandos do projeto todo)</i><br>
|README.md<br>
|vercel.json<br>

A pasta raiz contém o arquivo <b>README.md</b> (guia e explicação geral do projeto, o mesmo que você está lendo agora) e as pastas <b>Entrega1</b> e <b>Entrega2</b>, que reúnem as entregas do projeto organizadas por disciplina:

<b>Entrega1/Cálculo</b>: Entrega da disciplina de Cálculo (documento sobre Séries de Taylor aplicado ao projeto).

<b>Entrega1/DesenvolvimentoWebFullstack</b>: Código-fonte do front-end em `ticketudo`, uma aplicação React criada com Vite. Dentro de `src` o código é separado em camadas: `components` (peças reutilizáveis de interface), `layout` (barra lateral, barra superior e a estrutura do workspace), `pages` (telas divididas por perfil — admin, organizer e supplier), `data` (dados de exemplo), `styles` (CSS por camada) e `utils` (funções auxiliares).

<b>Entrega1/GestãoEmpresarial</b>: Entregas da disciplina de Gestão Empresarial, incluindo o documento do grupo e as análises individuais de cada integrante.

<b>Entrega1/PI</b>: Entregas da Materia de PI, com o design do Figma

<b>Entrega1/Proj.BancodeDados</b>: Entrega da disciplina de Banco de Dados, com o diagrama entidade-relacionamento (DER) do projeto.

<b>Entrega2/Cálculo</b>: Entrega da disciplina de Cálculo II (máximos, mínimos e concavidade da função de engajamento com notificações, com quadros de sinais e gráficos).

<b>Entrega2/Proj.BancodeDados</b>: Entrega da disciplina de Banco de Dados, com as tabelas, chaves primárias e estrangeiras e o diagrama do banco. Veja o [README do banco](Entrega2/Proj.BancodeDados/README.md).

## 🎓 Referências

Aqui estão as referências usadas no projeto.

1. <https://github.com/iuricode/readme-template>
2. <https://github.com/gabrieldejesus/readme-model>
5. <https://www.toptal.com/developers/gitignore>
