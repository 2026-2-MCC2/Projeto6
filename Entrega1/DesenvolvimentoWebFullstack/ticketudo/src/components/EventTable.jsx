import { events } from '../data/platform'
import { formatCurrency } from '../utils/format'

export default function EventTable({ title, description }) {
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
          <span>Valor</span>
          <span>Status</span>
        </div>
        {events.map((event) => (
          <div className="table-row event-row" key={event.name}>
            <span className="event-name">
              <b className={`event-cover cover-${event.cover}`} />
              <strong>{event.name}</strong>
            </span>
            <span>{event.date}</span>
            <span>{event.city}</span>
            <span>{formatCurrency(event.revenue)}</span>
            <em className={event.status === 'Em alta' ? 'badge badge-hot' : 'badge'}>{event.status}</em>
          </div>
        ))}
      </div>
    </section>
  )
}
