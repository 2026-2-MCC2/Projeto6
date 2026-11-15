import { useCallback } from 'react'
import { useApp } from '../state/useApp'

// Para as telas que tem acao bloqueada pelo credenciamento.
//   const { exigir } = useCredenciamento()
//   exigir('Para criar eventos, faça um credenciamento simples.', () => abrirFormulario())
// Se a pessoa ainda nao pediu (ou foi recusada), abre o pop-up com o motivo e
// so roda a acao depois que ela enviar. Se ja pediu, roda na hora.
export function useCredenciamento() {
  const { state, dispatch } = useApp()
  const situacao = state.credenciamento.info?.situacao ?? null

  const exigir = useCallback(
    (motivo, depois) => {
      if (situacao === 'nao_solicitado' || situacao === 'recusado') {
        dispatch({ type: 'credenciamento/abrir', motivo, depois })
        return
      }
      // em analise, credenciado ou ainda carregando: a API confere de novo
      depois?.()
    },
    [situacao, dispatch],
  )

  const abrir = useCallback(() => dispatch({ type: 'credenciamento/abrir' }), [dispatch])

  return { situacao, exigir, abrir }
}
