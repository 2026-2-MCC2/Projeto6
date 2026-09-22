import EmptyState from '../../components/EmptyState'
import PageHeading from '../../components/PageHeading'
import StatCard from '../../components/StatCard'
import StatusBadge from '../../components/StatusBadge'
import { formatCurrency } from '../../utils/format'
import { useApp } from '../../state/useApp'

export default function Contracts({ profile, onOpenPanel }) {
  const { state } = useApp()
  const active = state.contracts.filter((contract) => contract.status === 'Ativo')
  const retained = active.reduce((total, contract) => total + contract.value, 0)

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Meus contratos"
        description="Ordens de serviço fechadas na plataforma, com liquidação garantida em custódia."
      />

      <div className="stats">
        <StatCard label="Contratos ativos" value={active.length} note="em execução" icon="calendar" />
        <StatCard label="Retido em custódia" value={formatCurrency(retained)} note="liberação D+1 pós-evento" icon="wallet" />
        <StatCard label="Contratos concluídos" value={state.contracts.length - active.length} note="já liquidados" icon="check" />
      </div>

      {state.contracts.length === 0 ? (
        <EmptyState
          title="Nenhum contrato ainda"
          description="Responda uma solicitação com proposta. Quando a produtora aceitar, o contrato aparece aqui."
        />
      ) : (
        <section className="data-list">
          {state.contracts.map((contract) => (
            <div key={contract.id}>
              <span>
                <strong>{contract.event}</strong>
                <small>
                  {contract.organizer} · {contract.scope} · {contract.settlement}
                </small>
              </span>
              <span className="list-figure">{formatCurrency(contract.value)}</span>
              <StatusBadge status={contract.status} />
              <button className="btn-secondary" onClick={() => onOpenPanel('chat')}>
                Falar com organizador
              </button>
            </div>
          ))}
        </section>
      )}
    </>
  )
}
