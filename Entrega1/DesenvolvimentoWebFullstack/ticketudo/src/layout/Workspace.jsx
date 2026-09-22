import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import SidePanel from '../components/SidePanel'
import { profiles } from '../data/profiles'
import { pagesByRole } from '../pages'
import { useApp } from '../state/useApp'

export default function Workspace({ onSignOut }) {
  const { state } = useApp()
  const [page, setPage] = useState('home')
  const [panel, setPanel] = useState(null)

  const profile = profiles[state.session.role]
  const pages = pagesByRole[state.session.role]
  const CurrentPage = pages[page] ?? pages.home

  return (
    <div className="app">
      <Sidebar
        profile={profile}
        page={page}
        onNavigate={setPage}
        onOpenPanel={setPanel}
        onSignOut={onSignOut}
      />
      <main className="workspace">
        <Topbar profile={profile} onOpenPanel={setPanel} />
        <div className="page">
          <CurrentPage page={page} profile={profile} onNavigate={setPage} onOpenPanel={setPanel} />
        </div>
      </main>
      {panel ? <SidePanel type={panel} onClose={() => setPanel(null)} /> : null}
    </div>
  )
}
