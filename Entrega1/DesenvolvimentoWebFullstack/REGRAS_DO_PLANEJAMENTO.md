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
| Em cotação | — | — | edita | pode |
| Cotação encerrada | — | — | edita | pode |
| Recusado | edita | edita | edita | pode |
| Em análise | — | — | — | — |
| Aprovado | — | — | — | — |

Caminho do evento: **rascunho → em cotação → cotação encerrada → em análise → aprovado** (ou recusado, que volta a poder ser editado). A cotação é opcional: um evento em rascunho pode ir direto para análise.

## Itens de custo (FLX-02)

- Cada item tem categoria (iluminação, comida, bebida, segurança, estrutura ou outros), descrição, quantidade e **custo estimado**.
- O custo estimado é o **valor total** que o organizador espera pagar pelo item, não o valor por unidade.
- Para enviar o evento ao administrador, ele precisa ter pelo menos um item de custo.

## Cotação (FLX-03)

- O organizador **publica o evento para cotação** quando ele tem pelo menos um item de custo e o credenciamento do organizador está aprovado.
- Durante a cotação, os **itens não mudam**, porque os fornecedores estão cotando em cima deles. Os outros custos continuam editáveis.
- Só **fornecedores credenciados** veem os eventos em cotação. Eles veem os itens, mas **não** o custo estimado do organizador.
- O organizador **encerra** a cotação quando quiser comparar. Dá para reabrir. Com a cotação aberta, o evento não vai para análise.

## Propostas (FLX-04)

- Cada fornecedor manda **uma proposta por item**, com valor total, o que está incluso, validade e observações.
- A **validade** não pode ser anterior ao dia em que a proposta é enviada ou editada.
- O fornecedor **edita ou cancela** a própria proposta enquanto ela está "enviada" e a cotação está aberta. Depois que a cotação encerra, nada muda.
- Proposta cancelada pode ser **enviada de novo** para o mesmo item enquanto a cotação estiver aberta.
- **Situações:** enviada, selecionada, não selecionada e cancelada.
- O **pedido direto de serviço** (organizador escolhe um serviço da vitrine e abre o chat) continua como extra. O fluxo principal de cotação é por proposta.

## Outros custos (FLX-02)

- Custos que não vêm de fornecedor: **fiscal** (impostos e taxas), **operacional** (equipe, produção), **variável** e **outro**.
- **Custo variável:** é lançado como **valor total estimado** para o evento, e não por participante. Assim o custo total consolidado é um número só, e o cálculo do ticket (FLX-06) usa a fórmula do documento sem ajuste.
