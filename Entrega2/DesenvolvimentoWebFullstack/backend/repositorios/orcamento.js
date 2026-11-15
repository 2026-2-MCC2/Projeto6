// SQL do orcamento consolidado (FLX-05). A conta fica em regras/orcamento.js.
const pool = require('../config/bd');

// os itens com a proposta selecionada de cada um (se houver) e o total dos
// outros custos por tipo
async function dadosDoOrcamento(idEvento, conexao = pool) {
  const [itens] = await conexao.query(
    `select i.id_item, i.categoria, i.descricao, i.quantidade, i.custo_estimado,
            p.id_proposta, p.valor as valor_proposta, f.nome_empresa as fornecedor
       from item_custo i
       left join proposta p on p.id_item = i.id_item and p.situacao = 'selecionada'
       left join fornecedor f on f.id_fornecedor = p.id_fornecedor
      where i.id_evento = ?
      order by i.id_item`,
    [idEvento],
  );
  const [custos] = await conexao.query(
    'select tipo, sum(valor) as total from custo_evento where id_evento = ? group by tipo',
    [idEvento],
  );
  return { itens, custos };
}

// a mesma conta em SQL, para listas com muitos eventos (painel do adm).
// Usar dentro de um select que tenha o evento com o apelido "e".
const SQL_CUSTO_CONSOLIDADO = `(
  (select coalesce(sum(coalesce(p.valor, i.custo_estimado)), 0)
     from item_custo i
     left join proposta p on p.id_item = i.id_item and p.situacao = 'selecionada'
    where i.id_evento = e.id_evento)
  + (select coalesce(sum(valor), 0) from custo_evento where id_evento = e.id_evento)
)`;

module.exports = { dadosDoOrcamento, SQL_CUSTO_CONSOLIDADO };
