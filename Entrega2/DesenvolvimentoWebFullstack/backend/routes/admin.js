const express = require('express');
const admin = require('../repositorios/admin');
const eventos = require('../repositorios/eventos');
const planejamento = require('../repositorios/planejamento');
const { liberarSolicitacoesRetidas } = require('../repositorios/credenciamento');
const { emTransacao } = require('../repositorios/transacao');
const { ingressosDoLote } = require('../regras/ingressos');
const { dinheiro } = require('../regras/orcamento');
const { orcamentoDoEvento } = require('../lib/orcamento');
const { autenticar, permitir } = require('../middleware/auth');

const router = express.Router();

router.use(autenticar, permitir('adm'));

// --- eventos ---------------------------------------------------------------

// lista de eventos com custo consolidado e andamento da cotacao (FLX-07).
// ?status=em_analise (padrao), em_cotacao, aprovado... ou ?status=todos
router.get('/eventos', async (req, res) => {
  const status = req.query.status || 'em_analise';
  res.json(await admin.eventosComResumo(status === 'todos' ? null : status));
});

// um evento por inteiro, para o adm decidir: itens, outros custos, orcamento
// consolidado e o andamento da cotacao
router.get('/eventos/:id', async (req, res) => {
  const evento = await admin.eventoCompleto(req.params.id);
  if (!evento) return res.status(404).json({ erro: 'evento nao encontrado' });

  const [custos, propostas, lotes, externos, orcamento] = await Promise.all([
    planejamento.custos(evento.id_evento),
    admin.resumoDePropostasPorItem(evento.id_evento),
    admin.lotes(evento.id_evento),
    eventos.fornecedoresExternos(evento.id_evento),
    orcamentoDoEvento(evento.id_evento),
  ]);

  const porItem = Object.fromEntries(propostas.map((p) => [p.id_item, p]));
  orcamento.itens = orcamento.itens.map((i) => ({
    ...i,
    propostas_recebidas: Number(porItem[i.id_item]?.recebidas || 0),
    menor_proposta: porItem[i.id_item]?.menor_valor ?? null,
  }));

  res.json({ ...evento, custos, orcamento, lotes, fornecedores_externos: externos });
});

router.post('/eventos/:id/aprovar', async (req, res) => {
  const evento = await eventos.buscar(req.params.id);

  if (!evento) return res.status(404).json({ erro: 'evento nao encontrado' });
  if (evento.status !== 'em_analise') {
    return res.status(409).json({ erro: `so da pra aprovar evento em analise (esse esta "${evento.status}")` });
  }

  // aprova e gera um ingresso por unidade de cada lote, tudo junto
  const ingressos = await emTransacao(async (conexao) => {
    await admin.aprovarEvento(evento.id_evento, req.usuario.id, conexao);
    const linhas = (await admin.lotes(evento.id_evento, conexao)).flatMap((lote) => ingressosDoLote(evento, lote));
    await admin.inserirIngressos(linhas, conexao);
    return linhas.length;
  });
  res.json({ id_evento: evento.id_evento, status: 'aprovado', ingressos_gerados: ingressos });
});

router.post('/eventos/:id/recusar', async (req, res) => {
  const { motivo } = req.body;
  if (!motivo) return res.status(400).json({ erro: 'escreva o motivo da recusa' });

  if (!(await admin.recusarEvento(req.params.id, req.usuario.id, motivo))) {
    return res.status(409).json({ erro: 'evento nao encontrado ou nao esta em analise' });
  }
  res.json({ id_evento: Number(req.params.id), status: 'recusado', motivo });
});

// --- credenciamento --------------------------------------------------------

