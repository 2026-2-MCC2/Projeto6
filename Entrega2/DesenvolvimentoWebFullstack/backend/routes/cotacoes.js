// Cotacao e propostas (FLX-03 e FLX-04), do lado do fornecedor.
//   GET  /api/cotacoes                 eventos em cotacao
//   GET  /api/cotacoes/:idEvento       um evento, com os itens e a minha proposta de cada item
//   POST /api/itens/:id/propostas      envia proposta para um item
//   PUT  /api/propostas/:id            edita a minha proposta
//   POST /api/propostas/:id/cancelar   cancela a minha proposta
//   GET  /api/propostas/minhas         historico das minhas propostas
// So fornecedor credenciado (FLX-01). Os outros recebem 403.
const express = require('express');
const cotacoes = require('../repositorios/cotacoes');
const propostas = require('../repositorios/propostas');
const fornecedores = require('../repositorios/fornecedores');
const { validarProposta } = require('../regras/propostas');
const { autenticar, permitir } = require('../middleware/auth');
const { exigirCredenciamento } = require('../lib/credenciamento');

const router = express.Router();
const soFornecedorCredenciado = [
  autenticar,
  permitir('fornecedor'),
  exigirCredenciamento(['credenciado'], 'ver eventos em cotacao e enviar propostas'),
];

// o credenciamento ja garantiu que o fornecedor existe
async function meuFornecedor(idUsuario) {
  return (await fornecedores.doUsuario(idUsuario)).id_fornecedor;
}

router.get('/cotacoes', soFornecedorCredenciado, async (req, res) => {
  const idFornecedor = await meuFornecedor(req.usuario.id);
  res.json(await cotacoes.eventosAbertos(idFornecedor));
});

router.get('/cotacoes/:idEvento', soFornecedorCredenciado, async (req, res) => {
  const idFornecedor = await meuFornecedor(req.usuario.id);
  const evento = await cotacoes.eventoAberto(req.params.idEvento);
  if (!evento) return res.status(404).json({ erro: 'evento nao encontrado ou fora de cotacao' });

  const itens = await cotacoes.itensComMinhaProposta(evento.id_evento, idFornecedor);
  res.json({ ...evento, itens });
});

router.post('/itens/:id/propostas', soFornecedorCredenciado, async (req, res) => {
  const idFornecedor = await meuFornecedor(req.usuario.id);
  const item = await propostas.itemComStatusEvento(req.params.id);
  if (!item) return res.status(404).json({ erro: 'item nao encontrado' });
  if (item.status !== 'em_cotacao') {
    return res.status(409).json({ erro: 'esse evento nao esta recebendo propostas' });
  }
  const { erro, dados } = validarProposta(req.body);
  if (erro) return res.status(400).json({ erro });

  // proposta cancelada pode ser enviada de novo: reaproveita a linha
  const existe = await propostas.doFornecedorNoItem(item.id_item, idFornecedor);
  if (existe && existe.situacao !== 'cancelada') {
    return res.status(409).json({ erro: 'voce ja mandou proposta para esse item; edite a que existe' });
  }
  if (existe) {
    await propostas.atualizar(existe.id_proposta, dados, { reenviar: true });
    return res.status(201).json({ id_proposta: existe.id_proposta, ...dados, situacao: 'enviada' });
  }
  const id = await propostas.criar({ idItem: item.id_item, idFornecedor, ...dados });
  res.status(201).json({ id_proposta: id, ...dados, situacao: 'enviada' });
});

// a minha proposta, com a situacao do evento. Responde 404/409 sozinho.
async function minhaPropostaEditavel(req, res) {
  const idFornecedor = await meuFornecedor(req.usuario.id);
  const proposta = await propostas.doFornecedorComEvento(req.params.id, idFornecedor);
  if (!proposta) {
    res.status(404).json({ erro: 'proposta nao encontrada' });
    return null;
  }
  if (proposta.situacao !== 'enviada' || proposta.status_evento !== 'em_cotacao') {
    res.status(409).json({ erro: 'so da pra mudar proposta enviada com a cotacao aberta' });
    return null;
  }
  return proposta;
}

router.put('/propostas/:id', soFornecedorCredenciado, async (req, res) => {
  const proposta = await minhaPropostaEditavel(req, res);
  if (!proposta) return;
  const { erro, dados } = validarProposta(req.body);
  if (erro) return res.status(400).json({ erro });
  await propostas.atualizar(proposta.id_proposta, dados);
  res.json({ id_proposta: proposta.id_proposta, ...dados, situacao: 'enviada' });
});

router.post('/propostas/:id/cancelar', soFornecedorCredenciado, async (req, res) => {
  const proposta = await minhaPropostaEditavel(req, res);
  if (!proposta) return;
  await propostas.cancelar(proposta.id_proposta);
  res.json({ id_proposta: proposta.id_proposta, situacao: 'cancelada' });
});

router.get('/propostas/minhas', soFornecedorCredenciado, async (req, res) => {
  const idFornecedor = await meuFornecedor(req.usuario.id);
  res.json(await propostas.historicoDoFornecedor(idFornecedor));
});

module.exports = router;
