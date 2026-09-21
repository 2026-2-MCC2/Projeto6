import Avatar from '../Avatar'
import { conversation } from '../../data/platform'

export default function ChatPanel() {
  const { contact, messages } = conversation

  return (
    <>
      <div className="panel-contact">
        <Avatar initials={contact.initials} />
        <span>
          <strong>{contact.name}</strong>
          <small>{contact.status}</small>
        </span>
      </div>
      <div className="panel-messages">
        {messages.map((message) => (
          <p className={message.mine ? 'is-mine' : undefined} key={message.text}>
            {message.text}
          </p>
        ))}
      </div>
      <input className="panel-composer" placeholder="Escreva uma mensagem..." />
    </>
  )
}
