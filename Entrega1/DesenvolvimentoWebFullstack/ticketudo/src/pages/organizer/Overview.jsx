import PageHeading from '../../components/PageHeading'
import StatCard from '../../components/StatCard'
import { formatCurrency } from '../../utils/format'
import { useApp } from '../../state/useApp'

export default function Overview({ profile, onNavigate }) {
  const { state } = useApp()
  const firstName = state.session.name.split(' ')[0]
  const pending = state.proposals.filter((item) => item.status === 'Em análise')
  const custody = state.events.reduce((total, event) => total + event.custody, 0)

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title={`Olá, ${firstName}.`}
        description="Organize cada detalhe e faça acontecer."
      />

      <div className="banner banner-navy">
        <div>
          <small className="eyebrow">Seu próximo capítulo</small>
          <h3>Qual história você vai criar?</h3>
          <p>
            Você tem {state.events.length} eventos ativos e {pending.length} propostas aguardando resposta.
          </p>
        </div>
        <button className="btn-light" onClick={() => onNavigate('new')}>
          Adicionar evento →
        </button>
      </div>

      <div className="stats">
        <StatCard label="Retido em custódia" value={formatCurrency(custody)} note="liberação escalonada pós-evento" icon="wallet" />
        <StatCard label="Propostas em análise" value={pending.length} note="aguardando sua decisão" icon="file" />
        <StatCard label="Eventos publicados" value={state.events.length} note="com lote vigente" icon="calendar" />
      </div>

      <div className="section-title">
        <h3>Seus eventos ativos</h3>
        <button className="btn-link" onClick={() => onNavigate('events')}>
          Ver todos →
        </button>
      </div>
      <div className="event-cards">
        {state.events.slice(0, 2).map((event) => (
          <article className="event-card" key={event.id}>
            <div className={`event-thumb cover-${event.cover}`}>
              <b>{event.day}</b>
            </div>
            <span>
              <em className="badge">{event.lot}</em>
              <h3>{event.name}</h3>
              <p>
                {event.city} · {event.sold}% vendido
              </p>
              <progress value={event.sold} max="100" />
            </span>
          </article>
        ))}
      </div>

      {pending.length > 0 ? (
        <>
          <div className="section-title">
            <h3>O que precisa de atenção</h3>
            <button className="btn-link" onClick={() => onNavigate('proposals')}>
              Abrir propostas →
            </button>
          </div>
          <section className="data-list">
            {pending.slice(0, 3).map((proposal) => (
              <div key={proposal.id}>
                <span>
                  <strong>{proposal.supplier}</strong>
                  <small>
                    {proposal.event} · {proposal.scope}
                  </small>
                </span>
                <span className="list-figure">{formatCurrency(proposal.value)}</span>
                <button className="btn-secondary" onClick={() => onNavigate('proposals')}>
                  Revisar
                </button>
              </div>
            ))}
          </section>
        </>
      ) : null}
    </>
  )
}
