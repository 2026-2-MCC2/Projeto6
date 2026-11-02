const express = require('express');
const eventos = require('../repositorios/eventos');
const chat = require('../repositorios/chat');
const { situacaoDe } = require('../repositorios/credenciamento');
const { emTransacao, ehDuplicado } = require('../repositorios/transacao');
const { normalizarLocal, validarEvento, validarLote } = require('../regras/eventos');
const { tetoRevenda } = require('../regras/ingressos');
const { autenticar, permitir } = require('../middleware/auth');
const { exigirCredenciamento } = require('../lib/credenciamento');
const { eventoDoOrganizador, podeMexer } = require('../lib/eventos');

const router = express.Router();

// organizador sem credenciamento pedido nao cria evento; para mandar o
// evento ao adm, o credenciamento precisa estar aprovado
const credenciamentoPedido = exigirCredenciamento(['em_analise', 'credenciado'], 'criar eventos');
const credenciado = exigirCredenciamento(['credenciado'], 'enviar o evento para analise');

// so os aprovados aparecem pro publico
router.get('/', async (req, res) => {
  res.json(await eventos.listarPublicos());
});

router.get('/meus', autenticar, permitir('organizador'), async (req, res) => {
  res.json(await eventos.doOrganizador(req.usuario.id));
});

router.get('/:id', async (req, res) => {
  const evento = await eventos.buscar(req.params.id);
  if (!evento) return res.status(404).json({ erro: 'evento nao encontrado' });

  const [lotes, externos, servicos] = await Promise.all([
    eventos.lotesComDisponiveis(evento.id_evento),
    eventos.fornecedoresExternos(evento.id_evento),
    eventos.servicosSolicitados(evento.id_evento),
  ]);

  res.json({ ...evento, lotes, fornecedores_externos: externos, servicos_solicitados: servicos });
});

// o local digitado vira uma linha de local_evento (reaproveita se ja existe)
async function idDoLocal(local) {
  const limpo = normalizarLocal(local);
  return limpo ? eventos.acharOuCriarLocal(limpo) : null;
}

router.post('/', autenticar, permitir('organizador'), credenciamentoPedido, async (req, res) => {
  const { erro, dados, local } = await validarEvento(req.body, eventos.categoriaExiste);
  if (erro) return res.status(400).json({ erro });

  const id = await eventos.criar(req.usuario.id, await idDoLocal(local), dados);
  res.status(201).json({ id_evento: id, nome: dados.nome, status: 'rascunho' });
});

// editar (WEB-05): so o dono, e so em rascunho ou depois de recusado
router.put('/:id', autenticar, permitir('organizador'), async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento || !podeMexer(evento, 'dados', res)) return;

  const { erro, dados, local } = await validarEvento(req.body, eventos.categoriaExiste);
  if (erro) return res.status(400).json({ erro });

  await eventos.atualizar(evento.id_evento, await idDoLocal(local), dados);
  res.json({ id_evento: evento.id_evento, ...dados, status: evento.status });
});

// excluir (WEB-05). Regra: so enquanto o evento nao foi para o adm (em analise
// ou aprovado) e nao tem proposta selecionada. Itens, custos e propostas saem
// junto (CASCADE).
router.delete('/:id', autenticar, permitir('organizador'), async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento) return;
  if (['em_analise', 'aprovado'].includes(evento.status)) {
    return res.status(409).json({ erro: 'evento em analise ou aprovado nao pode ser excluido' });
  }
  if (await eventos.contarPropostasSelecionadas(evento.id_evento)) {
    return res.status(409).json({ erro: 'esse evento tem proposta selecionada; desmarque antes de excluir' });
  }
  await eventos.excluir(evento.id_evento);
  res.json({ id_evento: evento.id_evento, excluido: true });
});

router.post('/:id/lotes', autenticar, permitir('organizador'), async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento) return;

  if (evento.status !== 'rascunho') {
    return res.status(409).json({ erro: 'so da pra mexer nos lotes enquanto o evento esta em rascunho' });
  }

  const { erro, dados } = validarLote(req.body, evento);
  if (erro) return res.status(400).json({ erro });

  try {
    const id = await eventos.criarLote(evento.id_evento, dados);
    res.status(201).json({
      id_lote: id,
      setor: dados.setor,
      nome: dados.nome,
      preco: Number(dados.preco),
      quantidade: Number(dados.quantidade),
      data_inicio: dados.data_inicio,
      data_fim: dados.data_fim,
      margem_revenda: dados.margem_revenda,
      teto_revenda: tetoRevenda(dados),
    });
  } catch (e) {
    if (ehDuplicado(e)) {
      return res.status(409).json({ erro: `esse evento ja tem o lote "${dados.nome}" no setor "${dados.setor}"` });
    }
    throw e;
  }
});

