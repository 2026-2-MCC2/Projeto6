// Calcula os dois precos do ingresso usando margem sobre a receita.
// A margem recebida aqui e uma fracao: 0.20 representa 20%.
function arredondarParaCima(valor) {
  return Number((Math.ceil((valor - Number.EPSILON) * 100) / 100).toFixed(2));
}

function calcularTicket({ custoTotal, publico, margem }) {
  const custo = Number(custoTotal);
  const pessoas = Number(publico);
  const fracao = Number(margem);

  if (!Number.isFinite(custo) || custo < 0) {
    throw new Error('o custo total precisa ser um numero maior ou igual a zero');
  }
  if (!Number.isFinite(pessoas) || pessoas <= 0) {
    throw new Error('o publico precisa ser maior que zero');
  }
  if (!Number.isFinite(fracao) || fracao < 0 || fracao >= 1) {
    throw new Error('a margem precisa ser maior ou igual a zero e menor que 1');
  }

  return {
    ticketEquilibrio: arredondarParaCima(custo / pessoas),
    ticketAlvo: arredondarParaCima(custo / (pessoas * (1 - fracao))),
  };
}

module.exports = { calcularTicket };
