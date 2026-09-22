import PageHeading from '../../components/PageHeading'
import StatCard from '../../components/StatCard'
import StatusBadge from '../../components/StatusBadge'
import { formatCurrency } from '../../utils/format'
import { useApp } from '../../state/useApp'

export default function Overview({ profile, onNavigate }) {
  const { state } = useApp()
  const firstName = state.session.name.split(' ')[0]
  const waiting = state.serviceRequests.filter((request) => request.status === 'Em análise')
  const active = state.contracts.filter((contract) => contract.status === 'Ativo')
  const retained = active.reduce((total, contract) => total + contract.value, 0)

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title={`Olá, ${firstName}.`}
        description="Acompanhe solicitações, contratos em execução e prazos de liquidação."
      />

      <div className="banner banner-mint">
        <div>
          <small className="eyebrow">Seu movimento esta semana</small>
          <h3>Você está no caminho certo.</h3>
          <p>
            {waiting.length} solicitações aguardando proposta e {active.length} contratos em execução.
          </p>
        </div>
        <strong className="banner-stat">
          {formatCurrency(retained)}
          <small>retido em custódia</small>
        </strong>
      </div>

      <div className="stats">
        <StatCard label="Solicitações abertas" value={waiting.length} note="aguardando sua proposta" icon="file" />
        <StatCard label="Contratos ativos" value={active.length} note="em execução" icon="calendar" />
        <StatCard label="Homologação" value={`${state.homologationDocs.filter((doc) => doc.status === 'Aprovado').length}/${state.homologationDocs.length}`} note="documentos aprovados" icon="shield" />
      </div>

      <div className="section-title">
        <h3>Solicitações recentes</h3>
        <button className="btn-link" onClick={() => onNavigate('requests')}>
          Ver todas →
        </button>
      </div>
      <section className="data-list">
        {state.serviceRequests.slice(0, 3).map((request) => (
          <div key={request.id}>
            <span>
              <strong>{request.event}</strong>
              <small>
                {request.organizer} · {request.scope} · {request.audience}
              </small>
            </span>
            <StatusBadge status={request.status} />
            <button className="btn-secondary" onClick={() => onNavigate('requests')}>
              Responder
            </button>
          </div>
        ))}
      </section>
    </>
  )
}
