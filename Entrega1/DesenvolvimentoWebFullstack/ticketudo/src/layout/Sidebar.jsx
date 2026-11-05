import { useEffect, useRef } from 'react'
import Avatar from '../components/Avatar'
import Icon from '../components/Icon'
import Logo from '../components/Logo'
import { useApp } from '../state/useApp'

export default function Sidebar({
  profile,
  page,
  aberto,
  onFechar,
  onNavigate,
  onOpenPanel,
  onSignOut,
  contadores,
  naoLidas = 0,
}) {
  const { state } = useApp()
  const { sessao } = state
  const fechar = useRef(null)

  // no celular, quando a gaveta abre o foco vai para o botao de fechar
  useEffect(() => {
    if (aberto) fechar.current?.focus()
  }, [aberto])

  return (
    <aside className={aberto ? 'sidebar is-aberta' : 'sidebar'} id="menu-portal" aria-label="Menu do portal">
      <div className="sidebar-topo">
        <Logo />
        <button className="sidebar-fechar" type="button" ref={fechar} onClick={onFechar}>
          Fechar
        </button>
      </div>

      <nav className="sidebar-menu" aria-labelledby="sidebar-portal">
        <small className="sidebar-portal" id="sidebar-portal">
          Portal do {profile.label.toLowerCase()}
        </small>

        {profile.menu.map((item) => {
          const badge = contadores?.[item.id] ?? 0
          const ativo = page === item.id

          return (
            <button
              className={ativo ? 'nav is-active' : 'nav'}
              aria-current={ativo ? 'page' : undefined}
              onClick={() => onNavigate(item.id)}
              key={item.id}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
              {badge > 0 ? (
                <em className="nav-badge">
                  {badge}
                  <span className="sr-only"> aguardando</span>
                </em>
              ) : null}
            </button>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="nav" onClick={() => onOpenPanel('chat')}>
          <Icon name="message" size={18} />
          Mensagens
          {naoLidas > 0 ? (
            <em className="nav-badge">
              {naoLidas > 99 ? '99+' : naoLidas}
              <span className="sr-only"> não lidas</span>
            </em>
          ) : null}
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
