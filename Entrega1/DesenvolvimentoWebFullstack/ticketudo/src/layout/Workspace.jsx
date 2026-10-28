import { useCallback, useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import CredenciamentoFlutuante from '../components/CredenciamentoFlutuante'
import SidePanel from '../components/SidePanel'
import { admin, solicitacoes } from '../api'
import { profiles } from '../data/profiles'
import { useCredenciamento } from '../hooks/useCredenciamento'
import { pagesByRole } from '../pages'
import { useApp } from '../state/useApp'

async function buscarContadores(papel) {
  if (papel === 'admin') {
    const [eventos, creds] = await Promise.all([admin.eventos(), admin.credenciamentosNaFila()])
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
  const { exigir } = useCredenciamento()
  const temCredenciamento = papel === 'organizer' || papel === 'supplier'

  // criar evento depende do credenciamento: sem ele, abre o pop-up e so
  // depois de enviar segue para a tela do evento
  function navegar(destino) {
    if (papel === 'organizer' && destino === 'new') {
      exigir('Para criar eventos, faça um credenciamento simples.', () => setPage('new'))
      return
    }
    setPage(destino)
  }

  const CurrentPage = pages?.[page] ?? pages?.home

  return (
    <div className="app">
      <Sidebar
        profile={profile}
        page={page}
        contadores={contadores}
        onNavigate={navegar}
        onOpenPanel={setPanel}
        onSignOut={onSignOut}
      />
      <main className="workspace">
        <Topbar profile={profile} onOpenPanel={setPanel} />
        <div className="page">
          <CurrentPage
            page={page}
            profile={profile}
            onNavigate={navegar}
            onOpenPanel={setPanel}
            onMudou={atualizarContadores}
          />
        </div>
      </main>
      {panel ? <SidePanel type={panel} onClose={() => setPanel(null)} /> : null}
      {temCredenciamento ? <CredenciamentoFlutuante /> : null}
    </div>
  )
}
