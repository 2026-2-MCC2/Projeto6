import PageHeading from '../../components/PageHeading'
import { sentProposals } from '../../data/platform'

export default function Proposals({ profile, onNavigate }) {
  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Minhas propostas"
        description="Acompanhe propostas enviadas e seus prazos de entrega."
      >
        <button className="btn-primary" onClick={() => onNavigate('proposal-new')}>
          Criar proposta
        </button>
      </PageHeading>
      <section className="data-list">
        {sentProposals.map((proposal) => (
          <div key={proposal.event}>
            <span>
              <strong>{proposal.event}</strong>
              <small>
                {proposal.service} · {proposal.deadline}
              </small>
            </span>
            <em>{proposal.status}</em>
            <button className="btn-secondary">Gerenciar</button>
          </div>
        ))}
      </section>
    </>
  )
}
