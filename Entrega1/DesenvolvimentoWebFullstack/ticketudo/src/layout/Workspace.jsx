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
import './Workspace.css'
import './WorkspaceData.css'
import './WorkspacePages.css'

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
  // dado extra da pagina aberta (ex.: o id do evento na tela do evento)
  const [parametro, setParametro] = useState(null)

  const papel = state.sessao.papel
  const profile = profiles[papel]
  const pages = pagesByRole[papel]
  const [contadores, atualizarContadores] = useContadores(papel)
  const { exigir } = useCredenciamento()
  const temCredenciamento = papel === 'organizer' || papel === 'supplier'
  // no celular o menu lateral vira gaveta: aberta ou fechada
  const [menuAberto, setMenuAberto] = useState(false)

  // gaveta aberta: Esc fecha e a pagina de tras nao rola
  useEffect(() => {
    if (!menuAberto) return undefined

    function aoTeclar(evento) {
      if (evento.key === 'Escape') setMenuAberto(false)
    }

    document.addEventListener('keydown', aoTeclar)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = ''
    }
  }, [menuAberto])

  // criar evento depende do credenciamento: sem ele, abre o pop-up e so
  // depois de enviar segue para a tela do evento
  function navegar(destino, valor = null) {
    setMenuAberto(false)
    if (papel === 'organizer' && destino === 'new') {
      exigir('Para criar eventos, faça um credenciamento simples.', () => {
        setParametro(null)
        setPage('new')
      })
      return
    }
    setParametro(valor)
    setPage(destino)
  }

  // paginas que nao estao no menu acendem o item do menu "pai"
  const paginaDoMenu = { evento: 'events' }[page] ?? page

  const CurrentPage = pages?.[page] ?? pages?.home

  return (
    <div className="app plataforma">
      <Sidebar
        profile={profile}
        page={paginaDoMenu}
        contadores={contadores}
        aberto={menuAberto}
        onFechar={() => setMenuAberto(false)}
        onNavigate={navegar}
        onOpenPanel={(tipo) => {
          setMenuAberto(false)
          setPanel(tipo)
        }}
        onSignOut={onSignOut}
      />
      {/* fundo escuro atras da gaveta: tocar nele fecha o menu */}
      {menuAberto ? (
        <div className="gaveta-fundo" aria-hidden="true" onClick={() => setMenuAberto(false)} />
      ) : null}
      {/* com a gaveta aberta a pagina de tras fica inerte: o Tab nao sai do menu */}
      <main className="workspace" inert={menuAberto}>
        <Topbar
          profile={profile}
          menuAberto={menuAberto}
          onAbrirMenu={() => setMenuAberto(true)}
          onOpenPanel={setPanel}
        />
        <div className="page">
          <CurrentPage
            page={page}
            parametro={parametro}
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
