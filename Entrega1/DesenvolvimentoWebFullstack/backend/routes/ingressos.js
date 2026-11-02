const express = require('express');
const ingressos = require('../repositorios/ingressos');
const { tetoRevenda } = require('../regras/ingressos');
const { autenticar } = require('../middleware/auth');

const router = express.Router();

router.get('/meus', autenticar, async (req, res) => {
  const linhas = await ingressos.doVendedor(req.usuario.id);
  res.json(linhas.map((l) => ({ ...l, teto_revenda: tetoRevenda(l) })));
});

// vitrine de revenda de um evento
router.get('/revenda/:idEvento', async (req, res) => {
  res.json(await ingressos.aVendaNoEvento(req.params.idEvento));
});

// poe o ingresso a venda, respeitando o teto do lote
router.post('/:id/anunciar', autenticar, async (req, res) => {
  const { preco } = req.body;
  if (preco == null) return res.status(400).json({ erro: 'informe o preco do anuncio' });

  const ingresso = await ingressos.comLote(req.params.id);

  if (!ingresso) return res.status(404).json({ erro: 'ingresso nao encontrado' });
  if (ingresso.id_vendedor !== req.usuario.id) {
    return res.status(403).json({ erro: 'esse ingresso nao e seu' });
  }
  if (ingresso.status !== 'vendido') {
    return res.status(409).json({ erro: `ingresso com status "${ingresso.status}" nao pode ser anunciado` });
  }

  const teto = tetoRevenda({ preco: ingresso.preco_lote, margem_revenda: ingresso.margem_revenda });
  if (Number(preco) > teto) {
    return res.status(422).json({
      erro: 'preco acima do teto de revenda definido pelo organizador',
      preco_original: Number(ingresso.preco_lote),
      margem_revenda: Number(ingresso.margem_revenda),
      teto_revenda: teto,
    });
  }
  if (Number(preco) <= 0) {
    return res.status(400).json({ erro: 'o preco precisa ser maior que zero' });
  }

  await ingressos.anunciar(ingresso.id_ingresso, preco);
  res.json({ id_ingresso: ingresso.id_ingresso, status: 'a_venda', preco: Number(preco), teto_revenda: teto });
});

router.delete('/:id/anuncio', autenticar, async (req, res) => {
  const retirou = await ingressos.retirarAnuncio(req.params.id, req.usuario.id);
  if (!retirou) {
    return res.status(409).json({ erro: 'ingresso nao encontrado, nao e seu, ou nao esta anunciado' });
  }
  res.json({ id_ingresso: Number(req.params.id), status: 'vendido' });
});

module.exports = router;
