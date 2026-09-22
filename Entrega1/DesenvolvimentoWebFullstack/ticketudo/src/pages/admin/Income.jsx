import PageHeading from '../../components/PageHeading'
import StatCard from '../../components/StatCard'
import { incomeBreakdown } from '../../data/platform'
import { formatCurrency } from '../../utils/format'
import { useApp } from '../../state/useApp'

const PLATFORM_FEE = 0.01

export default function Income({ profile }) {
  const { state } = useApp()
  const total = incomeBreakdown.reduce((sum, item) => sum + item.value, 0)
  const moved = state.events.reduce((sum, event) => sum + event.revenue, 0)

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Renda da plataforma"
        description="A cobrança acontece apenas sobre transações concluídas, com repasse liquidado em D+1."
      />

      <div className="stats">
        <StatCard label="Receita acumulada" value={formatCurrency(total)} trend="+14,6%" note="este mês" />
        <StatCard
          label="Movimentado pelos eventos"
          value={formatCurrency(moved)}
          note={`${state.events.length} eventos ativos`}
        />
        <StatCard
          label="Taxa da plataforma"
          value={formatCurrency(moved * PLATFORM_FEE)}
          note="1% sobre o valor movimentado"
          icon="wallet"
        />
      </div>

      <div className="section-title">
        <h3>De onde vem a receita</h3>
      </div>
      <div className="breakdown-grid">
        {incomeBreakdown.map((item) => (
          <article key={item.id}>
            <small className="eyebrow">{item.label}</small>
            <strong>{formatCurrency(item.value)}</strong>
            <p>{item.note}</p>
          </article>
        ))}
      </div>

      <section className="card table-card">
        <div className="card-head">
          <div>
            <h3>Receita por evento</h3>
            <p>O cálculo de 1% sobre cada evento publicado</p>
          </div>
        </div>
        <div className="data-table">
          <div className="table-row table-head fee-row">
            <span>Evento</span>
            <span>Movimentado</span>
            <span>Taxa</span>
            <span>Receita</span>
          </div>
          {state.events.map((event) => (
            <div className="table-row fee-row" key={event.id}>
              <span>
                <strong>{event.name}</strong>
              </span>
              <span>{formatCurrency(event.revenue)}</span>
              <span>1%</span>
              <strong>{formatCurrency(event.revenue * PLATFORM_FEE)}</strong>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
