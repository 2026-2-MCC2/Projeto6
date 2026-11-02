const express = require('express');
const solicitacoes = require('../repositorios/solicitacoes');
const { autenticar, permitir } = require('../middleware/auth');

const router = express.Router();

// o que chegou pro fornecedor logado. Pedido retido (organizador ainda nao
// credenciado) nao aparece ate o adm aprovar o organizador.
router.get('/', autenticar, permitir('fornecedor'), async (req, res) => {
  res.json(await solicitacoes.recebidasPeloFornecedor(req.usuario.id));
});

async function responder(req, res, aceita) {
  const solicitacao = await solicitacoes.buscarDoFornecedor(req.params.id, req.usuario.id);

  if (!solicitacao) return res.status(404).json({ erro: 'solicitacao nao encontrada' });
  if (solicitacao.status !== 'em_analise') {
    return res.status(409).json({ erro: 'essa solicitacao ja foi respondida' });
  }

  const status = aceita ? 'aceita' : 'recusada';
  await solicitacoes.responder(solicitacao.id_solicitacao, status);
  res.json({ id_solicitacao: solicitacao.id_solicitacao, status });
}

router.post('/:id/aceitar', autenticar, permitir('fornecedor'), (req, res) => responder(req, res, true));
router.post('/:id/recusar', autenticar, permitir('fornecedor'), (req, res) => responder(req, res, false));

module.exports = router;
