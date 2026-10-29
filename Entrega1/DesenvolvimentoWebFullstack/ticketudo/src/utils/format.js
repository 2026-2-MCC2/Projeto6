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
  aguardando_organizador: 'Aguardando credenciamento',
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

export function cnpj(valor) {
  const d = String(valor || '').replace(/\D/g, '')
  if (d.length !== 14) return valor || '—'
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

export function telefone(valor) {
  const d = String(valor || '').replace(/\D/g, '')
  if (d.length === 11) return d.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
  if (d.length === 10) return d.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')
  return valor || '—'
}

// "14/03/2027, 20:00 até 15/03/2027, 04:00" (ou só a hora final se for no mesmo dia)
export function periodo(inicio, fim) {
  if (!inicio) return '—'
  if (!fim) return dataHora(inicio)
  const a = new Date(inicio)
  const b = new Date(fim)
  const mesmoDia = a.toDateString() === b.toDateString()
  const hora = b.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${dataHora(inicio)} até ${mesmoDia ? hora : dataHora(fim)}`
}

export function numero(valor) {
  return Number(valor || 0).toLocaleString('pt-BR')
}
