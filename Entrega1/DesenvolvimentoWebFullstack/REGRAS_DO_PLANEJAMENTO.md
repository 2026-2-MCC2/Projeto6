# Regras do planejamento de eventos

Decisões do grupo sobre como o planejamento funciona. Cada regra vale no backend (a API recusa o que não segue) e na tela.

## Evento (FLX-02 e WEB-05)

- O evento tem **período** (começa e termina), **público mínimo**, **público máximo**, **público esperado** (opcional) e **margem de lucro**.
- Regras: público mínimo maior que zero; máximo maior ou igual ao mínimo; o esperado fica entre os dois; margem de 0 a 99,99%; o evento termina depois de começar e começa no futuro.
- A **margem de lucro** é sobre a receita (20 = 20%), como na fórmula do ticket.
- **Editar** os dados do evento: só enquanto ele está em rascunho ou depois de recusado pelo administrador.
- **Excluir** o evento: só enquanto ele não foi para o administrador (não pode em análise nem aprovado). Os itens de custo e os outros custos saem junto.

| Situação do evento | Dados | Itens de custo | Outros custos | Excluir |
|---|---|---|---|---|
| Rascunho | edita | edita | edita | pode |
| Recusado | edita | edita | edita | pode |
| Em análise | — | — | — | — |
| Aprovado | — | — | — | — |

## Itens de custo (FLX-02)

- Cada item tem categoria (iluminação, comida, bebida, segurança, estrutura ou outros), descrição, quantidade e **custo estimado**.
- O custo estimado é o **valor total** que o organizador espera pagar pelo item, não o valor por unidade.
- Para enviar o evento ao administrador, ele precisa ter pelo menos um item de custo.

## Outros custos (FLX-02)

- Custos que não vêm de fornecedor: **fiscal** (impostos e taxas), **operacional** (equipe, produção), **variável** e **outro**.
- **Custo variável:** é lançado como **valor total estimado** para o evento, e não por participante. Assim o custo total consolidado é um número só, e o cálculo do ticket (FLX-06) usa a fórmula do documento sem ajuste.
