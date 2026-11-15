import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Avatar from '../../Avatar'
import Carregando from '../../Carregando'
import Icon from '../../Icon'
import { chats } from '../../../api'
import { useIntervalo } from '../../../hooks/useIntervalo'
import { iniciais } from '../../../state/reducer'
import Composer from './Composer'
import {
  contexto,
  hora,
  juntarMensagens,
  mesmoDia,
  pedacosComLinks,
  rotuloDia,
  sobrePessoa,
} from './chatUtil'

// de quanto em quanto tempo a conversa aberta procura mensagens novas
const BUSCA_MS = 4000

function Texto({ texto }) {
  return pedacosComLinks(texto).map((p, i) =>
    p.link ? (
      <a href={p.texto} target="_blank" rel="noopener noreferrer" key={i}>
        {p.texto}
      </a>
    ) : (
      <Fragment key={i}>{p.texto}</Fragment>
    ),
  )
}

// A conversa aberta: cabecalho, mensagens e caixa de escrever.
// Com idChat: conversa que ja existe (busca as novas a cada 4s e marca
// como lida). Sem idChat: rascunho com uma pessoa; a conversa so e criada
// na primeira mensagem, para nao aparecer vazia para o outro lado.
export default function Conversa({ idChat, rascunho, eu, onVoltar, onCriada, onLeu }) {
  const [dados, setDados] = useState(null)
  const [mensagens, setMensagens] = useState([])
  const [pendentes, setPendentes] = useState([])
  const [carregando, setCarregando] = useState(Boolean(idChat))
  const [erro, setErro] = useState(null)
  const [novasAbaixo, setNovasAbaixo] = useState(0)

  const lista = useRef(null)
  const rolarParaFim = useRef(true)
  const ultimoId = useRef(0)
  const lidaAte = useRef(0)

  const pertoDoFim = () => {
    const el = lista.current
    return !el || el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  // chegou mensagem: se a pessoa esta no fim da conversa, desce junto;
  // se subiu para ler algo antigo, so avisa que tem novidade
  function receber(novas, { minhas = false } = {}) {
    if (!novas.length) return
    if (minhas || pertoDoFim()) rolarParaFim.current = true
    else setNovasAbaixo((n) => n + novas.length)
    ultimoId.current = Math.max(ultimoId.current, ...novas.map((m) => m.id_mensagem))
    setMensagens((atuais) => juntarMensagens(atuais, novas))
  }

  function guardarCabecalho(r) {
    const resto = { ...r }
    delete resto.mensagens
    setDados(resto)
    const minha = resto.participantes?.find((p) => p.id_usuario === eu.id)
    lidaAte.current = Math.max(lidaAte.current, minha?.ultima_lida ?? 0)
  }

  // primeira carga
  useEffect(() => {
    if (!idChat) return undefined
    let vivo = true
    chats
      .conversa(idChat)
      .then((r) => {
        if (!vivo) return
        guardarCabecalho(r)
        rolarParaFim.current = true
        ultimoId.current = r.mensagens.at(-1)?.id_mensagem ?? 0
        setMensagens(r.mensagens)
        setCarregando(false)
      })
      .catch((e) => {
        if (!vivo) return
        setErro(e)
        setCarregando(false)
      })
    return () => {
      vivo = false
    }
    // guardarCabecalho so usa refs e setters estaveis
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idChat])

  // mensagens novas (e o "visto" do outro lado) enquanto a conversa esta aberta
  useIntervalo(
    () => {
      chats
        .conversa(idChat, ultimoId.current)
        .then((r) => {
          guardarCabecalho(r)
          receber(r.mensagens)
        })
        .catch(() => {})
    },
    BUSCA_MS,
    Boolean(idChat) && !carregando && !erro,
  )

  // tem mensagem dos outros que eu ainda nao li: marca como lida
  useEffect(() => {
    if (!idChat) return
    const ultima = mensagens.at(-1)
    const temNova = mensagens.some((m) => m.id_remetente !== eu.id && m.id_mensagem > lidaAte.current)
    if (!ultima || !temNova) return
    lidaAte.current = ultima.id_mensagem
    chats
      .lida(idChat, ultima.id_mensagem)
      .then(() => onLeu?.())
      .catch(() => {})
  }, [mensagens, idChat, eu.id, onLeu])

  // depois de desenhar, desce ate a ultima mensagem quando foi pedido
  useLayoutEffect(() => {
    if (!rolarParaFim.current || !lista.current) return
    lista.current.scrollTop = lista.current.scrollHeight
    rolarParaFim.current = false
  }, [mensagens, pendentes, carregando])

  function irParaFim() {
    setNovasAbaixo(0)
    lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: 'smooth' })
  }

  async function enviar(texto, chaveAntiga) {
    const chave = chaveAntiga ?? `p-${Date.now()}-${Math.random()}`
    rolarParaFim.current = true
    setPendentes((p) =>
      chaveAntiga
        ? p.map((x) => (x.chave === chave ? { ...x, estado: 'enviando', erro: null } : x))
        : [...p, { chave, texto, estado: 'enviando' }],
    )

    try {
      if (!idChat) {
        const r = await chats.abrir({
          id_usuario: rascunho.pessoa.id_usuario,
          assunto: rascunho.assunto || undefined,
          mensagem: texto,
        })
        onCriada(r.id_chat)
        return
      }
      const nova = await chats.enviar(idChat, texto)
      setPendentes((p) => p.filter((x) => x.chave !== chave))
      receber([nova], { minhas: true })
    } catch (e) {
      setPendentes((p) => p.map((x) => (x.chave === chave ? { ...x, estado: 'erro', erro: e.message } : x)))
    }
  }

  const outros = (dados?.participantes ?? []).filter((p) => p.id_usuario !== eu.id)
  const pessoa = outros[0] ?? rascunho?.pessoa ?? null
  const grupo = outros.length > 1
  const sobre = dados ? contexto(dados) : rascunho?.assunto
  const vistoAte = Math.max(0, ...outros.map((p) => p.ultima_lida ?? 0))
  const minhaUltima = [...mensagens].reverse().find((m) => m.id_remetente === eu.id)
  const ultimaDeTodas = mensagens.at(-1)

  return (
    <div className="chat-conversa">
      <header className="chat-conversa-topo">
        <button type="button" className="chat-voltar" onClick={onVoltar} aria-label="Voltar para as conversas">
          <Icon name="back" size={20} />
        </button>
        {pessoa ? <Avatar initials={iniciais(pessoa.nome)} small /> : null}
        <div className="chat-conversa-quem">
          <strong>{grupo ? outros.map((p) => p.nome).join(', ') : (pessoa?.nome ?? 'Conversa')}</strong>
          <small>{[grupo ? null : sobrePessoa(pessoa), sobre].filter(Boolean).join(' · ')}</small>
        </div>
      </header>

      <div
        className="chat-mensagens"
        ref={lista}
        role="log"
        aria-live="polite"
        aria-label="Mensagens"
        onScroll={() => {
          if (novasAbaixo && pertoDoFim()) setNovasAbaixo(0)
        }}
      >
        {carregando || erro ? (
          <Carregando erro={erro} aoTentarDeNovo={onVoltar} />
        ) : mensagens.length === 0 && pendentes.length === 0 ? (
          <div className="chat-vazio">
            <strong>{idChat ? 'Nenhuma mensagem ainda' : `Comece a conversa com ${pessoa?.nome}`}</strong>
            <p>
              {idChat
                ? 'Escreva abaixo para começar.'
                : 'A conversa aparece para a outra pessoa quando você enviar a primeira mensagem.'}
            </p>
          </div>
        ) : null}

        {mensagens.map((m, i) => {
          const minha = m.id_remetente === eu.id
          const anterior = mensagens[i - 1]
          const novoDia = !anterior || !mesmoDia(anterior.criado_em, m.criado_em)
          // mensagens seguidas da mesma pessoa ficam juntas
          const continua = !novoDia && anterior.id_remetente === m.id_remetente
          return (
            <Fragment key={m.id_mensagem}>
              {novoDia ? (
                <p className="chat-dia">
                  <span>{rotuloDia(m.criado_em)}</span>
                </p>
              ) : null}
              <div className={`chat-bolha${minha ? ' is-minha' : ''}${continua ? ' is-seguida' : ''}`}>
                {grupo && !minha && !continua ? <b className="chat-autor">{m.remetente}</b> : null}
                <p>
                  <Texto texto={m.texto_mensagem} />
                </p>
                <time dateTime={new Date(m.criado_em).toISOString()}>{hora(m.criado_em)}</time>
              </div>
              {minha && m === minhaUltima && m === ultimaDeTodas && pendentes.length === 0 ? (
                <small className="chat-status">{vistoAte >= m.id_mensagem ? 'Visto' : 'Enviada'}</small>
              ) : null}
            </Fragment>
          )
        })}

        {pendentes.map((p) => (
          <Fragment key={p.chave}>
            <div className={`chat-bolha is-minha${p.estado === 'erro' ? ' is-erro' : ' is-enviando'}`}>
              <p>{p.texto}</p>
            </div>
            {p.estado === 'erro' ? (
              <div className="chat-status is-erro" role="alert">
                <span>Não enviada{p.erro ? `: ${p.erro}` : ''}</span>
                <button type="button" onClick={() => enviar(p.texto, p.chave)}>
                  Tentar de novo
                </button>
                <button type="button" onClick={() => setPendentes((l) => l.filter((x) => x.chave !== p.chave))}>
                  Descartar
                </button>
              </div>
            ) : (
              <small className="chat-status">Enviando…</small>
            )}
          </Fragment>
        ))}
      </div>

      {novasAbaixo > 0 ? (
        <button type="button" className="chat-novas" onClick={irParaFim}>
          {novasAbaixo === 1 ? '1 mensagem nova' : `${novasAbaixo} mensagens novas`} ↓
        </button>
      ) : null}

      {erro ? null : (
        <Composer
          chave={idChat ?? `nova-${rascunho?.pessoa?.id_usuario}`}
          onEnviar={(texto) => enviar(texto)}
          placeholder={pessoa ? `Mensagem para ${pessoa.nome.split(' ')[0]}…` : undefined}
        />
      )}
    </div>
  )
}
