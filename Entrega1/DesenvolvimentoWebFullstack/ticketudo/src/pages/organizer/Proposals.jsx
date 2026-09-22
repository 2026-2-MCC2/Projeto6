import { useState } from 'react'
import EmptyState from '../../components/EmptyState'
import PageHeading from '../../components/PageHeading'
import StatusBadge from '../../components/StatusBadge'
import Tabs from '../../components/Tabs'
import { formatCurrency } from '../../utils/format'
import { useApp } from '../../state/useApp'

export default function Proposals({ profile, onOpenPanel }) {
  const { state, dispatch } = useApp()
  const [filter, setFilter] = useState('Em análise')

  const visible = state.proposals.filter((proposal) => proposal.status === filter)

  const options = ['Em análise', 'Aceita', 'Recusada'].map((status) => ({
    id: status,
    label: status === 'Em análise' ? 'Em análise' : `${status}s`,
    count: state.proposals.filter((proposal) => proposal.status === status).length,
  }))

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Propostas recebidas"
        description="Ao aceitar, o contrato é aberto e o valor fica retido em custódia até a entrega."
      />

      <Tabs options={options} value={filter} onChange={setFilter} />

      {visible.length === 0 ? (
        <EmptyState
          title="Nada por aqui"
          description="Solicite orçamento na vitrine de fornecedores credenciados para receber propostas."
          icon="file"
        />
      ) : (
        <section className="data-list">
          {visible.map((proposal) => (
            <div key={proposal.id}>
              <span>
                <strong>{proposal.supplier}</strong>
                <small>
                  {proposal.event} · {proposal.scope} · {proposal.deadline}
                </small>
              </span>
              <span className="list-figure">{formatCurrency(proposal.value)}</span>
              <StatusBadge status={proposal.status} />
              {proposal.status === 'Em análise' ? (
                <>
                  <button
                    className="btn-secondary"
                    onClick={() => dispatch({ type: 'proposal/decide', id: proposal.id, accepted: false })}
                  >
                    Recusar
                  </button>
                  <button
                    className="btn-approve"
                    onClick={() => dispatch({ type: 'proposal/decide', id: proposal.id, accepted: true })}
                  >
                    Aceitar
                  </button>
                </>
              ) : (
                <button className="btn-secondary" onClick={() => onOpenPanel('chat')}>
                  Conversar
                </button>
              )}
            </div>
          ))}
        </section>
      )}
    </>
  )
}