// tudo o que a pessoa enviou, pro adm decidir. ?perfil=organizador|fornecedor
router.get('/credenciamentos', async (req, res) => {
  const perfil = req.query.perfil || 'fornecedor';
  const status = req.query.status || 'em_analise';
  if (!admin.PERFIS_CREDENCIAMENTO.includes(perfil)) {
    return res.status(400).json({ erro: 'perfil precisa ser organizador ou fornecedor' });
  }
  const linhas = await admin.credenciamentos(perfil, status);
  res.json(linhas.map((l) => ({ ...l, perfil })));
});

async function responderCredenciamento(req, res, aprovado) {
  const pedido = await admin.pedidoDeCredenciamento(req.params.id);

  if (!pedido) return res.status(404).json({ erro: 'solicitacao nao encontrada' });
  if (pedido.status !== 'em_analise') {
    return res.status(409).json({ erro: 'essa solicitacao ja foi analisada' });
  }
  const motivo = String(req.body.observacao || '').trim();
  if (!aprovado && !motivo) {
    return res.status(400).json({ erro: 'escreva o motivo da recusa em "observacao"' });
  }

  const perfil = pedido.id_organizador ? 'organizador' : 'fornecedor';
  const situacao = aprovado ? 'credenciado' : 'recusado';
  const status = aprovado ? 'aprovado' : 'recusado';

  const liberadas = await emTransacao(async (conexao) => {
    await admin.registrarDecisao(
      { idPedido: pedido.id_credenciamento, status, observacao: motivo || null, idAdm: req.usuario.id },
      conexao,
    );

    if (perfil === 'fornecedor') {
      await admin.mudarSituacaoFornecedor(pedido.id_fornecedor, situacao, conexao);
      return 0;
    }
    await admin.mudarSituacaoOrganizador(pedido.id_organizador, situacao, conexao);
    if (!aprovado) return 0;
    // aprovado: os pedidos de servico que estavam retidos chegam aos fornecedores
    const idUsuario = await admin.usuarioDoOrganizador(pedido.id_organizador, conexao);
    return liberarSolicitacoesRetidas(conexao, idUsuario);
  });

  res.json({
    id_credenciamento: pedido.id_credenciamento,
    perfil,
    status,
    solicitacoes_liberadas: liberadas,
  });
}

router.post('/credenciamentos/:id/aprovar', (req, res) => responderCredenciamento(req, res, true));
router.post('/credenciamentos/:id/recusar', (req, res) => responderCredenciamento(req, res, false));

// --- relatorios (FLX-07) ----------------------------------------------------

// numeros gerais da plataforma. Com o banco vazio, tudo vem zero.
router.get('/relatorios', async (req, res) => {
  const [[usuarios, organizadores, fornecedores, eventosPorStatus, propostas], semCred, valores, propostaValores] =
    await Promise.all([
      admin.contagens(),
      admin.semCredenciamento(),
      admin.valoresDosEventos(),
      admin.valoresDasPropostas(),
    ]);

  // quem nunca pediu credenciamento nao tem linha na tabela do perfil
  if (semCred.organizadores) organizadores.nao_solicitado = Number(semCred.organizadores);
  if (semCred.fornecedores) fornecedores.nao_solicitado = Number(semCred.fornecedores);

  res.json({
    usuarios,
    credenciamento: { organizador: organizadores, fornecedor: fornecedores },
    eventos: eventosPorStatus,
    propostas,
    valores: {
      eventos: Number(valores.eventos),
      custo_consolidado_total: dinheiro(valores.custo_total),
      custo_consolidado_medio: dinheiro(valores.custo_medio),
      custo_consolidado_aprovados: dinheiro(valores.custo_aprovados),
      propostas_selecionadas_total: dinheiro(propostaValores.selecionadas),
      proposta_selecionada_media: dinheiro(propostaValores.media),
    },
  });
});

// historico das decisoes do adm: credenciamentos e eventos analisados,
// com quem decidiu, quando e o motivo (rastreabilidade, 5.3)
router.get('/aprovacoes', async (req, res) => {
  res.json(await admin.historicoDeDecisoes());
});

module.exports = router;
