# Como demonstrar o TrocaTicket

Roteiro do cenário de ponta a ponta pedido no documento do PI (seção 10). O código do site e da API está em [`Entrega1/DesenvolvimentoWebFullstack`](../../Entrega1/DesenvolvimentoWebFullstack), e as regras de cada etapa estão em [`REGRAS_DO_PLANEJAMENTO.md`](../../Entrega1/DesenvolvimentoWebFullstack/REGRAS_DO_PLANEJAMENTO.md).

## Preparar

**No computador** (na raiz do repositório):

```
npm install
npm run db:reset
npm run db:demo
npm run dev
```

Abrir http://localhost:5173.

**No site publicado:** colar o arquivo [`Entrega1/tabelas_bd/seed_demo.sql`](../../Entrega1/tabelas_bd/seed_demo.sql) no SQL Editor do Supabase e clicar em Run. Pode rodar de novo antes de cada apresentação: ele apaga a demonstração anterior e cria outra.

## Contas de demonstração

| Perfil | E-mail | Senha |
|---|---|---|
| Organizador | organizador.demo@demo.trocaticket.com.br | demo1234 |
| Fornecedor (Som & Luz Demo) | som.demo@demo.trocaticket.com.br | demo1234 |
| Fornecedor (Palco Forte Demo) | palco.demo@demo.trocaticket.com.br | demo1234 |
| Administrador | admin@trocaticket.com.br | a do grupo (no computador: admin123) |

A senha `demo1234` vale só para essas contas de teste. A senha do administrador do site publicado fica só com o grupo.

O seed já deixa pronto o **Festival Demo TrocaTicket**: 3 itens de custo, outros custos e 5 propostas com valores diferentes, com a cotação encerrada.

## Roteiro (os 7 passos do documento)

1. **Cadastro e aprovação.**
   1. Criar uma conta nova de organizador em "Acessar plataforma".
   2. Clicar em "Adicionar evento": o pop-up de credenciamento abre. Preencher e enviar.
   3. Entrar como administrador › Credenciamentos › aba Organizadores › Credenciar.
2. **Evento e itens de custo.** Com o organizador, criar o evento (período, local, público mínimo e máximo, margem). Na tela do evento, cadastrar os itens de custo e os outros custos.
3. **Fornecedor vê e propõe.**
   1. Organizador: "Publicar para cotação".
   2. Entrar como `som.demo@...`: Eventos em cotação › Ver itens e propor › Enviar proposta.
4. **Organizador compara e escolhe.**
   1. Voltar no organizador e clicar em "Encerrar cotação".
   2. Em "Propostas recebidas", clicar em Selecionar na proposta escolhida.

   Para ir mais rápido, use o **Festival Demo TrocaTicket**, que já tem propostas para comparar.
5. **Custos consolidados.** O card "Orçamento consolidado" ao lado mostra as propostas escolhidas, os itens sem escolha pelo custo estimado e os outros custos.
6. **Ticket estimado.** O cálculo do ticket de equilíbrio e do ticket-alvo aparece na tela do evento (FLX-06).
7. **Visão do administrador.**
   1. Organizador: "Enviar para análise".
   2. Administrador: Eventos › Ver itens, propostas e custos › Aprovar.
   3. Depois, "Relatórios" e "Histórico de aprovações".

## Teste automático

Com o `npm run dev` no ar, em outro terminal:

```
npm test
```

O teste repete o cenário acima pela API (bloco "cenário 1" a "cenário 7"), além das regras de cada etapa, e precisa terminar com **0 falha(s)**.

## Evidências

Os prints do roteiro feito no site publicado ficam em [`evidencias/`](evidencias/), um por passo (`passo-1-credenciamento.png`, `passo-2-evento.png`…).
