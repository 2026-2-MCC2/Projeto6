import { useEffect, useRef } from 'react'

// Roda "fazer" a cada "ms" enquanto "ativo" for verdadeiro e a aba estiver
// visivel. Quando a pessoa volta para a aba, roda na hora (pega o que chegou
// enquanto ela estava fora). Serve para o chat buscar mensagens novas.
export function useIntervalo(fazer, ms, ativo = true) {
  const fazerRef = useRef(fazer)
  useEffect(() => {
    fazerRef.current = fazer
  })

  useEffect(() => {
    if (!ativo) return undefined

    const rodar = () => {
      if (document.visibilityState === 'visible') fazerRef.current()
    }
    const id = setInterval(rodar, ms)
    document.addEventListener('visibilitychange', rodar)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', rodar)
    }
  }, [ms, ativo])
}
