import { useState } from 'react'
import { moeda } from '../utils/format'
import { calcularTicket } from '../utils/ticket'

// Calculadora da pagina inicial, no formato de um ingresso picotado.
// Os valores iniciais sao so um exemplo; a conta e a da plataforma.
const EXEMPLO = { custo: '48.000', publico: '600', margem: '20' }

// aceita "48.000", "48000" e "48000,50"
function lerNumero(texto) {
  const limpo = String(texto).trim().replace(/\./g, '').replace(',', '.')
  return limpo === '' ? NaN : Number(limpo)
}

export default function CalculadoraIngresso() {
  const [valores, setValores] = useState(EXEMPLO)

  const ticket = calcularTicket({
    custoTotal: lerNumero(valores.custo),
    publico: lerNumero(valores.publico),
    margem: lerNumero(valores.margem) / 100,
  })

  function mudar(campo) {
    return (evento) => setValores((atuais) => ({ ...atuais, [campo]: evento.target.value }))
  }

  return (
    <form
      className="ingresso"
      aria-labelledby="calculadora-titulo"
      onSubmit={(evento) => evento.preventDefault()}
    >
      <div className="ingresso-topo">
        <span>Faça a conta</span>
        <span>exemplo</span>
      </div>
      <h2 id="calculadora-titulo">Seu ingresso, em três números</h2>

      <div className="ingresso-campos">
        <div className="ingresso-campo">
          <label htmlFor="calc-custo">Custo total do evento</label>
          <div className="ingresso-linha">
            <span>R$</span>
            <input
              id="calc-custo"
              name="custo"
              inputMode="numeric"
              autoComplete="off"
              value={valores.custo}
              onChange={mudar('custo')}
            />
          </div>
        </div>

        <div className="ingresso-campo">
          <label htmlFor="calc-publico">Público esperado</label>
          <div className="ingresso-linha">
            <input
              id="calc-publico"
              name="publico"
              inputMode="numeric"
              autoComplete="off"
              value={valores.publico}
              onChange={mudar('publico')}
            />
            <span className="depois">pessoas</span>
          </div>
        </div>

        <div className="ingresso-campo">
          <label htmlFor="calc-margem">Margem desejada</label>
          <div className="ingresso-linha">
            <input
              id="calc-margem"
              name="margem"
              inputMode="numeric"
              autoComplete="off"
              aria-describedby="calc-margem-dica"
              value={valores.margem}
              onChange={mudar('margem')}
            />
            <span className="depois">%</span>
          </div>
          <small id="calc-margem-dica">De 0 a 99%, sobre a receita.</small>
        </div>
      </div>

      <div className="ingresso-picote" aria-hidden="true" />

      <dl className="ingresso-resultado" aria-live="polite">
        <div>
          <dt>Ticket de equilíbrio</dt>
          <dd>{ticket ? moeda(ticket.ticketEquilibrio) : '—'}</dd>
        </div>
        <div className="alvo">
          <dt>Ticket-alvo</dt>
          <dd>{ticket ? moeda(ticket.ticketAlvo) : '—'}</dd>
        </div>
      </dl>
      <p className="ingresso-formula">
        Alvo = custo ÷ (público × (1 − margem)). A mesma fórmula da plataforma.
      </p>
    </form>
  )
}
