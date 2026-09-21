import ChatPanel from './panels/ChatPanel'
import MessageForm from './panels/MessageForm'
import NotificationsPanel from './panels/NotificationsPanel'

const panels = {
  chat: { title: 'Mensagens', Body: ChatPanel },
  notifications: { title: 'Notificações', Body: NotificationsPanel },
  report: { title: 'Nova denúncia', Body: MessageForm },
  'add-contact': { title: 'Adicionar contato', Body: MessageForm },
  contact: { title: 'Fale com a gente', Body: MessageForm },
}

export default function SidePanel({ type, onClose }) {
  const { title, Body } = panels[type] ?? panels.contact

  return (
    <div className="panel-overlay" onClick={onClose}>
      <aside className="panel" onClick={(event) => event.stopPropagation()}>
        <div className="panel-header">
          <div>
            <small className="eyebrow">Troca direta</small>
            <h2>{title}</h2>
          </div>
          <button onClick={onClose}>×</button>
        </div>
        <Body type={type} onClose={onClose} />
      </aside>
    </div>
  )
}
