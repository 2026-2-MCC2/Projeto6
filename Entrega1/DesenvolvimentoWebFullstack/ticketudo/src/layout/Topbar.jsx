import Avatar from '../components/Avatar'
import Icon from '../components/Icon'
import Logo from '../components/Logo'

export default function Topbar({ profile, onOpenPanel }) {
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
        </button>
        <Avatar initials={profile.initials} />
      </div>
    </header>
  )
}
