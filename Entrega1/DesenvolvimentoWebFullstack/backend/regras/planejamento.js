// Regras do planejamento do evento (FLX-02): itens de custo, outros custos
// e os cenarios de publico do calculo do ticket (FLX-06).
const { texto } = require('./validacao');
const { dinheiro } = require('./orcamento');

const CATEGORIAS_ITEM = ['iluminacao', 'comida', 'bebida', 'seguranca', 'estrutura', 'outros'];
const TIPOS_CUSTO = ['fiscal', 'operacional', 'variavel', 'outro'];

// Devolve { erro } ou { dados } limpos.
function validarItem(corpo) {
  const d = {
    categoria: corpo.categoria,
    descricao: texto(corpo.descricao),
    quantidade: Number(corpo.quantidade),
    custo_estimado: Number(corpo.custo_estimado),
  };
  if (!CATEGORIAS_ITEM.includes(d.categoria)) {
    return { erro: `categoria precisa ser uma de: ${CATEGORIAS_ITEM.join(', ')}` };
  }
  if (!d.descricao) return { erro: 'descreva o item' };
  if (!Number.isInteger(d.quantidade) || d.quantidade <= 0) {
    return { erro: 'a quantidade precisa ser um numero inteiro maior que zero' };
  }
  if (corpo.custo_estimado === undefined || corpo.custo_estimado === '' || !(d.custo_estimado >= 0)) {
    return { erro: 'o custo estimado precisa ser um valor maior ou igual a zero' };
  }
  d.custo_estimado = dinheiro(d.custo_estimado);
  return { dados: d };
}

// Devolve { erro } ou { dados } limpos.
function validarCusto(corpo) {
  const d = { tipo: corpo.tipo, descricao: texto(corpo.descricao), valor: Number(corpo.valor) };
  if (!TIPOS_CUSTO.includes(d.tipo)) return { erro: `tipo precisa ser um de: ${TIPOS_CUSTO.join(', ')}` };
  if (!d.descricao) return { erro: 'descreva o custo' };
  if (corpo.valor === undefined || corpo.valor === '' || !(d.valor >= 0)) {
    return { erro: 'o valor precisa ser maior ou igual a zero' };
  }
  d.valor = dinheiro(d.valor);
  return { dados: d };
}

// totais da tela de planejamento: itens pelo custo estimado e outros custos por tipo
function totaisDoPlanejamento(itens, custos) {
  const somar = (lista, campo) => dinheiro(lista.reduce((s, x) => s + Number(x[campo]), 0));
  return {
    itens_estimado: somar(itens, 'custo_estimado'),
    custos: somar(custos, 'valor'),
    custos_por_tipo: Object.fromEntries(
      TIPOS_CUSTO.map((t) => [t, somar(custos.filter((c) => c.tipo === t), 'valor')]),
    ),
  };
}

// os cenarios de publico do ticket: minimo e maximo sempre, esperado se houver
function cenariosDePublico(evento) {
  const cenarios = [
    { nome: 'mínimo', publico: evento.publico_minimo },
    { nome: 'máximo', publico: evento.publico_maximo },
  ];
  if (evento.publico_esperado) {
    cenarios.push({ nome: 'esperado', publico: evento.publico_esperado });
  }
  return cenarios;
}

module.exports = { CATEGORIAS_ITEM, TIPOS_CUSTO, validarItem, validarCusto, totaisDoPlanejamento, cenariosDePublico };
