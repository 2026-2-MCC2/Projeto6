const express = require('express');
const pool = require('../config/bd');
const { autenticar } = require('../middleware/auth');

const router = express.Router();

// teto de revenda do lote: preco original + a margem que o organizador liberou
function tetoRevenda(lote) {
  return Number((Number(lote.preco) * (1 + Number(lote.margem_revenda) / 100)).toFixed(2));
}

router.get('/meus', autenticar, async (req, res) => {
  const [linhas] = await pool.query(
    `select i.id_ingresso, i.codigo, i.status, i.preco,
            e.nome as evento, e.data_hora, lo.setor, lo.nome as lote,
            lo.preco as preco_original, lo.margem_revenda
       from ingresso i
       join evento e on e.id_evento = i.id_evento
       join lote lo on lo.id_lote = i.id_lote
      where i.id_vendedor = ? and i.status in ('vendido', 'a_venda')
      order by e.data_hora`,
    [req.usuario.id],
  );
  res.json(linhas.map((l) => ({ ...l, teto_revenda: tetoRevenda(l) })));
});

// vitrine de revenda de um evento
router.get('/revenda/:idEvento', async (req, res) => {
  const [linhas] = await pool.query(
    `select i.id_ingresso, i.codigo, i.setor, i.preco, u.nome as vendedor,
            lo.nome as lote, lo.preco as preco_original
       from ingresso i
       join usuario u on u.id_usuario = i.id_vendedor
       join lote lo on lo.id_lote = i.id_lote
      where i.id_evento = ? and i.status = 'a_venda'
      order by i.preco`,
    [req.params.idEvento],
  );
  res.json(linhas);
});

// poe o ingresso a venda, respeitando o teto do lote
router.post('/:id/anunciar', autenticar, async (req, res) => {
  const { preco } = req.body;
  if (preco == null) return res.status(400).json({ erro: 'informe o preco do anuncio' });

  const [linhas] = await pool.query(
    `select i.*, lo.preco as preco_lote, lo.margem_revenda
       from ingresso i join lote lo on lo.id_lote = i.id_lote
      where i.id_ingresso = ?`,
    [req.params.id],
  );
  const ingresso = linhas[0];

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

  await pool.query("update ingresso set status = 'a_venda', preco = ? where id_ingresso = ?", [
    preco,
    ingresso.id_ingresso,
  ]);
  res.json({ id_ingresso: ingresso.id_ingresso, status: 'a_venda', preco: Number(preco), teto_revenda: teto });
});

router.delete('/:id/anuncio', autenticar, async (req, res) => {
  const [r] = await pool.query(
    "update ingresso set status = 'vendido' where id_ingresso = ? and id_vendedor = ? and status = 'a_venda'",
    [req.params.id, req.usuario.id],
  );
  if (!r.affectedRows) {
    return res.status(409).json({ erro: 'ingresso nao encontrado, nao e seu, ou nao esta anunciado' });
  }
  res.json({ id_ingresso: Number(req.params.id), status: 'vendido' });
});

module.exports = router;
