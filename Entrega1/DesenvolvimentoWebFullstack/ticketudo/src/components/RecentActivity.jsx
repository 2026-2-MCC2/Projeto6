import Icon from './Icon'
import { recentActivity } from '../data/platform'

export default function RecentActivity() {
  return (
    <section className="card activity-card">
      <h3>Atividade recente</h3>
      <p>Últimas atualizações</p>
      {recentActivity.map((item) => (
        <div className="activity-row" key={item.title}>
          <b>
            <Icon name={item.icon} size={13} />
          </b>
          <span>
            <strong>{item.title}</strong>
            <small>{item.detail}</small>
          </span>
          <i>há 2 h</i>
        </div>
      ))}
    </section>
  )
}
