import { useEffect, useRef, useState } from 'react'

// Conta de zero ate o valor quando o numero aparece na tela.
// O span invisivel reserva a largura final, pra linha nao dancar
// enquanto os digitos mudam.
export default function Contador({ valor, sufixo = '', casas = 0, duracao = 1100 }) {
  const alvo = useRef(null)
  const parado =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [atual, setAtual] = useState(parado ? valor : 0)

  useEffect(() => {
    const el = alvo.current
    if (!el || parado) return undefined

    let quadro
    const observador = new IntersectionObserver(([entrada]) => {
      if (!entrada.isIntersecting) return
      observador.disconnect()

      const inicio = performance.now()
      const passo = (agora) => {
        const t = Math.min(1, (agora - inicio) / duracao)
        // desacelera no fim, em vez de parar seco
        setAtual(valor * (1 - (1 - t) ** 3))
        if (t < 1) quadro = requestAnimationFrame(passo)
      }
      quadro = requestAnimationFrame(passo)
    })

    observador.observe(el)
    return () => {
      observador.disconnect()
      if (quadro) cancelAnimationFrame(quadro)
    }
  }, [valor, duracao, parado])

  const mostra = atual.toFixed(casas)
  const final = valor.toFixed(casas)

  return (
    <span className="contador" ref={alvo}>
      <span className="contador-medida" aria-hidden="true">
        {final}
        {sufixo}
      </span>
      <span aria-hidden="true">
        {mostra}
        {sufixo}
      </span>
      <span className="sr-only">
        {final}
        {sufixo}
      </span>
    </span>
  )
}
