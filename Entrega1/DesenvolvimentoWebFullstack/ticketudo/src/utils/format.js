const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

const brlExato = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatCurrency(valor) {
  return brl.format(Number(valor) || 0)
}

export function moeda(valor) {
  return brlExato.format(Number(valor) || 0)
}

export function dataHora(valor) {
  if (!valor) return '—'
  return new Date(valor).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function soData(valor) {
  if (!valor) return '—'
  return new Date(valor).toLocaleDateString('pt-BR')
}

// o banco guarda em snake_case; a tela mostra em gente
const ROTULOS = {
  rascunho: 'Rascunho',
  em_analise: 'Em análise',
  aprovado: 'Aprovado',
  recusado: 'Recusada',
  aceita: 'Aceita',
  recusada: 'Recusada',
  nao_solicitado: 'Pendente',
  credenciado: 'Aprovado',
  disponivel: 'Disponível',
  vendido: 'Concluído',
  a_venda: 'Em análise',
}

export function rotulo(status) {
  return ROTULOS[status] ?? status
}
