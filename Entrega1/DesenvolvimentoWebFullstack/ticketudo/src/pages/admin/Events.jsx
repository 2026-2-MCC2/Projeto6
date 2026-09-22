import EventTable from '../../components/EventTable'
import PageHeading from '../../components/PageHeading'
import StatCard from '../../components/StatCard'
import { formatCurrency } from '../../utils/format'
import { useApp } from '../../state/useApp'

export default function Events({ profile }) {
  const { state } = useApp()
  const capacity = state.events.reduce((total, event) => total + event.capacity, 0)
  const moved = state.events.reduce((total, event) => total + event.revenue, 0)

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Eventos ativos"
        description="Lotes, custódia e integridade antifraude dos eventos publicados pelas produtoras."
      />

      <div className="stats">
        <StatCard label="Eventos na plataforma" value={state.events.length} note="com lote vigente" icon="calendar" />
        <StatCard label="Capacidade somada" value={capacity.toLocaleString('pt-BR')} note="ingressos homologados" />
        <StatCard label="Volume movimentado" value={formatCurrency(moved)} note="bilheteria oficial" icon="wallet" />
      </div>

      <EventTable title="Eventos publicados" description="Acompanhe o lote vigente de cada produtora" />

      <div className="section-title">
        <h3>Situação dos lotes</h3>
      </div>
      <section className="data-list">
        {state.events.map((event) => (
          <div key={event.id}>
            <span>
              <strong>{event.name}</strong>
              <small>
                {event.lot} · {event.venue} · {event.sold}% vendido
              </small>
            </span>
            <span className="list-figure">{formatCurrency(event.custody)}</span>
            <button className="btn-secondary">Auditar</button>
          </div>
        ))}
      </section>
    </>
  )
}
