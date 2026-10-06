const express = require('express');
const pool = require('../config/bd');
const { autenticar } = require('../middleware/auth');

const router = express.Router();
const METODOS = ['pix', 'cartao', 'boleto'];

// fecha o pedido: grava os itens, transfere os ingressos e registra o pagamento
async function fecharPedido(conexao, idComprador, ingressos, metodo) {
  const total = ingressos.reduce((soma, i) => soma + Number(i.preco), 0);

  const [pedido] = await conexao.query(
    "insert into pedido (id_comprador, valor_total, status) values (?, ?, 'pago')",
    [idComprador, total],
  );

  await conexao.query('insert into item_pedido (id_pedido, id_ingresso, preco_unitario) values ?', [
    ingressos.map((i) => [pedido.insertId, i.id_ingresso, i.preco]),
  ]);

  await conexao.query(
    "update ingresso set id_vendedor = ?, status = 'vendido' where id_ingresso in (?)",
    [idComprador, ingressos.map((i) => i.id_ingresso)],
  );

  await conexao.query(
    `insert into pagamento (id_pedido, metodo, status, valor, data_pagamento)
     values (?, ?, 'aprovado', ?, now())`,
    [pedido.insertId, metodo, total],
  );

  return { id_pedido: pedido.insertId, valor_total: total };
}

// compra direto do lote (venda original do organizador)
router.post('/', autenticar, async (req, res) => {
  const { id_lote, quantidade, metodo } = req.body;
  const qtd = Number(quantidade || 1);

  if (!id_lote) return res.status(400).json({ erro: 'id_lote e obrigatorio' });
  if (!METODOS.includes(metodo)) {
    return res.status(400).json({ erro: `metodo precisa ser um de: ${METODOS.join(', ')}` });
  }
  if (!Number.isInteger(qtd) || qtd < 1 || qtd > 6) {
    return res.status(400).json({ erro: 'quantidade precisa ser um numero inteiro de 1 a 6' });
  }

  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();

    const [lotes] = await conexao.query(
      `select lo.id_lote, lo.nome, lo.setor, lo.data_inicio, lo.data_fim, e.status as status_evento
         from lote lo join evento e on e.id_evento = lo.id_evento
        where lo.id_lote = ?`,
      [id_lote],
    );
    const lote = lotes[0];

    if (!lote || lote.status_evento !== 'aprovado') {
      await conexao.rollback();
      return res.status(404).json({ erro: 'lote nao encontrado ou evento ainda nao aprovado' });
    }

    const agora = new Date();
    if (agora < new Date(lote.data_inicio)) {
      await conexao.rollback();
      return res.status(409).json({
        erro: `o lote "${lote.nome}" ainda nao abriu`,
        abre_em: lote.data_inicio,
      });
    }
    if (agora > new Date(lote.data_fim)) {
      await conexao.rollback();
      return res.status(409).json({
        erro: `o lote "${lote.nome}" ja encerrou`,
        fechou_em: lote.data_fim,
      });
    }

    // trava as linhas pra duas pessoas nao comprarem o mesmo ingresso
    const [ingressos] = await conexao.query(
      "select id_ingresso, preco from ingresso where id_lote = ? and status = 'disponivel' limit ? for update",
      [id_lote, qtd],
    );

    if (ingressos.length < qtd) {
      await conexao.rollback();
      return res.status(409).json({
        erro: 'nao ha ingressos suficientes nesse lote',
        disponiveis: ingressos.length,
      });
    }

    const resultado = await fecharPedido(conexao, req.usuario.id, ingressos, metodo);
    await conexao.commit();
    res.status(201).json({ ...resultado, status: 'pago', ingressos: ingressos.length });
  } catch (e) {
    await conexao.rollback();
    throw e;
  } finally {
    conexao.release();
  }
});

// compra de um ingresso que outro usuario colocou a venda
router.post('/revenda', autenticar, async (req, res) => {
  const { id_ingresso, metodo } = req.body;

  if (!id_ingresso) return res.status(400).json({ erro: 'id_ingresso e obrigatorio' });
  if (!METODOS.includes(metodo)) {
    return res.status(400).json({ erro: `metodo precisa ser um de: ${METODOS.join(', ')}` });
  }

  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();

    const [linhas] = await conexao.query(
      "select id_ingresso, preco, id_vendedor from ingresso where id_ingresso = ? and status = 'a_venda' for update",
      [id_ingresso],
    );
    const ingresso = linhas[0];

    if (!ingresso) {
      await conexao.rollback();
      return res.status(409).json({ erro: 'esse ingresso nao esta a venda' });
    }
    if (ingresso.id_vendedor === req.usuario.id) {
      await conexao.rollback();
      return res.status(409).json({ erro: 'voce nao pode comprar o seu proprio ingresso' });
    }

    const resultado = await fecharPedido(conexao, req.usuario.id, [ingresso], metodo);
    await conexao.commit();
    res.status(201).json({ ...resultado, status: 'pago', revenda: true });
  } catch (e) {
    await conexao.rollback();
    throw e;
  } finally {
    conexao.release();
  }
});

router.get('/meus', autenticar, async (req, res) => {
  const [pedidos] = await pool.query(
    `select p.*, pg.metodo, pg.status as status_pagamento
       from pedido p left join pagamento pg on pg.id_pedido = p.id_pedido
      where p.id_comprador = ? order by p.data_pedido desc`,
    [req.usuario.id],
  );
  if (!pedidos.length) return res.json([]);

  const [itens] = await pool.query(
    `select ip.id_pedido, ip.preco_unitario, i.codigo, i.setor, e.nome as evento
       from item_pedido ip
       join ingresso i on i.id_ingresso = ip.id_ingresso
       join evento e on e.id_evento = i.id_evento
      where ip.id_pedido in (?)`,
    [pedidos.map((p) => p.id_pedido)],
  );

  res.json(
    pedidos.map((p) => ({ ...p, itens: itens.filter((i) => i.id_pedido === p.id_pedido) })),
  );
});

module.exports = router;
