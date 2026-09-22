import PageHeading from '../../components/PageHeading'
import { formatCurrency } from '../../utils/format'
import { useApp } from '../../state/useApp'

export default function Events({ profile, onNavigate }) {
  const { state } = useApp()

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Meus eventos"
        description="Cada evento mostra o lote vigente e o valor garantido em custódia."
      >
        <button className="btn-primary" onClick={() => onNavigate('new')}>
          Adicionar evento
        </button>
      </PageHeading>

      <div className="event-cards">
        {state.events.map((event) => (
          <article className="event-card is-wide" key={event.id}>
            <div className={`event-thumb cover-${event.cover}`}>
              <b>{event.day}</b>
            </div>
            <span>
              <em className="badge">{event.lot}</em>
              <h3>
                {event.name}
                {event.subtitle ? <small> — {event.subtitle}</small> : null}
              </h3>
              <p>
                {event.venue} · {event.city} · {event.capacity.toLocaleString('pt-BR')} pessoas
              </p>
              <progress value={event.sold} max="100" />
              <p className="custody-note">
                Custódia retida garantida: {formatCurrency(event.custody)} com liberação escalonada
                pós-evento.
              </p>
            </span>
            <span className="event-figures">
              <strong>{formatCurrency(event.revenue)}</strong>
              <small>bilheteria prevista</small>
            </span>
          </article>
        ))}
      </div>
    </>
  )
}
