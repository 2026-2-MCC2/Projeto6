import PageHeading from '../../components/PageHeading'
import StatCard from '../../components/StatCard'
import { events, incomeSummary } from '../../data/platform'
import { formatCurrency } from '../../utils/format'

const PLATFORM_FEE = 0.01

export default function Income({ profile }) {
  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Renda da plataforma"
        description="Seu lucro corresponde a 1% do valor movimentado nos eventos."
      />
      <div className="stats">
        {incomeSummary.map((item) => (
          <StatCard
            label={item.label}
            value={item.value}
            trend={item.trend}
            note={item.note}
            icon={item.icon}
            key={item.label}
          />
        ))}
      </div>
      <section className="card table-card">
        <div className="card-head">
          <div>
            <h3>Receita por evento</h3>
            <p>O cálculo de 1% sobre cada evento organizado</p>
          </div>
        </div>
        <div className="data-table">
          <div className="table-row table-head fee-row">
            <span>Evento</span>
            <span>Data</span>
            <span>Taxa</span>
            <span>Receita</span>
          </div>
          {events.map((event) => (
            <div className="table-row fee-row" key={event.name}>
              <span>
                <strong>{event.name}</strong>
              </span>
              <span>{event.date}</span>
              <span>1%</span>
              <strong>{formatCurrency(event.revenue * PLATFORM_FEE)}</strong>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