// fornecedor particular do organizador, que nao tem conta no site
router.post('/:id/fornecedores-externos', autenticar, permitir('organizador'), async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento) return;

  const { nome, servico, valor, contato } = req.body;
  if (!nome || !servico || valor == null) {
    return res.status(400).json({ erro: 'nome, servico e valor sao obrigatorios' });
  }

  const id = await eventos.criarFornecedorExterno(evento.id_evento, { nome, servico, valor, contato: contato || null });
  res.status(201).json({ id_fornecedor_externo: id, nome, servico, valor: Number(valor) });
});

// requisita um servico de fornecedor credenciado e ja abre o chat entre os dois.
// Se o organizador ainda nao esta credenciado, o pedido fica retido
// (aguardando_organizador): sem chat e sem aparecer pro fornecedor. Ele e
// liberado quando o adm aprova o organizador (admin.js).
router.post('/:id/solicitacoes', autenticar, permitir('organizador'), credenciamentoPedido, async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento) return;

  const { id_servico, mensagem, valor_proposto } = req.body;
  if (!id_servico) return res.status(400).json({ erro: 'id_servico e obrigatorio' });

  const servico = await eventos.servicoComFornecedor(id_servico);
  if (!servico) return res.status(404).json({ erro: 'servico nao encontrado' });
  if (servico.situacao !== 'credenciado') {
    return res.status(409).json({ erro: 'esse fornecedor ainda nao esta credenciado' });
  }

  const retida = (await situacaoDe(req.usuario)) !== 'credenciado';
  const status = retida ? 'aguardando_organizador' : 'em_analise';

  try {
    const resultado = await emTransacao(async (conexao) => {
      const idSolicitacao = await eventos.criarSolicitacao({
        idEvento: evento.id_evento,
        idServico: id_servico,
        mensagem: mensagem || null,
        valorProposto: valor_proposto ?? servico.preco,
        status,
      }, conexao);
      const idChat = retida ? null : await chat.abrirDaSolicitacao(conexao, {
        id_solicitacao: idSolicitacao,
        id_organizador: req.usuario.id,
        id_usuario_fornecedor: servico.id_usuario,
        mensagem,
      });
      return { id_solicitacao: idSolicitacao, id_chat: idChat };
    });
    res.status(201).json({ ...resultado, status });
  } catch (e) {
    if (ehDuplicado(e)) {
      return res.status(409).json({ erro: 'esse servico ja foi solicitado para esse evento' });
    }
    throw e;
  }
});

// manda o evento pro adm analisar
router.post('/:id/enviar-analise', autenticar, permitir('organizador'), credenciado, async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento) return;

  if (evento.status === 'em_analise') {
    return res.status(409).json({ erro: 'esse evento ja esta em analise' });
  }
  if (evento.status === 'aprovado') {
    return res.status(409).json({ erro: 'esse evento ja foi aprovado' });
  }
  if (evento.status === 'em_cotacao') {
    return res.status(409).json({ erro: 'encerre a cotacao antes de enviar o evento para analise' });
  }

  if (!(await eventos.contarItens(evento.id_evento))) {
    return res.status(400).json({ erro: 'cadastre pelo menos um item de custo antes de enviar para analise' });
  }

  await eventos.enviarParaAnalise(evento.id_evento);
  res.json({ id_evento: evento.id_evento, status: 'em_analise' });
});

// --- cotacao (FLX-03) ---------------------------------------------------------
// Publicar o evento para cotacao: os fornecedores credenciados passam a ver o
// evento e os itens e mandam propostas. So o dono, credenciado, com 1 item ou mais.
const credenciadoParaCotar = exigirCredenciamento(['credenciado'], 'publicar o evento para cotacao');

router.post('/:id/abrir-cotacao', autenticar, permitir('organizador'), credenciadoParaCotar, async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento) return;
  if (!['rascunho', 'recusado', 'cotacao_encerrada'].includes(evento.status)) {
    return res.status(409).json({ erro: 'so da pra publicar para cotacao um evento em rascunho, recusado ou com a cotacao encerrada' });
  }
  if (!(await eventos.contarItens(evento.id_evento))) {
    return res.status(400).json({ erro: 'cadastre pelo menos um item de custo antes de publicar para cotacao' });
  }
  await emTransacao(async (conexao) => {
    await eventos.mudarStatus(evento.id_evento, 'em_cotacao', conexao);
    // reabrir desfaz as escolhas: as propostas voltam a "enviada" e podem mudar
    await eventos.desfazerEscolhas(evento.id_evento, conexao);
  });
  res.json({ id_evento: evento.id_evento, status: 'em_cotacao' });
});

router.post('/:id/encerrar-cotacao', autenticar, permitir('organizador'), async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento) return;
  if (evento.status !== 'em_cotacao') {
    return res.status(409).json({ erro: 'esse evento nao esta em cotacao' });
  }
  await eventos.mudarStatus(evento.id_evento, 'cotacao_encerrada');
  res.json({ id_evento: evento.id_evento, status: 'cotacao_encerrada' });
});

module.exports = router;
