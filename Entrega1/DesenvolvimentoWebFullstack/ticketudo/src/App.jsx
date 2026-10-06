import { useEffect, useState } from 'react'
import Toaster from './components/Toaster'
import Workspace from './layout/Workspace'
import Home from './pages/Home'
import Login from './pages/Login'
import { auth } from './api'
import { lerToken, limparToken } from './api/client'
import { AppProvider } from './state/AppProvider'
import { useApp } from './state/useApp'

function Shell() {
  const { state, dispatch } = useApp()
  const [view, setView] = useState('home')

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
    dispatch({ type: 'sessao/saiu' })
    setView('home')
  }

  if (state.carregandoSessao) {
    return <div className="carregando-app">Carregando…</div>
  }

  if (state.sessao) {
    return (
      <>
        <Workspace onSignOut={sair} />
        <Toaster />
      </>
    )
  }

  if (view === 'login') {
    return (
      <>
        <Login onBack={() => setView('home')} />
        <Toaster />
      </>
    )
  }

  return <Home onEnter={() => setView('login')} />
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
