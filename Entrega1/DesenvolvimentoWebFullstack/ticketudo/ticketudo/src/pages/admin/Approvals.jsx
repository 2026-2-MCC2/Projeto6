import PageHeading from '../../components/PageHeading'
import { pendingAccounts } from '../../data/platform'

export default function Approvals({ profile }) {
  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Aprovações pendentes"
        description="Aceite pedidos de cadastro de fornecedores e organizadores."
      />
      <section className="data-list">
        {pendingAccounts.map((account) => (
          <div key={account.name}>
            <span>
              <strong>{account.name}</strong>
              <small>{account.detail} · enviado há 3h</small>
            </span>
            <button className="btn-secondary">Ver cadastro</button>
            <button className="btn-approve">Aceitar</button>
          </div>
        ))}
      </section>
    </>
  )
}
