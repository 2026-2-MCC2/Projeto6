import { useEffect, useRef, useState } from 'react'
import Carregando from '../Carregando'
import Field from '../Field'
import { chats } from '../../api'
import { useRecurso } from '../../hooks/useRecurso'
import { dataHora, rotulo } from '../../utils/format'
import { useApp } from '../../state/useApp'

// o administrador consegue chamar qualquer usuario no chat
function NovaConversa({ aoAbrir, onCancelar }) {
  const [busca, setBusca] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [escolhido, setEscolhido] = useState(null)
  const [erro, setErro] = useState(null)
  const pessoas = useRecurso(() => chats.usuarios(busca), busca)

  async function abrir(e) {
    e.preventDefault()
    setErro(null)
    try {
      const r = await chats.abrir({
        id_usuario: escolhido.id_usuario,
        mensagem: mensagem || undefined,
      })
      aoAbrir(r.id_chat)
    } catch (err) {
      setErro(err.message)
    }
  }

  return (
    <form className="nova-conversa" onSubmit={abrir}>
      {erro ? <p className="form-erro">{erro}</p> : null}

      <Field label="Com quem você quer falar">
        <input
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value)
            setEscolhido(null)
          }}
          placeholder="Busque por nome ou e-mail"
        />
      </Field>

      {pessoas.carregando ? (
        <Carregando />
      ) : (
        <div className="pessoa-lista">
          {(pessoas.dados || []).map((u) => (
            <button
              type="button"
              className={escolhido?.id_usuario === u.id_usuario ? 'is-selected' : undefined}
              onClick={() => setEscolhido(u)}
              key={u.id_usuario}
            >
              <strong>{u.nome}</strong>
              <small>
                {u.tipo} · {u.email}
              </small>
            </button>
          ))}
        </div>
      )}

      {escolhido ? (
        <Field label={`Primeira mensagem para ${escolhido.nome}`}>
          <textarea rows={2} value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
        </Field>
      ) : null}

      <div className="request-actions">
        <button className="btn-secondary" type="button" onClick={onCancelar}>
          Cancelar
        </button>
        <button className="btn-primary" type="submit" disabled={!escolhido}>
          Abrir conversa
        </button>
      </div>
    </form>
  )
}

export default function ChatPanel() {
  const { state } = useApp()
  const lista = useRecurso(() => chats.lista())
  const [novaConversa, setNovaConversa] = useState(false)
  const [escolhido, setEscolhido] = useState(null)
  const [mensagens, setMensagens] = useState([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const fim = useRef(null)

  // sem efeito pra isso: a conversa aberta e a escolhida, ou a primeira da lista
  const ativo = escolhido ?? lista.dados?.[0] ?? null
  const idChat = ativo?.id_chat

  useEffect(() => {
    if (!idChat) return undefined
    let vivo = true

    chats
      .mensagens(idChat)
      .then((lidas) => {
        if (vivo) setMensagens(lidas)
      })
      .catch(() => {
        if (vivo) setMensagens([])
      })

    return () => {
      vivo = false
    }
  }, [idChat])

  useEffect(() => {
    fim.current?.scrollIntoView({ block: 'end' })
  }, [mensagens])

  async function enviar(e) {
    e.preventDefault()
    if (!texto.trim() || !ativo) return

    setEnviando(true)
    try {
      await chats.enviar(idChat, texto.trim())
      setMensagens(await chats.mensagens(idChat))
      setTexto('')
    } finally {
      setEnviando(false)
    }
  }

  if (lista.carregando || lista.erro) {
    return <Carregando erro={lista.erro} aoTentarDeNovo={lista.recarregar} />
  }

  const ehAdm = state.sessao.tipo === 'adm'

  if (novaConversa) {
    return (
      <NovaConversa
        onCancelar={() => setNovaConversa(false)}
        aoAbrir={(id) => {
          setNovaConversa(false)
          lista.recarregar()
          setEscolhido({ id_chat: id })
        }}
      />
    )
  }

  if (lista.dados.length === 0) {
    return (
      <div className="panel-vazio">
        <strong>Nenhuma conversa ainda</strong>
        <p>O chat abre sozinho quando um organizador solicita um serviço.</p>
        {ehAdm ? (
          <button className="btn-primary" onClick={() => setNovaConversa(true)}>
            Falar com alguém
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <>
      <div className="panel-conversas">
        {ehAdm ? (
          <button className="btn-secondary" onClick={() => setNovaConversa(true)}>
            Falar com alguém
          </button>
        ) : null}

        {lista.dados.map((chat) => (
          <button
            className={ativo?.id_chat === chat.id_chat ? 'is-selected' : undefined}
            onClick={() => setEscolhido(chat)}
            key={chat.id_chat}
          >
            <strong>{chat.evento || chat.assunto || chat.com_quem}</strong>
            <small>
              {chat.servico ? `${chat.servico} · ${rotulo(chat.status)}` : `com ${chat.com_quem}`}
            </small>
          </button>
        ))}
      </div>

      <div className="panel-messages">
        {mensagens.map((m) => (
          <p className={m.id_remetente === state.sessao.id ? 'is-mine' : undefined} key={m.id_mensagem}>
            <b>{m.remetente}</b>
            {m.texto_mensagem}
            <i>{dataHora(m.criado_em)}</i>
          </p>
        ))}
        <span ref={fim} />
      </div>

      <form className="panel-composer" onSubmit={enviar}>
        <input
          id="chat-draft"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva uma mensagem…"
        />
        <button type="submit" disabled={enviando || !texto.trim()}>
          Enviar
        </button>
      </form>
    </>
  )
}
