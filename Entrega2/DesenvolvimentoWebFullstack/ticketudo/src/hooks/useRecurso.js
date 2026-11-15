import { useCallback, useEffect, useRef, useState } from 'react'

// Carrega algo da API e devolve o estado da carga.
// A chave diz quando refazer a busca sozinho (ex: a aba selecionada).
// O recarregar() serve pra atualizar depois de uma acao do usuario.
//
// Memoria da sessao: a primeira vez que uma tela carrega, a espera fica
// no minimo ESPERA_MINIMA na tela (a animacao aparece inteira, sem piscar).
// Nas proximas vezes a tela mostra na hora o que veio da ultima visita e
// confere com o servidor por tras; se algo mudou, ela se atualiza sozinha.
// Ao sair do portal a memoria e apagada (limparRecursos, em App.jsx).

const ESPERA_MINIMA = 900
const memoria = new Map()

export function limparRecursos() {
  memoria.clear()
}

// o texto da funcao de busca + a chave identifica o que esta sendo buscado:
// () => eventos.meus() na tela de eventos e na de fornecedores e o mesmo dado
function idDaBusca(buscar, chave) {
  return `${buscar.toString()}|${chave}`
}

function estadoInicial(id) {
  return memoria.has(id)
    ? { id, dados: memoria.get(id), carregando: false, erro: null }
    : { id, dados: null, carregando: true, erro: null }
}

export function useRecurso(buscar, chave = '') {
  const id = idDaBusca(buscar, chave)
  const [estado, setEstado] = useState(() => estadoInicial(id))
  const [versao, setVersao] = useState(0)

  // trocou a chave (ex: outra aba): comeca pelo que a memoria tiver dela
  let atual = estado
  if (estado.id !== id) {
    atual = estadoInicial(id)
    setEstado(atual)
  }

  // a funcao muda de identidade a cada render; guardar numa ref evita
  // que o efeito rode em loop
  const buscarRef = useRef(buscar)
  useEffect(() => {
    buscarRef.current = buscar
  })

  useEffect(() => {
    let vivo = true
    const primeiraVez = !memoria.has(id)
    const inicio = performance.now()

    // so a primeira carga da tela espera o minimo; as outras entram direto
    function quandoPuder(atualizar) {
      const falta = primeiraVez ? ESPERA_MINIMA - (performance.now() - inicio) : 0
      if (falta > 0) setTimeout(() => vivo && atualizar(), falta)
      else if (vivo) atualizar()
    }

    buscarRef
      .current()
      .then((dados) => {
        memoria.set(id, dados)
        quandoPuder(() => setEstado({ id, dados, carregando: false, erro: null }))
      })
      .catch((erro) => {
        quandoPuder(() => setEstado({ id, dados: null, carregando: false, erro }))
      })

    return () => {
      vivo = false
    }
  }, [id, versao])

  const recarregar = useCallback(() => setVersao((v) => v + 1), [])

  return { dados: atual.dados, carregando: atual.carregando, erro: atual.erro, recarregar }
}
