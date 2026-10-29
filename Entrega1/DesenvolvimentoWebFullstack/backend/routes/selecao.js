// Selecionar e desmarcar propostas (FLX-05), do lado do organizador.
//   POST /api/propostas/:id/selecionar
//   POST /api/propostas/:id/desmarcar
// Regras: so o dono do evento, so com a cotacao encerrada, uma proposta
// selecionada por item. Proposta cancelada ou vencida nao pode ser escolhida.
const express = require('express');
const pool = require('../config/bd');
const { autenticar, permitir } = require('../middleware/auth');

const router = express.Router();
const soOrganizador = [autenticar, permitir('organizador')];

// a proposta com o evento dela. Responde 404/403/409 sozinho.
async function propostaDoMeuEvento(req, res) {
  const [linhas] = await pool.query(
    `select p.*, (p.validade < current_date) as vencida,
            e.id_evento, e.id_organizador, e.status as status_evento
       from proposta p
       join item_custo i on i.id_item = p.id_item
       join evento e on e.id_evento = i.id_evento
      where p.id_proposta = ?`,
    [req.params.id],
  );
  const proposta = linhas[0];
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

  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();
    // as outras do mesmo item viram "nao selecionada"
    await conexao.query(
      `update proposta set situacao = 'nao_selecionada', atualizado_em = now()
        where id_item = ? and id_proposta <> ? and situacao in ('enviada', 'selecionada')`,
      [proposta.id_item, proposta.id_proposta],
    );
    await conexao.query(
      "update proposta set situacao = 'selecionada', atualizado_em = now() where id_proposta = ?",
      [proposta.id_proposta],
    );
    await conexao.commit();
    res.json({ id_proposta: proposta.id_proposta, situacao: 'selecionada' });
  } catch (e) {
    await conexao.rollback();
    throw e;
  } finally {
    conexao.release();
  }
});

router.post('/propostas/:id/desmarcar', soOrganizador, async (req, res) => {
  const proposta = await propostaDoMeuEvento(req, res);
  if (!proposta) return;
  if (proposta.situacao !== 'selecionada') {
    return res.status(409).json({ erro: 'essa proposta nao esta selecionada' });
  }
  // o item volta a nao ter escolha: todas as propostas validas voltam a "enviada"
  await pool.query(
    `update proposta set situacao = 'enviada', atualizado_em = now()
      where id_item = ? and situacao in ('selecionada', 'nao_selecionada')`,
    [proposta.id_item],
  );
  res.json({ id_proposta: proposta.id_proposta, situacao: 'enviada' });
});

module.exports = router;
