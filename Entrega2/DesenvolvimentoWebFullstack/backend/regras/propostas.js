// Regras da proposta do fornecedor (FLX-04).
const { texto } = require('./validacao');

// data de hoje no fuso do servidor (o processo roda no horario de Brasilia)
function hoje() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// confere valor, descricao e validade. Devolve { erro } ou { dados } limpos.
function validarProposta(corpo) {
  const d = {
    valor: Number(corpo.valor),
    descricao: texto(corpo.descricao),
    validade: texto(corpo.validade).slice(0, 10),
    observacoes: texto(corpo.observacoes) || null,
  };
  if (!(d.valor > 0)) return { erro: 'o valor precisa ser maior que zero' };
  d.valor = Number(d.valor.toFixed(2));
  if (!d.descricao) return { erro: 'descreva o que a proposta inclui' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.validade) || Number.isNaN(new Date(d.validade).getTime())) {
    return { erro: 'informe a validade da proposta (data)' };
  }
  if (d.validade < hoje()) return { erro: 'a validade nao pode ser anterior a hoje' };
  return { dados: d };
}

module.exports = { hoje, validarProposta };
