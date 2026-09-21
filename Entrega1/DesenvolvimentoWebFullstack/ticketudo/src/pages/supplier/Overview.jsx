import PageHeading from '../../components/PageHeading'
import { deliveries } from '../../data/platform'

export default function Overview({ page, profile, onOpenPanel }) {
  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title={page === 'events' ? 'Meus eventos' : `Olá, ${profile.name.split(' ')[0]}.`}
        description="Acompanhe seus eventos atuais, prazos e oportunidades."
      />

      <div className="banner banner-mint">
        <div>
          <small className="eyebrow">Seu movimento esta semana</small>
          <h3>Você está no caminho certo.</h3>
          <p>
            Seu perfil foi visualizado <b>38 vezes</b> e você recebeu 4 novos pedidos.
          </p>
        </div>
        <strong className="banner-stat">
          +24%
          <small>visualizações</small>
        </strong>
      </div>

      <div className="section-title">
        <h3>Eventos e entregas atuais</h3>
      </div>
      <section className="data-list">
        {deliveries.map((delivery) => (
          <div key={delivery.event}>
            <span>
              <strong>{delivery.event}</strong>
              <small>
                {delivery.service} · {delivery.deadline}
              </small>
            </span>
            <button className="btn-secondary" onClick={() => onOpenPanel('chat')}>
              Falar com organizador
            </button>
          </div>
        ))}
      </section>
    </>
  )
}
