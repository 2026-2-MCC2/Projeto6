import ChatPanel from './panels/ChatPanel'

const panels = {
  chat: { title: 'Mensagens', Body: ChatPanel },
}

export default function SidePanel({ type, onClose }) {
  const { title, Body } = panels[type] ?? panels.chat

  return (
    <div className="panel-overlay" onClick={onClose}>
      <aside className="panel" onClick={(event) => event.stopPropagation()}>
        <div className="panel-header">
          <div>
            <small className="eyebrow">Troca direta</small>
            <h2>{title}</h2>
          </div>
          <button onClick={onClose} aria-label="Fechar painel">
            ×
          </button>
        </div>
        <Body onClose={onClose} />
      </aside>
    </div>
  )
}
