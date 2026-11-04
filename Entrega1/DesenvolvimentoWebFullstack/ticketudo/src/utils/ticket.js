// Mesma conta do backend (backend/regras/ticket.js), para a calculadora
// da pagina inicial mostrar o mesmo valor que a plataforma calcula.
// A margem e uma fracao: 0.20 representa 20% sobre a receita.
function arredondarParaCima(valor) {
  return Number((Math.ceil((valor - Number.EPSILON) * 100) / 100).toFixed(2))
}

// devolve null quando algum numero nao serve para a conta
export function calcularTicket({ custoTotal, publico, margem }) {
  const custo = Number(custoTotal)
  const pessoas = Number(publico)
  const fracao = Number(margem)

  if (!Number.isFinite(custo) || custo < 0) return null
  if (!Number.isFinite(pessoas) || pessoas <= 0) return null
  if (!Number.isFinite(fracao) || fracao < 0 || fracao >= 1) return null

  return {
    ticketEquilibrio: arredondarParaCima(custo / pessoas),
    ticketAlvo: arredondarParaCima(custo / (pessoas * (1 - fracao))),
  }
}
