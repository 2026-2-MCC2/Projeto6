const express = require('express');
const pool = require('../config/bd');
const { autenticar, permitir } = require('../middleware/auth');

const router = express.Router();

// o que chegou pro fornecedor logado
router.get('/', autenticar, permitir('fornecedor'), async (req, res) => {
  const [linhas] = await pool.query(
    `select ss.*, s.nome as servico, e.nome as evento, e.data_hora,
            u.nome as organizador, ch.id_chat
       from solicitacao_servico ss
       join servico s on s.id_servico = ss.id_servico
       join fornecedor f on f.id_fornecedor = s.id_fornecedor
       join evento e on e.id_evento = ss.id_evento
       join usuario u on u.id_usuario = e.id_organizador
       left join chat ch on ch.id_solicitacao = ss.id_solicitacao
      where f.id_usuario = ?
      order by ss.criado_em desc`,
    [req.usuario.id],
  );
  res.json(linhas);
});

async function responder(req, res, aceita) {
  const [linhas] = await pool.query(
    `select ss.* from solicitacao_servico ss
       join servico s on s.id_servico = ss.id_servico
       join fornecedor f on f.id_fornecedor = s.id_fornecedor
      where ss.id_solicitacao = ? and f.id_usuario = ?`,
    [req.params.id, req.usuario.id],
  );
  const solicitacao = linhas[0];

  if (!solicitacao) return res.status(404).json({ erro: 'solicitacao nao encontrada' });
  if (solicitacao.status !== 'em_analise') {
    return res.status(409).json({ erro: 'essa solicitacao ja foi respondida' });
  }

  await pool.query(
    'update solicitacao_servico set status = ?, respondido_em = now() where id_solicitacao = ?',
    [aceita ? 'aceita' : 'recusada', solicitacao.id_solicitacao],
  );
  res.json({ id_solicitacao: solicitacao.id_solicitacao, status: aceita ? 'aceita' : 'recusada' });
}

router.post('/:id/aceitar', autenticar, permitir('fornecedor'), (req, res) => responder(req, res, true));
router.post('/:id/recusar', autenticar, permitir('fornecedor'), (req, res) => responder(req, res, false));

module.exports = router;
