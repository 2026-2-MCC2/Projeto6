import PageHeading from '../../components/PageHeading'
import { receivedProposals } from '../../data/platform'

export default function Proposals({ profile, onOpenPanel }) {
  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Propostas recebidas"
        description="Gerencie as propostas dos fornecedores para seus eventos."
      />
      <section className="data-list">
        {receivedProposals.map((proposal) => (
          <div key={proposal.supplier}>
            <span>
              <strong>{proposal.supplier}</strong>
              <small>
                {proposal.service} · {proposal.value}
              </small>
            </span>
            <em>{proposal.status}</em>
            <button className="btn-approve">Aceitar</button>
            <button className="btn-secondary" onClick={() => onOpenPanel('chat')}>
              Conversar
            </button>
          </div>
        ))}
      </section>
    </>
  )
}
