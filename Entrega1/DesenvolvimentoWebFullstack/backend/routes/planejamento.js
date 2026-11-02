// Planejamento do evento (FLX-02): itens de custo e outros custos.
// Tudo aqui e so do organizador dono do evento.
//   GET    /api/eventos/:id/planejamento
//   POST   /api/eventos/:id/itens          PUT/DELETE /api/eventos/:id/itens/:idItem
//   POST   /api/eventos/:id/custos         PUT/DELETE /api/eventos/:id/custos/:idCusto
//   GET    /api/eventos/:id/propostas      propostas de cada item (FLX-05)
//   GET    /api/eventos/:id/orcamento      orcamento consolidado (FLX-05)
//   GET    /api/eventos/:id/ticket         ticket por cenario de publico (FLX-06)
const express = require('express');
const planejamento = require('../repositorios/planejamento');
const { autenticar, permitir } = require('../middleware/auth');
const { eventoDoOrganizador, podeMexer } = require('../lib/eventos');
const { orcamentoDoEvento } = require('../lib/orcamento');
const { calcularTicket } = require('../regras/ticket');
const { validarItem, validarCusto, totaisDoPlanejamento, cenariosDePublico } = require('../regras/planejamento');

const router = express.Router();
const soDono = [autenticar, permitir('organizador')];

// tudo o que a tela do evento precisa, numa chamada so
router.get('/:id/planejamento', soDono, async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento) return;

  const [local, itens, custos, orcamento] = await Promise.all([
    planejamento.localECategoria(evento.id_local, evento.id_categoria),
    planejamento.itensComTotalDePropostas(evento.id_evento),
    planejamento.custos(evento.id_evento),
    orcamentoDoEvento(evento.id_evento),
  ]);

  res.json({ ...evento, local, itens, custos, orcamento, totais: totaisDoPlanejamento(itens, custos) });
});

// --- comparar propostas e orcamento (FLX-05) -------------------------------

// por item, as propostas validas, da menor para a maior
router.get('/:id/propostas', soDono, async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento) return;

  const [itens, propostas] = await Promise.all([
    planejamento.itensResumidos(evento.id_evento),
    planejamento.propostasParaComparar(evento.id_evento),
  ]);

  res.json({
    id_evento: evento.id_evento,
    status: evento.status,
    // selecionar e desmarcar so com a cotacao encerrada
    pode_selecionar: evento.status === 'cotacao_encerrada',
    itens: itens.map((i) => ({ ...i, propostas: propostas.filter((p) => p.id_item === i.id_item) })),
  });
});

router.get('/:id/orcamento', soDono, async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento) return;
  res.json({ id_evento: evento.id_evento, ...(await orcamentoDoEvento(evento.id_evento)) });
});

router.get('/:id/ticket', soDono, async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento) return;

  const orcamento = await orcamentoDoEvento(evento.id_evento);
  const custoTotal = Number(orcamento.totais.custo_total);
  const margem = Number(evento.margem_lucro) / 100;

  try {
    res.json({
      id_evento: evento.id_evento,
      custo_total: custoTotal,
      margem: Number(evento.margem_lucro),
      cenarios: cenariosDePublico(evento).map((cenario) => ({
        ...cenario,
        custo_total: custoTotal,
        ...calcularTicket({ custoTotal: orcamento.totais.custo_total, publico: cenario.publico, margem }),
      })),
    });
  } catch (erro) {
    return res.status(422).json({ erro: erro.message });
  }
});

// --- itens de custo --------------------------------------------------------

// o item tem que ser deste evento. Responde 404 sozinho.
async function itemDoEvento(req, res, evento) {
  const item = await planejamento.itemDoEvento(req.params.idItem, evento.id_evento);
  if (!item) res.status(404).json({ erro: 'registro nao encontrado neste evento' });
  return item;
}

router.post('/:id/itens', soDono, async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento || !podeMexer(evento, 'itens', res)) return;
  const { erro, dados } = validarItem(req.body);
  if (erro) return res.status(400).json({ erro });

  const id = await planejamento.criarItem(evento.id_evento, dados);
  res.status(201).json({ id_item: id, id_evento: evento.id_evento, ...dados });
});

router.put('/:id/itens/:idItem', soDono, async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento || !podeMexer(evento, 'itens', res)) return;
  const item = await itemDoEvento(req, res, evento);
  if (!item) return;
  const { erro, dados } = validarItem(req.body);
  if (erro) return res.status(400).json({ erro });

  await planejamento.atualizarItem(item.id_item, dados);
  res.json({ id_item: item.id_item, id_evento: evento.id_evento, ...dados });
});

router.delete('/:id/itens/:idItem', soDono, async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento || !podeMexer(evento, 'itens', res)) return;
  const item = await itemDoEvento(req, res, evento);
  if (!item) return;
  await planejamento.excluirItem(item.id_item);
  res.json({ id_item: item.id_item, excluido: true });
});

// --- outros custos (fiscais, operacionais, variaveis) ----------------------

// o custo tem que ser deste evento. Responde 404 sozinho.
async function custoDoEvento(req, res, evento) {
  const custo = await planejamento.custoDoEvento(req.params.idCusto, evento.id_evento);
  if (!custo) res.status(404).json({ erro: 'registro nao encontrado neste evento' });
  return custo;
}

router.post('/:id/custos', soDono, async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento || !podeMexer(evento, 'custos', res)) return;
  const { erro, dados } = validarCusto(req.body);
  if (erro) return res.status(400).json({ erro });

  const id = await planejamento.criarCusto(evento.id_evento, dados);
  res.status(201).json({ id_custo: id, id_evento: evento.id_evento, ...dados });
});

router.put('/:id/custos/:idCusto', soDono, async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento || !podeMexer(evento, 'custos', res)) return;
  const custo = await custoDoEvento(req, res, evento);
  if (!custo) return;
  const { erro, dados } = validarCusto(req.body);
  if (erro) return res.status(400).json({ erro });

  await planejamento.atualizarCusto(custo.id_custo, dados);
  res.json({ id_custo: custo.id_custo, id_evento: evento.id_evento, ...dados });
});

router.delete('/:id/custos/:idCusto', soDono, async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento || !podeMexer(evento, 'custos', res)) return;
  const custo = await custoDoEvento(req, res, evento);
  if (!custo) return;
  await planejamento.excluirCusto(custo.id_custo);
  res.json({ id_custo: custo.id_custo, excluido: true });
});

module.exports = router;
