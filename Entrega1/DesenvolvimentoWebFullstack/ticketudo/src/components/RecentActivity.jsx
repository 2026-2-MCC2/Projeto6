import Icon from './Icon'
import { useApp } from '../state/useApp'

export default function RecentActivity() {
  const { state } = useApp()

  return (
    <section className="card activity-card">
      <h3>Atividade recente</h3>
      <p>Últimas movimentações da plataforma</p>
      {state.activity.map((item) => (
        <div className="activity-row" key={item.id}>
          <b>
            <Icon name={item.icon} size={13} />
          </b>
          <span>
            <strong>{item.title}</strong>
            <small>{item.detail}</small>
          </span>
          <i>{item.time}</i>
        </div>
      ))}
    </section>
  )
}
