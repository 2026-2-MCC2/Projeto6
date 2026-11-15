import { useEffect, useRef } from 'react'
import ChatPanel from './panels/ChatPanel'
import './SidePanel.css'

const panels = {
  chat: { title: 'Mensagens', Body: ChatPanel },
}

// Painel que abre pela direita. Esc ou um toque fora fecham; ao fechar, o
// foco volta para o botao que abriu.
export default function SidePanel({ type, opcoes, onClose, onMudou }) {
  const { title, Body } = panels[type] ?? panels.chat
  // o efeito abaixo roda uma vez so (abrir/fechar); o onClose atual fica na ref
  const fechar = useRef(onClose)
  useEffect(() => {
    fechar.current = onClose
  })

  useEffect(() => {
    const antes = document.activeElement
    function aoTeclar(evento) {
      if (evento.key === 'Escape') fechar.current()
    }
    document.addEventListener('keydown', aoTeclar)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = ''
      if (antes instanceof HTMLElement) antes.focus()
    }
  }, [])

  return (
    <div className="panel-overlay" onClick={onClose}>
      <aside
        className="panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-titulo"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="panel-header">
          <div>
            <small className="eyebrow">Troca direta</small>
            <h2 id="panel-titulo">{title}</h2>
          </div>
          <button onClick={onClose} aria-label="Fechar painel">
            ×
          </button>
        </div>
        <div className="panel-corpo">
          <Body onClose={onClose} opcoes={opcoes} onMudou={onMudou} />
        </div>
      </aside>
    </div>
  )
}
