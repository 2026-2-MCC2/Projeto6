import { useCallback, useEffect, useState } from 'react'
import { chats } from '../api'
import { useIntervalo } from './useIntervalo'

// Quantas mensagens a pessoa ainda nao leu (o numero no botao Mensagens).
// Confere a cada 20 segundos e quando o chat avisa que algo mudou.
export function useNaoLidas() {
  const [total, setTotal] = useState(0)

  const atualizar = useCallback(() => {
    chats
      .naoLidas()
      .then((r) => setTotal(r.total || 0))
      .catch(() => {})
  }, [])

  useEffect(() => {
    atualizar()
  }, [atualizar])

  useIntervalo(atualizar, 20000)

  return [total, atualizar]
}
