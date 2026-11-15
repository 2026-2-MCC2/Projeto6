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

export default function ListaConversas({ conversas, eu, situacao, onAbrir, onNova }) {
  const [busca, setBusca] = useState('')
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
              <li key={c.id_chat}>
                <button
                  type="button"
                  className={novas ? 'chat-item is-nova' : 'chat-item'}
                  onClick={() => onAbrir(c)}
                >
                  <Avatar initials={iniciais(nome)} small />
                  <span className="chat-item-texto">
                    <span className="chat-item-linha">
                      <strong>{nome}</strong>
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
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
