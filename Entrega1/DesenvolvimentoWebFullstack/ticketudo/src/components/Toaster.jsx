import { useEffect } from 'react'
import Icon from './Icon'
import { useApp } from '../state/useApp'

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3600)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div className="toast" role="status">
      <Icon name="check" size={14} />
      {toast.text}
      <button aria-label="Fechar aviso" onClick={onDismiss}>
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
          onDismiss={() => dispatch({ type: 'toast/dismiss', id: toast.id })}
          key={toast.id}
        />
      ))}
    </div>
  )
}
