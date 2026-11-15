import { useContext } from 'react'
import { AppContext } from './context'

export function useApp() {
  return useContext(AppContext)
}
