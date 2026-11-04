// Ordem do CSS das telas e componentes. Ela importa: quando duas regras tem a
// mesma prioridade, vale a que carrega por ultimo (o WorkspaceResponsive fica
// no fim para os ajustes de celular ganharem). Os componentes tambem importam
// o proprio CSS, mas e esta lista que define a ordem final.
import './layout/Workspace.css'
import './components/Shared.css'
import './layout/WorkspacePages.css'
import './components/Field.css'
import './pages/Home.css'
import './pages/Login.css'
import './components/SidePanel.css'
import './layout/WorkspaceData.css'
import './components/CredenciamentoFlutuante.css'
import './components/Carregando.css'
import './layout/WorkspaceResponsive.css'
import { useEffect, useState } from 'react'
import TelaCarregando from './components/TelaCarregando'
import Toaster from './components/Toaster'
import Workspace from './layout/Workspace'
import Home from './pages/Home'
import Login from './pages/Login'
import { auth } from './api'
import { lerToken, limparToken } from './api/client'
import { limparRecursos } from './hooks/useRecurso'
import { AppProvider } from './state/AppProvider'
import { useApp } from './state/useApp'

// abertura da marca: so na primeira pagina da sessao, como na agencia
// Benjamin. Fica no minimo ABERTURA_MINIMA na tela (menos que isso so pisca)
// e depois sobe como cortina em SAIDA_CORTINA
const CHAVE_ABERTURA = 'trocaticket:abertura'
const ABERTURA_MINIMA = 900
const SAIDA_CORTINA = 650
const INICIO = performance.now()

function primeiraPaginaDaSessao() {
  try {
    return !sessionStorage.getItem(CHAVE_ABERTURA)
  } catch {
    return false
  }
}

function Shell() {
  const { state, dispatch } = useApp()
  const [view, setView] = useState('home')
  const [abertura] = useState(primeiraPaginaDaSessao)
  // cortina da abertura: 'aberta', 'saindo' ou 'fechada'
  const [cortina, setCortina] = useState(abertura ? 'aberta' : 'fechada')

  // quando a sessao termina de carregar, a cortina espera o tempo minimo
  // e sobe; a pagina de baixo ja esta pronta atras dela
  useEffect(() => {
    if (!abertura || state.carregandoSessao) return undefined

    try {
      sessionStorage.setItem(CHAVE_ABERTURA, '1')
    } catch {
      // sem como guardar, a abertura aparece de novo na proxima pagina
    }

    const espera = Math.max(0, ABERTURA_MINIMA - (performance.now() - INICIO))
    const sobe = setTimeout(() => setCortina('saindo'), espera)
    const fecha = setTimeout(() => setCortina('fechada'), espera + SAIDA_CORTINA)

    return () => {
      clearTimeout(sobe)
      clearTimeout(fecha)
    }
  }, [abertura, state.carregandoSessao])

  // se ja existe token guardado, volta direto pro workspace
  useEffect(() => {
    if (!lerToken()) {
      dispatch({ type: 'sessao/restaurada', usuario: null })
      return
    }

    auth
      .eu()
      .then((usuario) => dispatch({ type: 'sessao/restaurada', usuario }))
      .catch(() => {
        limparToken()
        dispatch({ type: 'sessao/restaurada', usuario: null })
      })
  }, [dispatch])

  function sair() {
    limparToken()
    // a proxima pessoa neste navegador nao ve, nem por um instante, os dados
    // que ficaram na memoria das telas
    limparRecursos()
    dispatch({ type: 'sessao/saiu' })
    setView('home')
  }

  let conteudo
  if (state.carregandoSessao) {
    // na abertura a cortina ja cobre a tela; fora dela, a tela cheia so
    // aparece se a espera passar de um instante
    conteudo = abertura ? null : <TelaCarregando rapida />
  } else if (state.sessao) {
    conteudo = (
      <>
        <Workspace onSignOut={sair} />
        <Toaster />
      </>
    )
  } else if (view === 'login') {
    conteudo = (
      <>
        <Login onBack={() => setView('home')} />
        <Toaster />
      </>
    )
  } else {
    conteudo = <Home onEnter={() => setView('login')} />
  }

  return (
    <>
      {conteudo}
      {cortina !== 'fechada' ? <TelaCarregando saindo={cortina === 'saindo'} /> : null}
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
