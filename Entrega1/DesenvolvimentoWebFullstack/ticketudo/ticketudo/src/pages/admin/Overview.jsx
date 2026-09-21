import EventTable from '../../components/EventTable'
import PageHeading from '../../components/PageHeading'
import StatCard from '../../components/StatCard'
import { platformAccounts } from '../../data/platform'

export default function Overview({ profile }) {
  const firstName = profile.name.split(' ')[0]

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title={`Bom dia, ${firstName}.`}
        description="Veja a quantidade de clientes, fornecedores e organizadores cadastrados."
      />
      <div className="stats">
        {platformAccounts.map((account) => (
          <StatCard
            label={account.label}
            value={account.total}
            trend={account.trend}
            note="vs. mês anterior"
            key={account.label}
          />
        ))}
      </div>
      <EventTable title="Eventos ativos" description="Eventos organizados na plataforma" />
    </>
  )
}
