// SQL da compra de ingressos (extensao do projeto): pedido, itens e pagamento.
const pool = require('../config/bd');

// o lote com a situacao do evento dele
async function loteComEvento(idLote, conexao) {
  const [linhas] = await conexao.query(
    `select lo.id_lote, lo.nome, lo.setor, lo.data_inicio, lo.data_fim, e.status as status_evento
       from lote lo join evento e on e.id_evento = lo.id_evento
      where lo.id_lote = ?`,
    [idLote],
  );
  return linhas[0] || null;
}

// reserva os ingressos disponiveis do lote. O "for update" trava as linhas
// ate o fim da transacao, pra duas pessoas nao comprarem o mesmo ingresso.
async function reservarDisponiveis(idLote, quantidade, conexao) {
  const [linhas] = await conexao.query(
    "select id_ingresso, preco from ingresso where id_lote = ? and status = 'disponivel' limit ? for update",
    [idLote, quantidade],
  );
  return linhas;
}

// reserva um ingresso anunciado na revenda (mesma trava do for update)
async function reservarAnunciado(idIngresso, conexao) {
  const [linhas] = await conexao.query(
    "select id_ingresso, preco, id_vendedor from ingresso where id_ingresso = ? and status = 'a_venda' for update",
    [idIngresso],
  );
  return linhas[0] || null;
}

// fecha o pedido: grava os itens, transfere os ingressos e registra o pagamento.
// Rodar dentro de uma transacao.
async function fechar({ idComprador, ingressos, metodo, total }, conexao) {
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

  return pedido.insertId;
}

async function doComprador(idUsuario) {
  const [linhas] = await pool.query(
    `select p.*, pg.metodo, pg.status as status_pagamento
       from pedido p left join pagamento pg on pg.id_pedido = p.id_pedido
      where p.id_comprador = ? order by p.data_pedido desc`,
    [idUsuario],
  );
  return linhas;
}

async function itensDosPedidos(idsPedidos) {
  const [linhas] = await pool.query(
    `select ip.id_pedido, ip.preco_unitario, i.codigo, i.setor, e.nome as evento
       from item_pedido ip
       join ingresso i on i.id_ingresso = ip.id_ingresso
       join evento e on e.id_evento = i.id_evento
      where ip.id_pedido in (?)`,
    [idsPedidos],
  );
  return linhas;
}

module.exports = { loteComEvento, reservarDisponiveis, reservarAnunciado, fechar, doComprador, itensDosPedidos };
