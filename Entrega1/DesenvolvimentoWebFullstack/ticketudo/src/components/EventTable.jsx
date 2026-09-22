import StatusBadge from './StatusBadge'
import { formatCurrency } from '../utils/format'
import { useApp } from '../state/useApp'

export default function EventTable({ title, description }) {
  const { state } = useApp()

  return (
    <section className="card table-card">
      <div className="card-head">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
      <div className="data-table">
        <div className="table-row table-head event-row">
          <span>Evento</span>
          <span>Data</span>
          <span>Local</span>
          <span>Em custódia</span>
          <span>Lote</span>
        </div>
        {state.events.map((event) => (
          <div className="table-row event-row" key={event.id}>
            <span className="event-name">
              <b className={`event-cover cover-${event.cover}`} />
              <span>
                <strong>{event.name}</strong>
                <small>{event.category}</small>
              </span>
            </span>
            <span>{event.date}</span>
            <span>{event.city}</span>
            <span>{formatCurrency(event.custody)}</span>
            <StatusBadge status={event.status === 'Lotes fechados' ? 'Concluído' : 'Ativo'} />
          </div>
        ))}
      </div>
    </section>
  )
}
