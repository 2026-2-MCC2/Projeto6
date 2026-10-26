# Como contribuir

Guia do grupo **Os Ticketudo** para mexer no TrocaTicket sem quebrar o trabalho de ninguém.
Leia uma vez inteiro; depois use o [resumo](#resumo) como cola.

## Resumo

1. **Pegue uma issue** e se coloque como responsável.
2. **Atualize a `main`** e **crie uma branch** com o código da issue.
3. **Faça as mudanças** e **teste** com `npm run dev`.
4. **Faça commit** com o código da issue na mensagem.
5. **Envie a branch** e **abra um Pull Request (PR)**.
6. **Um colega revisa** e faz o merge.
7. **Todo mundo atualiza a `main`.**

> **Regra de ouro:** ninguém faz commit direto na `main`. Tudo passa por branch + PR.

---

## 1. Pegar uma issue

- Abra a aba **Issues** do repositório e escolha uma que ninguém pegou.
- Clique em **Assignees** (coluna da direita) e coloque o seu nome.
- Leia a issue inteira, principalmente **Plano de execução** e **Critérios de aceite**.
- Veja a seção **Dependências**: se ela depende de outra issue que ainda não foi feita, pegue outra.
- Ficou com dúvida? Comente na própria issue.

## 2. Criar a branch

**Nome da branch:** código da issue + o que ela faz, tudo minúsculo, sem acento, com hífen.

| Issue | Nome da branch |
|---|---|
| `[ORG-01] Remover dados de exemplo…` | `org-01-remover-dados-exemplo` |
| `[VIS-02] Usar a logo oficial…` | `vis-02-logo-oficial` |
| `[CON-01] Tirar as garantias…` | `con-01-garantias-reais` |

Uma issue = uma branch. Não misture duas issues na mesma branch.

**No GitHub Desktop:**

1. Em **Current branch**, escolha `main`.
2. Clique em **Fetch origin** e depois em **Pull origin** (se aparecer).
3. Menu **Branch › New branch…**, digite o nome e clique em **Create branch**.
4. Clique em **Publish branch**.

<details>
<summary>Pelo terminal</summary>

```
git checkout main
git pull
git checkout -b org-01-remover-dados-exemplo
git push -u origin org-01-remover-dados-exemplo
```

</details>

> Esqueceu de criar a branch e já mexeu nos arquivos? Sem problema, desde que **ainda não tenha
> feito commit**: crie a branch agora e, quando o GitHub Desktop perguntar, escolha
> **Bring my changes to …** (levar as mudanças junto).

## 3. Fazer as mudanças e testar

Na raiz do repositório:

```
npm install
npm run dev
```

Abra `http://localhost:5173` e teste o que você mudou. Login do administrador:
`admin@trocaticket.com.br` / `admin123`.

Antes de fazer commit, rode também:

```
npm run lint
npm run build
```

Os dois precisam terminar **sem erro**. Se você mexeu no **backend**, rode também o teste de
fluxo: pare o `npm run dev`, rode `npm run db:reset`, suba o `npm run dev` de novo e, em outro
terminal, `npm test`. Tem que terminar com **0 falha(s)**.

> No PowerShell, se o `npm` der erro de "execução de scripts foi desabilitada", use `npm.cmd`
> no lugar (`npm.cmd run dev`) ou rode uma vez
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## 4. Fazer commit

**Mensagem:** `CÓDIGO-DA-ISSUE: o que você fez`, curta e em português.

```
ORG-01: remove dados de exemplo sem uso
VIS-02: troca a logo pela oficial
CON-01: reescreve as garantias da página inicial
```

Sem issue (ex.: ajuste no README)? Use `docs:` ou `ajuste:` no lugar do código.

**No GitHub Desktop:** confira a lista de arquivos à esquerda, escreva a mensagem no campo
**Summary** e clique em **Commit to org-01-…** (confira que **não** está escrito `main`).

**Antes de cada commit, olhe a lista de arquivos.** Se aparecer algum destes, **desmarque e
avise o grupo**:

- `.env` (tem senha)
- `node_modules/`
- `.banco-local/`
- `dist/`

Prefira vários commits pequenos (um por parte da tarefa) a um commit gigante no final.

## 5. Abrir o Pull Request

1. No GitHub Desktop, clique em **Push origin**.
2. Clique em **Create Pull Request**. O navegador abre no GitHub.
3. Confira: **base: `main`** ← **compare: a sua branch**.
4. **Título:** o mesmo da issue, ex.: `[ORG-01] Remover dados de exemplo sem uso de data/platform.js`.
5. **Descrição:** o modelo já vem preenchido. Complete cada parte e, no fim, deixe
   `Closes #20` (com o **número** da issue). Isso fecha a issue sozinho quando o PR entrar.
6. Mudou algo visual? Arraste **prints de antes e depois** para a descrição.
7. Em **Reviewers**, escolha um colega.
8. Clique em **Create pull request**.

Ainda não terminou mas quer mostrar? Use a setinha ao lado do botão e escolha
**Create draft pull request**.

## 6. Revisar o PR de um colega

1. Leia a issue e veja se o PR faz o que ela pede (os **Critérios de aceite**).
2. Teste na sua máquina: no GitHub Desktop, **Current branch** › aba **Pull requests** ›
   escolha o PR. Depois `npm run dev`.
3. Na aba **Files changed** do PR, comente nas linhas que tiver dúvida.
4. Tudo certo? **Review changes › Approve**. Tem algo a corrigir? **Request changes**,
   explicando o quê.
5. Aprovado: clique em **Merge pull request › Confirm merge** e depois em **Delete branch**.

Quem recebeu pedido de correção arruma **na mesma branch** e dá **Push origin** de novo. O PR
atualiza sozinho.

## 7. Depois do merge

- Todo mundo: **Current branch › `main`** e **Pull origin**, antes de começar a próxima issue.
- O site online (Vercel) é atualizado pelo Caio pelo fork (**Sync fork**). Avise no grupo quando
  um PR entrar.

---

## Conflito

Acontece quando duas pessoas mexem nas mesmas linhas. Para resolver:

1. No GitHub Desktop, com a sua branch aberta: **Branch › Update from main** (em algumas versões aparece
   como **Update from default branch**).
2. Se houver conflito, ele mostra os arquivos. Clique em **Open in Visual Studio Code**.
3. No VS Code, em cada trecho marcado, escolha **Accept Current**, **Accept Incoming** ou
   **Accept Both**, conforme o que deve ficar.
4. Salve, volte ao GitHub Desktop e clique em **Continue merge** (ou **Commit merge**). Depois **Push origin**.

Não sabe qual lado manter? **Chame quem fez a outra mudança** antes de escolher.

## Problemas comuns

| Problema | Solução |
|---|---|
| `npm.ps1 não pode ser carregado` | Use `npm.cmd` ou rode `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| `git não é reconhecido` | Use o GitHub Desktop (ele tem o Git dele) |
| "Não consegui falar com o servidor" no site | Rode o `npm run dev` na **raiz** do repositório, não dentro de `ticketudo` |
| O banco local ficou estranho | Pare o `npm run dev` e rode `npm run db:reset` |
| Fiz commit na `main` sem querer (ainda sem push) | No GitHub Desktop, **History** › botão direito no commit › **Undo commit**. Crie a branch e faça o commit nela |
| Fiz push na `main` sem querer | Avise o grupo **antes** de qualquer outra coisa. Não tente apagar |

## O que nunca fazer

- Commit ou push direto na `main`.
- Commitar `.env`, senha do banco ou dados de pessoas reais.
- `git push --force`.
- Fazer merge do próprio PR sem ninguém revisar.
- Rodar `npm run db:reset` com a `DATABASE_URL` do Supabase no `.env` (apaga o banco de todo
  mundo).