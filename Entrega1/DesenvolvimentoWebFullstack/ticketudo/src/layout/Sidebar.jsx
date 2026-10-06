import Avatar from '../components/Avatar'
import Icon from '../components/Icon'
import Logo from '../components/Logo'
import { useApp } from '../state/useApp'

export default function Sidebar({ profile, page, onNavigate, onOpenPanel, onSignOut, contadores }) {
  const { state } = useApp()
  const { sessao } = state

  return (
    <aside className="sidebar">
      <Logo />
      <hr />
      <small className="eyebrow">Workspace</small>

      {profile.menu.map((item) => {
        const badge = contadores?.[item.id] ?? 0

        return (
          <button
            className={page === item.id ? 'nav is-active' : 'nav'}
            onClick={() => onNavigate(item.id)}
            key={item.id}
          >
            <Icon name={item.icon} size={18} />
            {item.label}
            {badge > 0 ? <em className="nav-badge">{badge}</em> : null}
          </button>
        )
      })}

      <div className="sidebar-footer">
        <button className="nav" onClick={() => onOpenPanel('chat')}>
          <Icon name="message" size={18} />
          Mensagens
        </button>
        <button className="nav nav-logout" onClick={onSignOut}>
          <Icon name="logout" size={18} />
          Sair do portal
        </button>

        <div className="sidebar-user">
          <Avatar initials={sessao.iniciais} small />
          <span>
            <strong>{sessao.nome}</strong>
            <small>{profile.label}</small>
          </span>
        </div>
      </div>
    </aside>
  )
}
