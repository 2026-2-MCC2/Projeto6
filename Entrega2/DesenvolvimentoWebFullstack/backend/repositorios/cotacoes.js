// SQL dos eventos em cotacao, do jeito que o fornecedor ve (FLX-03).
const pool = require('../config/bd');

const CAMPOS_EVENTO = `e.id_evento, e.nome, e.descricao, e.data_inicio, e.data_fim, e.status,
  e.publico_minimo, e.publico_maximo, e.publico_esperado,
  l.nome as local, l.cidade, l.estado, c.nome as categoria, u.nome as organizador,
  e.id_organizador`;

const JUNTA_EVENTO = `from evento e
       join local_evento l on l.id_local = e.id_local
       join categoria c on c.id_categoria = e.id_categoria
       join usuario u on u.id_usuario = e.id_organizador`;

// eventos em cotacao, com quantos itens tem e quantas propostas o fornecedor ja mandou
async function eventosAbertos(idFornecedor) {
  const [linhas] = await pool.query(
    `select ${CAMPOS_EVENTO},
            (select count(*) from item_custo i where i.id_evento = e.id_evento) as total_itens,
            (select count(*) from proposta p join item_custo i on i.id_item = p.id_item
              where i.id_evento = e.id_evento and p.id_fornecedor = ? and p.situacao <> 'cancelada')
              as minhas_propostas
       ${JUNTA_EVENTO}
      where e.status = 'em_cotacao'
      order by e.data_inicio`,
    [idFornecedor],
  );
  return linhas;
}

async function eventoAberto(idEvento) {
  const [linhas] = await pool.query(
    `select ${CAMPOS_EVENTO}
       ${JUNTA_EVENTO}
      where e.id_evento = ? and e.status = 'em_cotacao'`,
    [idEvento],
  );
  return linhas[0] || null;
}

// os itens do evento com a proposta do fornecedor em cada um.
// O fornecedor ve o item, mas nao o custo estimado do organizador.
async function itensComMinhaProposta(idEvento, idFornecedor) {
  const [linhas] = await pool.query(
    `select i.id_item, i.categoria, i.descricao, i.quantidade,
            p.id_proposta, p.valor, p.descricao as proposta_descricao,
            -- data como texto (AAAA-MM-DD) pra nao mudar de dia com o fuso
            p.validade::text as validade,
            p.observacoes, p.situacao
       from item_custo i
       left join proposta p on p.id_item = i.id_item and p.id_fornecedor = ?
      where i.id_evento = ?
      order by i.id_item`,
    [idFornecedor, idEvento],
  );
  return linhas;
}

module.exports = { eventosAbertos, eventoAberto, itensComMinhaProposta };
