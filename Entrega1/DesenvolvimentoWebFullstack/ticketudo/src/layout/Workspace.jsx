import { useCallback, useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import SidePanel from '../components/SidePanel'
import { admin, solicitacoes } from '../api'
import { profiles } from '../data/profiles'
import { pagesByRole } from '../pages'
import { useApp } from '../state/useApp'

async function buscarContadores(papel) {
  if (papel === 'admin') {
    const [eventos, creds] = await Promise.all([admin.eventos(), admin.credenciamentos()])
    return { events: eventos.length, requests: creds.length }
  }

  if (papel === 'supplier') {
    const lista = await solicitacoes.minhas()
    return { requests: lista.filter((s) => s.status === 'em_analise').length }
  }

  return {}
}

// o numero que aparece ao lado do item de menu
function useContadores(papel) {
  const [contadores, setContadores] = useState({})
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    let vivo = true

    buscarContadores(papel)
      .then((valores) => {
        if (vivo) setContadores(valores)
      })
      .catch(() => {
        if (vivo) setContadores({})
      })

    return () => {
      vivo = false
    }
  }, [papel, versao])

  const atualizar = useCallback(() => setVersao((v) => v + 1), [])

  return [contadores, atualizar]
}

export default function Workspace({ onSignOut }) {
  const { state } = useApp()
  const [page, setPage] = useState('home')
  const [panel, setPanel] = useState(null)

  const papel = state.sessao.papel
  const profile = profiles[papel]
  const pages = pagesByRole[papel]
  const [contadores, atualizarContadores] = useContadores(papel)

  const CurrentPage = pages?.[page] ?? pages?.home

  return (
    <div className="app">
      <Sidebar
        profile={profile}
        page={page}
        contadores={contadores}
        onNavigate={setPage}
        onOpenPanel={setPanel}
        onSignOut={onSignOut}
      />
      <main className="workspace">
        <Topbar profile={profile} onOpenPanel={setPanel} />
        <div className="page">
          <CurrentPage
            page={page}
            profile={profile}
            onNavigate={setPage}
            onOpenPanel={setPanel}
            onMudou={atualizarContadores}
          />
        </div>
      </main>
      {panel ? <SidePanel type={panel} onClose={() => setPanel(null)} /> : null}
    </div>
  )
}
