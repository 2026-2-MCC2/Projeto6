import EventTable from '../../components/EventTable'
import PageHeading from '../../components/PageHeading'
import RecentActivity from '../../components/RecentActivity'
import StatCard from '../../components/StatCard'
import { platformStats } from '../../data/platform'
import { formatCurrency } from '../../utils/format'
import { useApp } from '../../state/useApp'

export default function Overview({ profile, onNavigate }) {
  const { state } = useApp()
  const firstName = state.session.name.split(' ')[0]
  const custody = state.events.reduce((total, event) => total + event.custody, 0)
  const openReports = state.reports.filter((item) => item.status === 'Em análise').length

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title={`Bom dia, ${firstName}.`}
        description="Acompanhe custódia, credenciamentos e disputas abertas na plataforma."
      />
      <div className="stats">
        <StatCard
          label="Volume em custódia"
          value={formatCurrency(custody)}
          note={`${state.events.length} eventos ativos`}
          icon="wallet"
        />
        <StatCard
          label="Requisições de cadastro"
          value={state.credentialRequests.length}
          note="aguardando auditoria"
          icon="check"
        />
        <StatCard
          label="Denúncias abertas"
          value={openReports}
          note={`${platformStats.validated}% dos ingressos validados`}
          icon="flag"
        />
      </div>
      <div className="split-columns">
        <EventTable title="Eventos ativos" description="Eventos publicados pelas produtoras" />
        <RecentActivity />
      </div>
      <div className="section-title">
        <h3>Fila de auditoria</h3>
        <button className="btn-link" onClick={() => onNavigate('requests')}>
          Abrir requisições →
        </button>
      </div>
      <section className="data-list">
        {state.credentialRequests.slice(0, 3).map((request) => (
          <div key={request.id}>
            <span>
              <strong>{request.company}</strong>
              <small>
                {request.kind} · {request.document} · protocolo {request.protocol}
              </small>
            </span>
            <button className="btn-secondary" onClick={() => onNavigate('requests')}>
              Analisar
            </button>
          </div>
        ))}
      </section>
    </>
  )
}
