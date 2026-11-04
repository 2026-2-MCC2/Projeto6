import { useEffect, useRef } from 'react'
import Revela from './Revela'

// Linha do tempo das etapas: a linha enche conforme a pagina rola e o
// numero de cada etapa acende quando a linha chega nele, com a cor que
// a linha tem naquela altura. Quem pediu menos movimento ve tudo aceso.

function prefereParado() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// --- cor da linha num ponto, a partir das paradas do degrade ---

// o navegador converte qualquer escrita de cor (#fff, #ffffff, nome...)
// para rgb. O build encurta as cores, entao nao da para ler o hex na mao
function corParaRgb(cor, onde) {
  const amostra = document.createElement('span')
  amostra.style.color = cor.trim()
  onde.appendChild(amostra)
  const rgb = getComputedStyle(amostra).color.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number)
  amostra.remove()
  return rgb
}

// "#30b0f0 0, #f020b0 0.55, #ff7a45 1" -> [{ rgb, pos }, ...]
function lerParadas(texto, onde) {
  return texto.split(',').map((parada) => {
    const partes = parada.trim().split(/\s+/)
    const pos = Number(partes.pop())
    return { rgb: corParaRgb(partes.join(' '), onde), pos }
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
    const paradas = lerParadas(estilo.getPropertyValue('--degrade-linha-paradas'), el)
    const luzEscuro = luz(corParaRgb(estilo.getPropertyValue('--cartao-texto'), el))
    const luzClaro = luz(corParaRgb(estilo.getPropertyValue('--estacao-texto-claro'), el))

    const itens = () => [...el.querySelectorAll('.passos > li')]

    // primeiro le todas as medidas, depois escreve: misturar as duas coisas
    // obriga o navegador a recalcular o layout a cada item
    function rolar() {
      const meio = window.innerHeight * 0.6
      const caixa = el.getBoundingClientRect()
      const topos = itens().map((li) => li.getBoundingClientRect().top)

      const progresso = parado ? 1 : Math.min(1, Math.max(0, (meio - caixa.top) / caixa.height))
      el.style.setProperty('--progresso', progresso)
      // data-ativa em vez de className: o React nao apaga no proximo render
      itens().forEach((li, i) => {
        if (parado || topos[i] + 40 < meio) li.dataset.ativa = ''
        else delete li.dataset.ativa
      })
    }

    // cada numero aceso pega a cor da linha na altura dele. Se nem o
    // texto escuro nem o branco chegam a 4,5:1, escurece so o necessario
    function pintarNumeros() {
      const linha = el.querySelector('.trilho-linha').getBoundingClientRect()
      const centros = itens().map((li) => {
        const bola = getComputedStyle(li, '::before')
        return li.getBoundingClientRect().top + parseFloat(bola.top) + parseFloat(bola.height) / 2
      })

      itens().forEach((li, i) => {
        let rgb = corNaLinha(Math.min(1, Math.max(0, (centros[i] - linha.top) / linha.height)), paradas)

        while (Math.max(contraste(luz(rgb), luzEscuro), contraste(luz(rgb), luzClaro)) < 4.5) {
          rgb = rgb.map((canal) => Math.round(canal * 0.97))
        }

        const escuroGanha = contraste(luz(rgb), luzEscuro) >= contraste(luz(rgb), luzClaro)
        li.style.setProperty('--cor-estacao', `rgb(${rgb.join(' ')})`)
        li.style.setProperty('--cor-estacao-texto', escuroGanha ? 'var(--cartao-texto)' : 'var(--estacao-texto-claro)')
      })
    }

    // a rolagem dispara muitas vezes por quadro: so atualiza uma vez por quadro
    let quadro = 0
    function aoRolar() {
      if (quadro) return
      quadro = requestAnimationFrame(() => {
        quadro = 0
        rolar()
      })
    }

    function redimensionar() {
      rolar()
      pintarNumeros()
    }

    redimensionar()
    // a fonte muda a altura dos cartoes: pinta de novo quando ela chega
    document.fonts?.ready.then(pintarNumeros)
    window.addEventListener('scroll', aoRolar, { passive: true })
    window.addEventListener('resize', redimensionar)

    return () => {
      cancelAnimationFrame(quadro)
      window.removeEventListener('scroll', aoRolar)
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
