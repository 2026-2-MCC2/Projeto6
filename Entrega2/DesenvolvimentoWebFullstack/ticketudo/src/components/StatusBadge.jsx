const tones = {
  'Em análise': 'is-waiting',
  'Em cotação': 'is-waiting',
  Enviada: 'is-waiting',
  Selecionada: 'is-positive',
  'Não selecionada': 'is-neutral',
  Cancelada: 'is-negative',
  'Aguardando credenciamento': 'is-waiting',
  Pendente: 'is-waiting',
  'Proposta enviada': 'is-waiting',
  Aceita: 'is-positive',
  Aprovado: 'is-positive',
  Ativo: 'is-positive',
  Resolvida: 'is-positive',
  Concluído: 'is-neutral',
  Liberado: 'is-neutral',
  Recusada: 'is-negative',
  Alta: 'is-negative',
  Média: 'is-waiting',
}

export default function StatusBadge({ status }) {
  return <em className={`status ${tones[status] ?? 'is-neutral'}`}>{status}</em>
}
