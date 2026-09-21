import Icon from '../../components/Icon'
import PageHeading from '../../components/PageHeading'
import { reports } from '../../data/platform'

export default function Reports({ profile }) {
  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Denúncias"
        description="Acompanhe e resolva situações reportadas pela comunidade."
      />
      <section className="data-list">
        {reports.map((report) => (
          <div key={report.subject}>
            <b>
              <Icon name="alert" size={14} />
            </b>
            <span>
              <strong>{report.subject}</strong>
              <small>{report.origin}</small>
            </span>
            <em>{report.status}</em>
          </div>
        ))}
      </section>
    </>
  )
}
