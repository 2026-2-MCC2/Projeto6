import { useState } from 'react'
import Toaster from './components/Toaster'
import Workspace from './layout/Workspace'
import Home from './pages/Home'
import Login from './pages/Login'
import { AppProvider } from './state/AppProvider'
import { useApp } from './state/useApp'

function Shell() {
  const { state, dispatch } = useApp()
  const [view, setView] = useState('home')

  function signOut() {
    dispatch({ type: 'session/sign-out' })
    setView('home')
  }

  if (state.session) {
    return (
      <>
        <Workspace onSignOut={signOut} />
        <Toaster />
      </>
    )
  }

  if (view === 'login') return <Login onBack={() => setView('home')} />

  return <Home onEnter={() => setView('login')} />
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
