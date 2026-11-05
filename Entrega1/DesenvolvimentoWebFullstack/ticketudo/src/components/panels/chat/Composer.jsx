import { useEffect, useRef, useState } from 'react'
import Icon from '../../Icon'
import { LIMITE } from './chatUtil'

// o texto que a pessoa comecou a escrever em cada conversa fica guardado
// enquanto o portal estiver aberto: trocar de conversa nao apaga o rascunho
const rascunhos = new Map()

// Caixa de escrever. Enter envia, Shift+Enter quebra a linha.
// A caixa cresce com o texto ate umas 5 linhas.
export default function Composer({ chave, onEnviar, placeholder = 'Escreva uma mensagem…' }) {
  const [texto, setTexto] = useState(() => rascunhos.get(chave) ?? '')
  const campo = useRef(null)

  // ajusta a altura ao texto
  useEffect(() => {
    const el = campo.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }, [texto])

  // abriu a conversa: o cursor ja fica na caixa (no celular nao, para o
  // teclado nao cobrir a conversa)
  useEffect(() => {
    if (window.matchMedia('(min-width: 720px)').matches) campo.current?.focus()
  }, [chave])

  const limpo = texto.trim()
  const passou = limpo.length > LIMITE
  const pode = limpo.length > 0 && !passou
  const perto = limpo.length > LIMITE - 200

  function mudar(valor) {
    setTexto(valor)
    if (valor) rascunhos.set(chave, valor)
    else rascunhos.delete(chave)
  }

  function enviar(e) {
    e?.preventDefault()
    if (!pode) return
    onEnviar(limpo)
    mudar('')
    campo.current?.focus()
  }

  function teclar(e) {
    // isComposing: acento sendo montado no teclado (nao e o Enter de enviar)
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) enviar(e)
  }

  return (
    <form className="chat-composer" onSubmit={enviar}>
      <label className="sr-only" htmlFor={`chat-texto-${chave}`}>
        Mensagem
      </label>
      <textarea
        id={`chat-texto-${chave}`}
        ref={campo}
        rows={1}
        value={texto}
        onChange={(e) => mudar(e.target.value)}
        onKeyDown={teclar}
        placeholder={placeholder}
        aria-describedby={`chat-dica-${chave}`}
      />
      <button type="submit" disabled={!pode} aria-label="Enviar mensagem">
        <Icon name="send" size={19} />
      </button>
      <small
        id={`chat-dica-${chave}`}
        className={passou ? 'chat-dica is-erro' : perto ? 'chat-dica' : 'chat-dica is-teclado'}
      >
        {perto
          ? `${limpo.length} de ${LIMITE} caracteres`
          : 'Enter envia · Shift+Enter quebra a linha'}
      </small>
    </form>
  )
}
