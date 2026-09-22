import Avatar from '../components/Avatar'
import Icon from '../components/Icon'
import Logo from '../components/Logo'
import { useApp } from '../state/useApp'

function badgeFor(state, role, page) {
  if (role === 'admin' && page === 'requests') {
    return state.credentialRequests.length
  }

  if (role === 'supplier' && page === 'requests') {
    return state.serviceRequests.filter((item) => item.status === 'Em análise').length
  }

  if (role === 'organizer' && page === 'proposals') {
    return state.proposals.filter((item) => item.status === 'Em análise').length
  }

  return 0
}

export default function Sidebar({ profile, page, onNavigate, onOpenPanel, onSignOut }) {
  const { state } = useApp()
  const { session } = state

  return (
    <aside className="sidebar">
      <Logo />
      <hr />
      <small className="eyebrow">Workspace</small>

      {profile.menu.map((item) => {
        const badge = badgeFor(state, session.role, item.id)

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
        <button className="nav" onClick={() => onOpenPanel('report')}>
          <Icon name="flag" size={18} />
          Denunciar
        </button>
        <button className="nav" onClick={() => onOpenPanel('chat')}>
          <Icon name="message" size={18} />
          Mensagens
          <i className="nav-dot" />
        </button>
        <button className="nav nav-logout" onClick={onSignOut}>
          <Icon name="logout" size={18} />
          Sair do portal
        </button>

        <div className="sidebar-user">
          <Avatar initials={session.initials} small />
          <span>
            <strong>{session.name}</strong>
            <small>{profile.label}</small>
          </span>
        </div>
      </div>
    </aside>
  )
}
