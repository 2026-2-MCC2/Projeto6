import Avatar from '../components/Avatar'
import Icon from '../components/Icon'
import Logo from '../components/Logo'
import { useApp } from '../state/useApp'

export default function Topbar({ profile, onOpenPanel }) {
  const { state } = useApp()
  const { sessao } = state

  return (
    <header className="topbar">
      <div className="mobile-logo">
        <Logo />
      </div>
      <div className="topbar-actions">
        <button aria-label="Mensagens" onClick={() => onOpenPanel('chat')}>
          <Icon name="message" size={19} />
        </button>
        <span className="topbar-user">
          <Avatar initials={sessao.iniciais} />
          <span>
            <strong>{sessao.nome}</strong>
            <small>{profile.label}</small>
          </span>
        </span>
      </div>
    </header>
  )
}
