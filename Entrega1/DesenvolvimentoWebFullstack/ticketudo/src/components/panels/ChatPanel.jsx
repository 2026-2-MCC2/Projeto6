import { useCallback, useEffect, useState } from 'react'
import Carregando from '../Carregando'
import { chats } from '../../api'
import { useCredenciamento } from '../../hooks/useCredenciamento'
import { useIntervalo } from '../../hooks/useIntervalo'
import { useApp } from '../../state/useApp'
import Conversa from './chat/Conversa'
import ListaConversas from './chat/ListaConversas'
import NovaConversa from './chat/NovaConversa'
import './chat/Chat.css'

// Telas do painel de mensagens:
//   lista      as conversas da pessoa
//   nova       escolher com quem falar
//   procurando abrir conversa com uma pessoa: usa a conversa direta que ja
//              existe com ela ou abre um rascunho (resolvido assim que a
//              lista chega)
//   conversa   uma conversa aberta
//   rascunho   conversa com alguem que ainda nao tem mensagem
//
// Outras telas podem abrir o painel ja numa conversa:
//   onOpenPanel('chat', { idChat })                         conversa conhecida
//   onOpenPanel('chat', { com: { id_usuario, nome, ... }, assunto })  com uma pessoa
function telaInicial(opcoes) {
  if (opcoes?.idChat) return { nome: 'conversa', idChat: opcoes.idChat }
  if (opcoes?.com) return { nome: 'procurando', pessoa: opcoes.com, assunto: opcoes.assunto }
  return { nome: 'lista' }
}

// a lista de conversas confere novidades a cada 8 segundos enquanto aparece
const LISTA_MS = 8000

export default function ChatPanel({ opcoes, onMudou }) {
  const { state } = useApp()
  const eu = state.sessao
  const { situacao } = useCredenciamento()
  const [tela, setTela] = useState(() => telaInicial(opcoes))
  const [lista, setLista] = useState({ dados: null, erro: null })

  const carregar = useCallback(() => {
    chats
      .lista()
      .then((dados) => setLista({ dados, erro: null }))
      // se ja tinha a lista, um erro na atualizacao nao apaga o que esta na tela
      .catch((erro) => setLista((atual) => (atual.dados ? atual : { dados: null, erro })))
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  useIntervalo(carregar, LISTA_MS, tela.nome === 'lista')

  // "procurando" vira conversa ou rascunho assim que a lista estiver pronta
  let atual = tela
  if (tela.nome === 'procurando' && lista.dados) {
    const existente = lista.dados.find((c) => c.com_id === tela.pessoa.id_usuario && !c.servico)
    atual = existente
      ? { nome: 'conversa', idChat: existente.id_chat }
      : { nome: 'rascunho', pessoa: tela.pessoa, assunto: tela.assunto }
  }

  function voltar() {
    setTela({ nome: 'lista' })
    carregar()
    onMudou?.()
  }

  if (atual.nome === 'conversa') {
    return (
      <Conversa
        key={atual.idChat}
        idChat={atual.idChat}
        eu={eu}
        onVoltar={voltar}
        onLeu={onMudou}
      />
    )
  }

  if (atual.nome === 'rascunho') {
    return (
      <Conversa
        key={`rascunho-${atual.pessoa.id_usuario}`}
        rascunho={atual}
        eu={eu}
        onVoltar={voltar}
        onCriada={(idChat) => {
          setTela({ nome: 'conversa', idChat })
          carregar()
        }}
      />
    )
  }

  if (atual.nome === 'nova') {
    return (
      <NovaConversa
        eu={eu}
        situacao={situacao}
        onVoltar={() => setTela({ nome: 'lista' })}
        onEscolher={(pessoa) => setTela({ nome: 'procurando', pessoa })}
      />
    )
  }

  if (!lista.dados) {
    return (
      <div className="chat-espera">
        <Carregando erro={lista.erro} aoTentarDeNovo={carregar} />
      </div>
    )
  }

  return (
    <ListaConversas
      conversas={lista.dados}
      eu={eu}
      situacao={situacao}
      onAbrir={(c) => setTela({ nome: 'conversa', idChat: c.id_chat })}
      onNova={() => setTela({ nome: 'nova' })}
    />
  )
}
