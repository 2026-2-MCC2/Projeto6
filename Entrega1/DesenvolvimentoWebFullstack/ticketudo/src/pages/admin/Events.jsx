import EventTable from '../../components/EventTable'
import PageHeading from '../../components/PageHeading'

export default function Events({ profile }) {
  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Eventos ativos"
        description="Acompanhe os eventos publicados pelos organizadores."
      />
      <EventTable title="Eventos ativos" description="Eventos organizados na plataforma" />
    </>
  )
}
