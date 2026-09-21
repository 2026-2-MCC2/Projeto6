import PageHeading from '../../components/PageHeading'
import { events } from '../../data/platform'

export default function Overview({ page, profile, onNavigate }) {
  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title={page === 'events' ? 'Meus eventos' : `Olá, ${profile.name.split(' ')[0]}.`}
        description="Organize cada detalhe e faça acontecer."
      />

      <div className="banner banner-navy">
        <div>
          <small className="eyebrow">Seu próximo capítulo</small>
          <h3>Qual história você vai criar?</h3>
          <p>Você tem 2 eventos ativos e 3 pedidos aguardando resposta.</p>
        </div>
        <button className="btn-light" onClick={() => onNavigate('new')}>
          Criar evento →
        </button>
      </div>

      <div className="section-title">
        <h3>Seus eventos ativos</h3>
      </div>
      <div className="event-cards">
        {events.slice(0, 2).map((event) => (
          <article className="event-card" key={event.name}>
            <div className={`event-thumb cover-${event.cover}`}>
              <b>{event.day}</b>
            </div>
            <span>
              <em className="badge">Publicado</em>
              <h3>{event.name}</h3>
              <p>
                {event.city} · {event.suppliers} fornecedores
              </p>
              <progress value={event.progress} max="100" />
            </span>
          </article>
        ))}
      </div>
    </>
  )
}
