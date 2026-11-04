import { useEffect, useRef } from 'react'
import Revela from './Revela'

// Linha do tempo das etapas: a linha enche conforme a pagina rola e o
// numero de cada etapa acende quando a linha chega nele, com a cor que
// a linha tem naquela altura. Quem pediu menos movimento ve tudo aceso.

function prefereParado() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// --- cor da linha num ponto, a partir das paradas do degrade ---

function hexParaRgb(hex) {
  const limpo = hex.trim().replace('#', '')
  return [0, 2, 4].map((i) => parseInt(limpo.slice(i, i + 2), 16))
}

// "#30b0f0 0, #f020b0 0.55, #ff7a45 1" -> [{ rgb, pos }, ...]
function lerParadas(texto) {
  return texto.split(',').map((parada) => {
    const [cor, pos] = parada.trim().split(/\s+/)
    return { rgb: hexParaRgb(cor), pos: Number(pos) }
  })
}

function corNaLinha(fracao, paradas) {
  let i = 0
  while (i < paradas.length - 2 && fracao > paradas[i + 1].pos) i += 1
  const a = paradas[i]
  const b = paradas[i + 1]
  const t = Math.min(1, Math.max(0, (fracao - a.pos) / (b.pos - a.pos)))
  return a.rgb.map((canal, k) => Math.round(canal + (b.rgb[k] - canal) * t))
}

// luminancia e contraste da WCAG
function luz(rgb) {
  const [r, g, b] = rgb.map((canal) => {
    const v = canal / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contraste(a, b) {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

export default function LinhaEtapas({ passos }) {
  const trilho = useRef(null)

  useEffect(() => {
    const el = trilho.current
    if (!el) return undefined

    const parado = prefereParado()
    const estilo = getComputedStyle(el)
    const paradas = lerParadas(estilo.getPropertyValue('--degrade-linha-paradas'))
    const luzEscuro = luz(hexParaRgb(estilo.getPropertyValue('--cartao-texto')))
    const luzClaro = luz(hexParaRgb(estilo.getPropertyValue('--estacao-texto-claro')))

    function rolar() {
      const caixa = el.getBoundingClientRect()
      const meio = window.innerHeight * 0.6
      const progresso = parado ? 1 : Math.min(1, Math.max(0, (meio - caixa.top) / caixa.height))
      el.style.setProperty('--progresso', progresso)

      el.querySelectorAll('.passos > li').forEach((li) => {
        // data-ativa em vez de className: o React nao apaga no proximo render
        if (parado || li.getBoundingClientRect().top + 40 < meio) li.dataset.ativa = ''
        else delete li.dataset.ativa
      })
    }

    // cada numero aceso pega a cor da linha na altura dele. Se nem o
    // texto escuro nem o branco chegam a 4,5:1, escurece so o necessario
    function pintarNumeros() {
      const linha = el.querySelector('.trilho-linha').getBoundingClientRect()

      el.querySelectorAll('.passos > li').forEach((li) => {
        const bola = getComputedStyle(li, '::before')
        const centro = li.getBoundingClientRect().top + parseFloat(bola.top) + parseFloat(bola.height) / 2
        let rgb = corNaLinha(Math.min(1, Math.max(0, (centro - linha.top) / linha.height)), paradas)

        while (Math.max(contraste(luz(rgb), luzEscuro), contraste(luz(rgb), luzClaro)) < 4.5) {
          rgb = rgb.map((canal) => Math.round(canal * 0.97))
        }

        const escuroGanha = contraste(luz(rgb), luzEscuro) >= contraste(luz(rgb), luzClaro)
        const texto = escuroGanha ? 'var(--cartao-texto)' : 'var(--estacao-texto-claro)'
        li.style.setProperty('--cor-estacao', `rgb(${rgb.join(' ')})`)
        li.style.setProperty('--cor-estacao-texto', texto)
      })
    }

    function redimensionar() {
      rolar()
      pintarNumeros()
    }

    redimensionar()
    // a fonte muda a altura dos cartoes: pinta de novo quando ela chega
    document.fonts?.ready.then(pintarNumeros)
    window.addEventListener('scroll', rolar, { passive: true })
    window.addEventListener('resize', redimensionar)

    return () => {
      window.removeEventListener('scroll', rolar)
      window.removeEventListener('resize', redimensionar)
    }
  }, [])

  return (
    <div className="trilho" ref={trilho}>
      <div className="trilho-linha" aria-hidden="true">
        <div className="trilho-preenche" />
      </div>
      <ol className="passos">
        {passos.map((passo, i) => (
          <Revela as="li" atraso={i * 80} key={passo.titulo}>
            <h3>{passo.titulo}</h3>
            <p>{passo.texto}</p>
            <span className="passo-quem">{passo.quem}</span>
          </Revela>
        ))}
      </ol>
    </div>
  )
}
