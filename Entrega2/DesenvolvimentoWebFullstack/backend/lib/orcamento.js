// Junta o SQL e a conta do orcamento consolidado (FLX-05): busca os dados
// em repositorios/orcamento.js e calcula em regras/orcamento.js.
const { dadosDoOrcamento } = require('../repositorios/orcamento');
const { montarOrcamento } = require('../regras/orcamento');

async function orcamentoDoEvento(idEvento, conexao) {
  const { itens, custos } = await dadosDoOrcamento(idEvento, conexao);
  return montarOrcamento(itens, custos);
}

module.exports = { orcamentoDoEvento };
