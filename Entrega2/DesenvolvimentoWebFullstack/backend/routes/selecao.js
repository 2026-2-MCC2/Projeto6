// Selecionar e desmarcar propostas (FLX-05), do lado do organizador.
//   POST /api/propostas/:id/selecionar
//   POST /api/propostas/:id/desmarcar
// Regras: so o dono do evento, so com a cotacao encerrada, uma proposta
// selecionada por item. Proposta cancelada ou vencida nao pode ser escolhida.
const express = require('express');
const propostas = require('../repositorios/propostas');
const { emTransacao } = require('../repositorios/transacao');
const { autenticar, permitir } = require('../middleware/auth');

const router = express.Router();
const soOrganizador = [autenticar, permitir('organizador')];

// a proposta com o evento dela. Responde 404/403/409 sozinho.
async function propostaDoMeuEvento(req, res) {
  const proposta = await propostas.comEvento(req.params.id);
  if (!proposta) {
    res.status(404).json({ erro: 'proposta nao encontrada' });
    return null;
  }
  if (proposta.id_organizador !== req.usuario.id) {
    res.status(403).json({ erro: 'essa proposta e de um evento de outro organizador' });
    return null;
  }
  if (proposta.status_evento !== 'cotacao_encerrada') {
    res.status(409).json({ erro: 'encerre a cotacao para escolher as propostas' });
    return null;
  }
  return proposta;
}

router.post('/propostas/:id/selecionar', soOrganizador, async (req, res) => {
  const proposta = await propostaDoMeuEvento(req, res);
  if (!proposta) return;
  if (proposta.situacao === 'cancelada') {
    return res.status(409).json({ erro: 'proposta cancelada nao pode ser selecionada' });
  }
  if (proposta.vencida) {
    return res.status(409).json({ erro: 'essa proposta venceu e nao pode ser selecionada' });
  }

  // as outras do mesmo item viram "nao selecionada"
  await emTransacao((conexao) => propostas.selecionar(proposta, conexao));
  res.json({ id_proposta: proposta.id_proposta, situacao: 'selecionada' });
});

router.post('/propostas/:id/desmarcar', soOrganizador, async (req, res) => {
  const proposta = await propostaDoMeuEvento(req, res);
  if (!proposta) return;
  if (proposta.situacao !== 'selecionada') {
    return res.status(409).json({ erro: 'essa proposta nao esta selecionada' });
  }
  // o item volta a nao ter escolha: todas as propostas validas voltam a "enviada"
  await propostas.desmarcarItem(proposta.id_item);
  res.json({ id_proposta: proposta.id_proposta, situacao: 'enviada' });
});

module.exports = router;
