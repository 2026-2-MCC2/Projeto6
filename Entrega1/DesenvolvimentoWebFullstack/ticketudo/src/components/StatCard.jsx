import Icon from './Icon'

export default function StatCard({ label, value, trend, note, icon = 'trend', down }) {
  return (
    <article className="stat">
      <span className="stat-label">
        {label}
        <b>
          <Icon name={icon} size={14} />
        </b>
      </span>
      <strong className="stat-value">{value}</strong>
      <small className={down ? 'stat-trend is-down' : 'stat-trend'}>
        {trend && `${trend} `}
        <i>{note}</i>
      </small>
    </article>
  )
}
