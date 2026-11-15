import { useState } from 'react'

// Campo do motivo da recusa, aberto dentro do proprio card (no lugar dos
// botoes). Usado na analise de credenciamentos e de eventos.
export default function MotivoRecusa({ id, aviso, onConfirmar, onCancelar }) {
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    if (!motivo.trim()) {
      setErro('Escreva o motivo para recusar.')
      return
    }
    setEnviando(true)
    try {
      await onConfirmar(motivo.trim())
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form
      className="recusa-form"
      onSubmit={enviar}
      onKeyDown={(e) => e.key === 'Escape' && onCancelar()}
    >
      <label htmlFor={id}>Motivo da recusa</label>
      <textarea
        id={id}
        rows={3}
        value={motivo}
        onChange={(e) => {
          setMotivo(e.target.value)
          setErro(null)
        }}
        placeholder="Ex.: o CNPJ não confere com a razão social."
        autoFocus
      />
      {erro ? <small className="field-error">{erro}</small> : <small>{aviso}</small>}
      <div className="recusa-acoes">
        <button type="button" className="btn-secondary" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="btn-recusar" disabled={enviando}>
          {enviando ? 'Recusando…' : 'Confirmar recusa'}
        </button>
      </div>
    </form>
  )
}
