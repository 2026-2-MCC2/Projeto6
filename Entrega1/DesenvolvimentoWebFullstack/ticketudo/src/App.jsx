import { useState } from 'react'
import Workspace from './layout/Workspace'
import Login from './pages/Login'
import { profiles } from './data/profiles'

export default function App() {
  const [role, setRole] = useState(null)

  if (!role) return <Login onSelectRole={setRole} />

  return <Workspace role={role} profile={profiles[role]} onLogout={() => setRole(null)} />
}
