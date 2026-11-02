// Orcamento consolidado do evento (FLX-05).
// Custo total = propostas selecionadas
//             + itens sem proposta selecionada, pelo custo estimado
//             + outros custos (fiscal, operacional, variavel, outro).
// E esse custo total que o calculo do ticket (FLX-06) usa.

const dinheiro = (v) => Number(Number(v || 0).toFixed(2));

// itens: cada item com id_proposta/valor_proposta da proposta selecionada (ou nulos)
// custos: total por tipo de outro custo ({ tipo, total })
function montarOrcamento(itens, custos) {
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

module.exports = { dinheiro, montarOrcamento };
