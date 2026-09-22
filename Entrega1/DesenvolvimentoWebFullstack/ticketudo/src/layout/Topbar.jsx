import Avatar from '../components/Avatar'
import Icon from '../components/Icon'
import Logo from '../components/Logo'
import { useApp } from '../state/useApp'

export default function Topbar({ profile, onOpenPanel }) {
  const { state } = useApp()
  const { session } = state
  const pending = state.credentialRequests.length + state.proposals.filter((item) => item.status === 'Em análise').length

  return (
    <header className="topbar">
      <div className="mobile-logo">
        <Logo />
      </div>
      <div className="topbar-actions">
        <button aria-label="Buscar">
          <Icon name="search" size={19} />
        </button>
        <button aria-label="Notificações" onClick={() => onOpenPanel('notifications')}>
          <Icon name="bell" size={19} />
          {pending > 0 ? <i className="topbar-dot" /> : null}
        </button>
        <span className="topbar-user">
          <Avatar initials={session.initials} />
          <span>
            <strong>{session.name}</strong>
            <small>{profile.label}</small>
          </span>
        </span>
      </div>
    </header>
  )
}
