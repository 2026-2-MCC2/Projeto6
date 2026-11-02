// Regras do ciclo de vida do evento.
//   rascunho -> em_cotacao -> cotacao_encerrada -> em_analise -> aprovado/recusado
const { ufValida, texto } = require('./validacao');

// Em que situacao do evento da pra mexer em cada parte do planejamento.
// Itens nao mudam durante a cotacao, porque os fornecedores cotam em cima deles.
const EDITAVEL = {
  dados: ['rascunho', 'recusado'],
  itens: ['rascunho', 'recusado'],
  custos: ['rascunho', 'recusado', 'em_cotacao', 'cotacao_encerrada'],
};

const NOME_STATUS = {
  rascunho: 'rascunho',
  em_cotacao: 'em cotacao',
  cotacao_encerrada: 'com a cotacao encerrada',
  em_analise: 'em analise',
  aprovado: 'aprovado',
  recusado: 'recusado',
};

// null se pode mexer; senao, a mensagem explicando por que nao
function bloqueioDeMudanca(evento, parte) {
  if (EDITAVEL[parte].includes(evento.status)) return null;
  const oque = parte === 'dados' ? 'os dados do evento' : `os ${parte}`;
  return `nao da pra mudar ${oque} com o evento ${NOME_STATUS[evento.status] || evento.status}`;
}

// local digitado pelo organizador, limpo. null se faltar nome, cidade ou UF.
function normalizarLocal(local) {
  const limpo = {
    nome: (local.nome || '').trim(),
    cidade: (local.cidade || '').trim(),
    estado: (local.estado || '').trim().toUpperCase(),
    endereco: (local.endereco || '').trim(),
  };
  return limpo.nome && limpo.cidade && limpo.estado ? limpo : null;
}

// Confere os dados do evento (criar e editar usam a mesma regra).
// Devolve { erro } ou { dados, local } ja limpos.
// categoriaExiste(id) vem de fora para esta regra nao depender do SQL.
async function validarEvento(corpo, categoriaExiste) {
  const nome = texto(corpo.nome);
  const local = corpo.local || {};
  const { data_inicio, data_fim, id_categoria } = corpo;

  if (!nome || !data_inicio || !data_fim || !id_categoria) {
    return { erro: 'nome, data_inicio, data_fim e id_categoria sao obrigatorios' };
  }
  if (!texto(local.nome) || !texto(local.cidade) || !texto(local.estado)) {
    return { erro: 'informe o local: nome, cidade e estado' };
  }
  if (texto(local.estado).length !== 2) {
    return { erro: 'o estado precisa ter 2 letras, como SP' };
  }
  if (!ufValida(local.estado)) return { erro: 'UF invalida' };

  const inicio = new Date(data_inicio);
  const fim = new Date(data_fim);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
    return { erro: 'data_inicio e data_fim precisam ser datas validas' };
  }
  if (inicio <= new Date()) return { erro: 'o evento precisa comecar no futuro' };
  if (fim < inicio) return { erro: 'o evento nao pode terminar antes de comecar' };

  const inteiro = (v) => (v === undefined || v === null || v === '' ? null : Number(v));
  const publicoMinimo = inteiro(corpo.publico_minimo);
  const publicoMaximo = inteiro(corpo.publico_maximo);
  const publicoEsperado = inteiro(corpo.publico_esperado);
  const margem = corpo.margem_lucro === undefined || corpo.margem_lucro === '' ? 0 : Number(corpo.margem_lucro);

  if (!Number.isInteger(publicoMinimo) || publicoMinimo <= 0) {
    return { erro: 'o publico minimo precisa ser um numero inteiro maior que zero' };
  }
  if (!Number.isInteger(publicoMaximo) || publicoMaximo < publicoMinimo) {
    return { erro: 'o publico maximo precisa ser maior ou igual ao minimo' };
  }
  if (publicoEsperado !== null
      && (!Number.isInteger(publicoEsperado) || publicoEsperado < publicoMinimo || publicoEsperado > publicoMaximo)) {
    return { erro: 'o publico esperado precisa ficar entre o minimo e o maximo' };
  }
  if (!Number.isFinite(margem) || margem < 0 || margem >= 100) {
    return { erro: 'a margem de lucro precisa ser de 0 a 99,99%' };
  }

  if (!(await categoriaExiste(Number(id_categoria) || 0))) return { erro: 'categoria nao encontrada' };

  return {
    dados: {
      nome,
      descricao: texto(corpo.descricao) || null,
      data_inicio,
      data_fim,
      id_categoria: Number(id_categoria),
      publico_minimo: publicoMinimo,
      publico_maximo: publicoMaximo,
      publico_esperado: publicoEsperado,
      margem_lucro: margem,
    },
    local,
  };
}

// Confere um lote de ingressos (extensao do projeto). Devolve { erro } ou { dados }.
function validarLote(corpo, evento) {
  const { setor, nome, preco, quantidade, margem_revenda, data_inicio, data_fim } = corpo;
  if (!setor || !nome || preco == null || !quantidade || !data_inicio || !data_fim) {
    return { erro: 'setor, nome, preco, quantidade, data_inicio e data_fim sao obrigatorios' };
  }
  if (Number(preco) < 0 || Number(quantidade) <= 0) {
    return { erro: 'preco nao pode ser negativo e quantidade precisa ser maior que zero' };
  }
  const margem = margem_revenda == null ? 0 : Number(margem_revenda);
  if (margem < 0) {
    return { erro: 'a margem de revenda nao pode ser negativa' };
  }

  const inicio = new Date(data_inicio);
  const fim = new Date(data_fim);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
    return { erro: 'data_inicio e data_fim precisam ser datas validas' };
  }
  if (fim <= inicio) {
    return { erro: 'data_fim precisa ser depois de data_inicio' };
  }
  // nao adianta vender ingresso depois que o show comecou
  if (fim > new Date(evento.data_inicio)) {
    return { erro: 'a venda do lote nao pode terminar depois do evento' };
  }
  return { dados: { setor, nome, preco, quantidade, margem_revenda: margem, data_inicio, data_fim } };
}

module.exports = { EDITAVEL, NOME_STATUS, bloqueioDeMudanca, normalizarLocal, validarEvento, validarLote };
