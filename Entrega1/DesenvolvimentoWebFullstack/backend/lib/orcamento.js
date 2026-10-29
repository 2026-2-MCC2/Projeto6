// Orcamento consolidado do evento (FLX-05).
// Custo total = propostas selecionadas
//             + itens sem proposta selecionada, pelo custo estimado
//             + outros custos (fiscal, operacional, variavel, outro).
// E esse custo total que o calculo do ticket (FLX-06) usa.
const pool = require('../config/bd');

const dinheiro = (v) => Number(Number(v || 0).toFixed(2));

async function orcamentoDoEvento(idEvento, conexao = pool) {
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

  const linhas = itens.map((i) => ({
    ...i,
    origem: i.id_proposta ? 'proposta' : 'estimado',
    valor_considerado: dinheiro(i.id_proposta ? i.valor_proposta : i.custo_estimado),
  }));
  const somar = (lista) => dinheiro(lista.reduce((s, x) => s + x.valor_considerado, 0));
  const custosPorTipo = { fiscal: 0, operacional: 0, variavel: 0, outro: 0 };
  for (const c of custos) custosPorTipo[c.tipo] = dinheiro(c.total);
  const outrosCustos = dinheiro(Object.values(custosPorTipo).reduce((s, v) => s + v, 0));

  const comProposta = linhas.filter((l) => l.origem === 'proposta');
  const semProposta = linhas.filter((l) => l.origem === 'estimado');

  return {
    itens: linhas,
    totais: {
      propostas_selecionadas: somar(comProposta),
      itens_sem_proposta: somar(semProposta),
      outros_custos: outrosCustos,
      custos_por_tipo: custosPorTipo,
      custo_total: dinheiro(somar(linhas) + outrosCustos),
    },
    contagem: {
      itens: linhas.length,
      itens_com_proposta: comProposta.length,
      itens_sem_proposta: semProposta.length,
    },
  };
}

// a mesma conta em SQL, para listas com muitos eventos (painel do adm)
const SQL_CUSTO_CONSOLIDADO = `(
  (select coalesce(sum(coalesce(p.valor, i.custo_estimado)), 0)
     from item_custo i
     left join proposta p on p.id_item = i.id_item and p.situacao = 'selecionada'
    where i.id_evento = e.id_evento)
  + (select coalesce(sum(valor), 0) from custo_evento where id_evento = e.id_evento)
)`;

module.exports = { orcamentoDoEvento, SQL_CUSTO_CONSOLIDADO };
