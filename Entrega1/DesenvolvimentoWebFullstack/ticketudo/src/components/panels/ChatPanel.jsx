import { useState } from 'react'
import Avatar from '../Avatar'
import Icon from '../Icon'
import { conversation } from '../../data/platform'
import { useApp } from '../../state/useApp'

export default function ChatPanel() {
  const { state, dispatch } = useApp()
  const [draft, setDraft] = useState('')
  const { contact } = conversation

  function send(event) {
    event.preventDefault()

    if (draft.trim().length === 0) return

    dispatch({ type: 'message/send', text: draft.trim() })
    setDraft('')
  }

  return (
    <>
      <div className="panel-contact">
        <Avatar initials={contact.initials} />
        <span>
          <strong>{contact.name}</strong>
          <small>{contact.role}</small>
        </span>
      </div>
      <div className="panel-messages">
        {state.messages.map((message) => (
          <p className={message.mine ? 'is-mine' : undefined} key={message.id}>
            {message.text}
          </p>
        ))}
      </div>
      <form className="panel-composer" onSubmit={send}>
        <input
          id="chat-draft"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Escreva uma mensagem..."
        />
        <button type="submit" aria-label="Enviar mensagem">
          <Icon name="trend" size={16} />
        </button>
      </form>
    </>
  )
}
