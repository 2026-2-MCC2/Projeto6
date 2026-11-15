// SQL dos ingressos e da revenda (extensao do projeto).
const pool = require('../config/bd');

async function doVendedor(idUsuario) {
  const [linhas] = await pool.query(
    `select i.id_ingresso, i.codigo, i.status, i.preco,
            e.nome as evento, e.data_inicio, lo.setor, lo.nome as lote,
            lo.preco as preco_original, lo.margem_revenda
       from ingresso i
       join evento e on e.id_evento = i.id_evento
       join lote lo on lo.id_lote = i.id_lote
      where i.id_vendedor = ? and i.status in ('vendido', 'a_venda')
      order by e.data_inicio`,
    [idUsuario],
  );
  return linhas;
}

// vitrine de revenda de um evento
async function aVendaNoEvento(idEvento) {
  const [linhas] = await pool.query(
    `select i.id_ingresso, i.codigo, i.setor, i.preco, u.nome as vendedor,
            lo.nome as lote, lo.preco as preco_original
       from ingresso i
       join usuario u on u.id_usuario = i.id_vendedor
       join lote lo on lo.id_lote = i.id_lote
      where i.id_evento = ? and i.status = 'a_venda'
      order by i.preco`,
    [idEvento],
  );
  return linhas;
}

// o ingresso com o preco e a margem do lote dele
async function comLote(idIngresso) {
  const [linhas] = await pool.query(
    `select i.*, lo.preco as preco_lote, lo.margem_revenda
       from ingresso i join lote lo on lo.id_lote = i.id_lote
      where i.id_ingresso = ?`,
    [idIngresso],
  );
  return linhas[0] || null;
}

async function anunciar(idIngresso, preco) {
  await pool.query("update ingresso set status = 'a_venda', preco = ? where id_ingresso = ?", [preco, idIngresso]);
}

// tira o anuncio. Devolve false se o ingresso nao existe, nao e da pessoa
// ou nao estava anunciado.
async function retirarAnuncio(idIngresso, idUsuario) {
  const [r] = await pool.query(
    "update ingresso set status = 'vendido' where id_ingresso = ? and id_vendedor = ? and status = 'a_venda'",
    [idIngresso, idUsuario],
  );
  return r.affectedRows > 0;
}

module.exports = { doVendedor, aVendaNoEvento, comLote, anunciar, retirarAnuncio };
