import { useEffect, useState } from 'react'
import Avatar from '../../Avatar'
import Carregando from '../../Carregando'
import Icon from '../../Icon'
import { chats } from '../../../api'
import { iniciais } from '../../../state/reducer'
import { sobrePessoa } from './chatUtil'

// grupos da lista de contatos, na ordem em que aparecem
const GRUPOS = [
  { tipo: 'adm', titulo: 'Equipe TrocaTicket' },
  { tipo: 'fornecedor', titulo: 'Fornecedores credenciados' },
  { tipo: 'organizador', titulo: 'Organizadores credenciados' },
  { tipo: 'comprador', titulo: 'Compradores' },
]

// Escolher com quem conversar. A API so devolve quem a pessoa pode chamar
// (regras/chat.js no backend), entao a tela nao precisa saber as regras.
export default function NovaConversa({ eu, situacao, onEscolher, onVoltar }) {
  const [busca, setBusca] = useState('')
  // a resposta guarda a busca que a gerou: enquanto nao bate com o campo,
  // a lista ainda esta carregando
  const [resultado, setResultado] = useState({ busca: null, tentativa: 0, dados: [], erro: null })
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    const termo = busca.trim()
    // espera a pessoa parar de digitar um instante antes de buscar
    const espera = setTimeout(() => {
      chats
        .contatos(termo)
        .then((dados) => setResultado({ busca, tentativa, dados, erro: null }))
        .catch((erro) => setResultado({ busca, tentativa, dados: [], erro }))
    }, 250)
    return () => clearTimeout(espera)
  }, [busca, tentativa])

  const carregando = resultado.busca !== busca || resultado.tentativa !== tentativa
  const pertoDoCredenciamento =
    (eu.tipo === 'organizador' || eu.tipo === 'fornecedor') && situacao !== 'credenciado'

  return (
    <div className="chat-nova">
      <header className="chat-conversa-topo">
        <button type="button" className="chat-voltar" onClick={onVoltar} aria-label="Voltar para as conversas">
          <Icon name="back" size={20} />
        </button>
        <div className="chat-conversa-quem">
          <strong>Nova conversa</strong>
          <small>Escolha com quem falar</small>
        </div>
      </header>

      <label className="chat-busca">
        <Icon name="search" size={17} />
        <span className="sr-only">Buscar pessoa</span>
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder={eu.tipo === 'adm' ? 'Nome, e-mail ou empresa' : 'Nome ou empresa'}
          autoFocus
        />
      </label>

      {pertoDoCredenciamento ? (
        <p className="chat-aviso">
          Depois do credenciamento você também pode conversar com{' '}
          {eu.tipo === 'organizador' ? 'fornecedores' : 'organizadores'} credenciados.
        </p>
      ) : null}

      <div className="chat-contatos">
        {carregando && resultado.busca === null ? (
          <Carregando />
        ) : resultado.erro ? (
          <Carregando erro={resultado.erro} aoTentarDeNovo={() => setTentativa((n) => n + 1)} />
        ) : resultado.dados.length === 0 ? (
          <div className="chat-vazio">
            <strong>Ninguém encontrado</strong>
            <p>{busca.trim() ? `Nenhum contato com “${busca.trim()}”.` : 'Nenhum contato disponível agora.'}</p>
          </div>
        ) : (
          GRUPOS.map((g) => {
            const pessoas = resultado.dados.filter((p) => p.tipo === g.tipo)
            if (!pessoas.length) return null
            return (
              <section className="chat-grupo" key={g.tipo} aria-label={g.titulo}>
                <h3>{g.titulo}</h3>
                <ul className="chat-itens">
                  {pessoas.map((p) => (
                    <li key={p.id_usuario}>
                      <button type="button" className="chat-item" onClick={() => onEscolher(p)}>
                        <Avatar initials={iniciais(p.nome)} small />
                        <span className="chat-item-texto">
                          <strong>{p.nome}</strong>
                          <small className="chat-item-sobre">
                            {[sobrePessoa(p), p.email].filter(Boolean).join(' · ')}
                          </small>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })
        )}
      </div>
    </div>
  )
}
