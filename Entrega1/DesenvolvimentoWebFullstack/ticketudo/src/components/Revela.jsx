import { useEffect, useRef, useState } from 'react'

// Sobe e revela o bloco quando ele entra na tela. Quem pediu menos
// movimento no sistema operacional ve tudo parado desde o inicio.
function prefereParado() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export default function Revela({ children, atraso = 0, className = '', as: Tag = 'div', ...resto }) {
  const alvo = useRef(null)
  const [visivel, setVisivel] = useState(prefereParado)

  useEffect(() => {
    const el = alvo.current
    if (!el || prefereParado()) return undefined

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisivel(true)
          observador.disconnect()
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    )

    observador.observe(el)
    return () => observador.disconnect()
  }, [])

  return (
    <Tag
      ref={alvo}
      className={`revela${visivel ? ' is-visivel' : ''}${className ? ` ${className}` : ''}`}
      style={atraso ? { transitionDelay: `${atraso}ms` } : undefined}
      {...resto}
    >
      {children}
    </Tag>
  )
}
