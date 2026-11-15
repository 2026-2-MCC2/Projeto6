import { useMemo, useReducer } from 'react'
import { AppContext } from './context'
import { initialState, reducer } from './reducer'

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const value = useMemo(() => ({ state, dispatch }), [state])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
