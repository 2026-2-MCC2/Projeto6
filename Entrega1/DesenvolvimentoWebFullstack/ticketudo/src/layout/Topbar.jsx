import { useEffect, useRef } from 'react'
import Avatar from '../components/Avatar'
import Icon from '../components/Icon'
import Logo from '../components/Logo'
import { useApp } from '../state/useApp'

export default function Topbar({ profile, menuAberto, naoLidas = 0, onAbrirMenu, onOpenPanel }) {
  const { state } = useApp()
  const { sessao } = state
  const botaoMenu = useRef(null)
  const estavaAberto = useRef(false)

  // quando a gaveta fecha, o foco volta para o botao que abriu
  useEffect(() => {
    if (estavaAberto.current && !menuAberto) botaoMenu.current?.focus()
    estavaAberto.current = menuAberto
  }, [menuAberto])

  return (
    <header className="topbar">
      <div className="mobile-logo">
        <Logo />
      </div>
      <div className="topbar-actions">
        <button
          className="topbar-mensagens"
          aria-label={naoLidas > 0 ? `Mensagens, ${naoLidas} não lidas` : 'Mensagens'}
          onClick={() => onOpenPanel('chat')}
        >
          <Icon name="message" size={19} />
          {naoLidas > 0 ? (
            <em className="topbar-badge" aria-hidden="true">
              {naoLidas > 99 ? '99+' : naoLidas}
            </em>
          ) : null}
        </button>
        <span className="topbar-user">
          <Avatar initials={sessao.iniciais} />
          <span>
            <strong>{sessao.nome}</strong>
            <small>{profile.label}</small>
          </span>
        </span>
        <button
          className="topbar-menu"
          type="button"
          ref={botaoMenu}
          aria-expanded={menuAberto}
          aria-controls="menu-portal"
          onClick={onAbrirMenu}
        >
          Menu
        </button>
      </div>
    </header>
  )
}
