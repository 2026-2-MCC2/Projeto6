import { useCallback, useEffect, useRef, useState } from 'react'

// Carrega algo da API e devolve o estado da carga.
// A chave diz quando refazer a busca sozinho (ex: a aba selecionada).
// O recarregar() serve pra atualizar depois de uma acao do usuario.
export function useRecurso(buscar, chave = '') {
  const [estado, setEstado] = useState({ dados: null, carregando: true, erro: null })
  const [versao, setVersao] = useState(0)

  // a funcao muda de identidade a cada render; guardar numa ref evita
  // que o efeito rode em loop
  const buscarRef = useRef(buscar)
  useEffect(() => {
    buscarRef.current = buscar
  })

  useEffect(() => {
    let vivo = true

    buscarRef
      .current()
      .then((dados) => {
        if (vivo) setEstado({ dados, carregando: false, erro: null })
      })
      .catch((erro) => {
        if (vivo) setEstado({ dados: null, carregando: false, erro })
      })

    return () => {
      vivo = false
    }
  }, [chave, versao])

  const recarregar = useCallback(() => setVersao((v) => v + 1), [])

  return { ...estado, recarregar }
}
