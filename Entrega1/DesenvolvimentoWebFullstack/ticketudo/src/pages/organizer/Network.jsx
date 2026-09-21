import PageHeading from '../../components/PageHeading'
import { partners } from '../../data/platform'

export default function Network({ profile, onOpenPanel }) {
  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Minha rede de fornecedores"
        description="Veja fornecedores para cada pedido do seu evento."
      />
      <div className="partner-grid">
        {partners.map((partner) => (
          <article className="partner-card" key={partner.name}>
            <div className={`partner-cover ${partner.cover}`} />
            <h3>{partner.name}</h3>
            <p>Parceiro verificado</p>
            <button className="btn-soft" onClick={() => onOpenPanel('chat')}>
              Mensagem
            </button>
          </article>
        ))}
      </div>
    </>
  )
}
