import { useState } from 'react'
import Avatar from '../../Avatar'
import Icon from '../../Icon'
import { iniciais } from '../../../state/reducer'
import { contexto, quandoCurto, quemPodeConversar, sobrePessoa } from './chatUtil'

const normalizar = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

export default function ListaConversas({ conversas, eu, situacao, onAbrir, onFixar, onExcluir, onNova }) {
  const [busca, setBusca] = useState('')
  const [menuAberto, setMenuAberto] = useState(null)
  const [confirmando, setConfirmando] = useState(null)
  const [excluindo, setExcluindo] = useState(false)
  const termo = normalizar(busca.trim())
  const filtradas = termo
    ? conversas.filter((c) =>
        [c.com_quem, c.com_empresa, c.assunto, c.evento, c.servico, c.ultima_mensagem].some((v) =>
          normalizar(v).includes(termo),
        ),
      )
    : conversas
  const naoLidas = conversas.filter((c) => c.nao_lidas > 0).length

  return (
    <div className="chat-lista">
      <div className="chat-lista-topo">
        <button type="button" className="btn-primary" onClick={onNova}>
          <Icon name="plus" size={17} />
          Nova conversa
        </button>
        {conversas.length > 0 ? (
          <label className="chat-busca">
            <Icon name="search" size={17} />
            <span className="sr-only">Buscar nas conversas</span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar nas conversas"
            />
          </label>
        ) : null}
        {naoLidas > 0 ? (
          <small className="chat-lista-resumo">
            {naoLidas === 1 ? '1 conversa com mensagem nova' : `${naoLidas} conversas com mensagens novas`}
          </small>
        ) : null}
      </div>

      {conversas.length === 0 ? (
        <div className="chat-vazio">
          <strong>Nenhuma conversa ainda</strong>
          <p>{quemPodeConversar(eu.tipo, situacao)}</p>
        </div>
      ) : filtradas.length === 0 ? (
        <div className="chat-vazio">
          <strong>Nada encontrado</strong>
          <p>Nenhuma conversa com “{busca.trim()}”.</p>
        </div>
      ) : (
        <ul className="chat-itens">
          {filtradas.map((c) => {
            const nome = c.com_quem || 'Conversa'
            const sobre = contexto(c) || sobrePessoa({ tipo: c.com_tipo, empresa: c.com_empresa })
            const minha = c.ultimo_remetente === eu.id
            const novas = c.nao_lidas > 0
            return (
              <li key={c.id_chat} className="chat-item-linha-lista">
                <button
                  type="button"
                  className={novas ? 'chat-item is-nova' : 'chat-item'}
                  onClick={() => onAbrir(c)}
                >
                  <Avatar initials={iniciais(nome)} small />
                  <span className="chat-item-texto">
                    <span className="chat-item-linha">
                      <strong>{nome}</strong>
                      {c.fixada ? (
                        <span className="chat-item-fixada" title="Conversa fixada">
                          <Icon name="pin" size={14} />
                          <span className="sr-only">Conversa fixada</span>
                        </span>
                      ) : null}
                      <time>{quandoCurto(c.ultima_em || c.criado_em)}</time>
                    </span>
                    <small className="chat-item-sobre">{sobre}</small>
                    <span className="chat-item-linha">
                      <span className="chat-item-previa">
                        {c.ultima_mensagem
                          ? `${minha ? 'Você: ' : ''}${c.ultima_mensagem}`
                          : 'Nenhuma mensagem ainda'}
                      </span>
                      {novas ? (
                        <em className="chat-item-novas">
                          {c.nao_lidas}
                          <span className="sr-only"> não lidas</span>
                        </em>
                      ) : null}
                    </span>
                  </span>
                </button>
                <div className="chat-item-acoes">
                  <button
                    type="button"
                    className="chat-item-menu-botao"
                    aria-label={`Ações da conversa com ${nome}`}
                    aria-expanded={menuAberto === c.id_chat}
                    onClick={() => setMenuAberto((aberto) => (aberto === c.id_chat ? null : c.id_chat))}
                  >
                    <span aria-hidden="true">⋮</span>
                  </button>
                  {menuAberto === c.id_chat ? (
                    <div className="chat-item-menu" role="menu">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={async () => {
                          await onFixar(c)
                          setMenuAberto(null)
                        }}
                      >
                        <span aria-hidden="true">{c.fixada ? '−' : '+'}</span>
                        {c.fixada ? 'Desfixar conversa' : 'Fixar conversa'}
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="is-perigo"
                        onClick={() => {
                          setMenuAberto(null)
                          setConfirmando(c)
                        }}
                      >
                        <span aria-hidden="true">×</span>
                        Apagar conversa
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {confirmando ? (
        <div className="chat-modal-fundo" role="presentation" onClick={() => !excluindo && setConfirmando(null)}>
          <div
            className="chat-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="excluir-conversa-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="chat-modal-icone" aria-hidden="true">!</div>
            <small className="eyebrow">Conversa</small>
            <h2 id="excluir-conversa-titulo">Excluir conversa?</h2>
            <p>A conversa será removida da sua lista, mas o histórico do outro participante será preservado.</p>
            <div className="chat-modal-acoes">
              <button type="button" className="btn-secondary" onClick={() => setConfirmando(null)} disabled={excluindo}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={excluindo}
                onClick={async () => {
                  setExcluindo(true)
                  try {
                    await onExcluir(confirmando)
                    setConfirmando(null)
                  } finally {
                    setExcluindo(false)
                  }
                }}
              >
                {excluindo ? 'Excluindo…' : 'Excluir conversa'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
