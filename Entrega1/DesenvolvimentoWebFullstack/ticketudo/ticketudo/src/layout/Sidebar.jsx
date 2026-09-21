import Avatar from '../components/Avatar'
import Icon from '../components/Icon'
import Logo from '../components/Logo'

export default function Sidebar({ profile, page, onNavigate, onOpenPanel, onLogout }) {
  return (
    <aside className="sidebar">
      <Logo />
      <hr />
      <small className="eyebrow">Workspace</small>

      {profile.menu.map((item) => (
        <button
          className={page === item.id ? 'nav is-active' : 'nav'}
          onClick={() => onNavigate(item.id)}
          key={item.id}
        >
          <Icon name={item.icon} size={18} />
          {item.label}
          {item.badge && <em className="nav-badge">{item.badge}</em>}
        </button>
      ))}

      <div className="sidebar-footer">
        <button className="nav" onClick={() => onOpenPanel('report')}>
          <Icon name="flag" size={18} />
          Denunciar
        </button>
        <button className="nav" onClick={() => onOpenPanel('add-contact')}>
          <Icon name="plus" size={18} />
          Adicionar contato
        </button>
        <button className="nav" onClick={() => onOpenPanel('chat')}>
          <Icon name="message" size={18} />
          Mensagens
          <i className="nav-dot" />
        </button>
        <button className="nav nav-logout" onClick={onLogout}>
          <Icon name="logout" size={18} />
          Voltar ao login
        </button>

        <div className="sidebar-user">
          <Avatar initials={profile.initials} small />
          <span>
            <strong>{profile.name}</strong>
            <small>{profile.label}</small>
          </span>
        </div>
      </div>
    </aside>
  )
}
