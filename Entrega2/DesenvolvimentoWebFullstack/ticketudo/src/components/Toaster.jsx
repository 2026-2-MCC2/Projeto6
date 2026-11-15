import { useEffect } from 'react'
import Icon from './Icon'
import { useApp } from '../state/useApp'

function Toast({ toast, onFechar }) {
  useEffect(() => {
    const timer = setTimeout(onFechar, 3600)
    return () => clearTimeout(timer)
  }, [onFechar])

  return (
    <div className="toast" role="status">
      <Icon name="check" size={14} />
      {toast.texto}
      <button aria-label="Fechar aviso" onClick={onFechar}>
        ×
      </button>
    </div>
  )
}

export default function Toaster() {
  const { state, dispatch } = useApp()

  if (state.toasts.length === 0) return null

  return (
    <div className="toaster">
      {state.toasts.map((toast) => (
        <Toast
          toast={toast}
          onFechar={() => dispatch({ type: 'aviso/fechar', id: toast.id })}
          key={toast.id}
        />
      ))}
    </div>
  )
}
