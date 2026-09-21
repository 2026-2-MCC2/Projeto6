import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import SidePanel from '../components/SidePanel'
import { pagesByRole } from '../pages'

export default function Workspace({ role, profile, onLogout }) {
  const [page, setPage] = useState('home')
  const [panel, setPanel] = useState(null)

  const pages = pagesByRole[role]
  const CurrentPage = pages[page] ?? pages.home

  return (
    <div className="app">
      <Sidebar
        profile={profile}
        page={page}
        onNavigate={setPage}
        onOpenPanel={setPanel}
        onLogout={onLogout}
      />
      <main className="workspace">
        <Topbar profile={profile} onOpenPanel={setPanel} />
        <div className="page">
          <CurrentPage page={page} profile={profile} onNavigate={setPage} onOpenPanel={setPanel} />
        </div>
      </main>
      {panel && <SidePanel type={panel} onClose={() => setPanel(null)} />}
    </div>
  )
}
