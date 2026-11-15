import Icon from './Icon'

export default function EmptyState({ title, description, icon = 'check' }) {
  return (
    <div className="empty-state">
      <b>
        <Icon name={icon} size={16} />
      </b>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}
