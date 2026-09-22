import { useState } from 'react'
import EmptyState from '../../components/EmptyState'
import PageHeading from '../../components/PageHeading'
import StatusBadge from '../../components/StatusBadge'
import Tabs from '../../components/Tabs'
import { formatCurrency } from '../../utils/format'
import { useApp } from '../../state/useApp'

export default function Requests({ profile }) {
  const { state, dispatch } = useApp()
  const [filter, setFilter] = useState('Em análise')
  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({})

  const visible = state.serviceRequests.filter((request) => request.status === filter)

  const options = ['Em análise', 'Proposta enviada', 'Recusada'].map((status) => ({
    id: status,
    label: status === 'Em análise' ? 'Em análise' : status === 'Recusada' ? 'Recusadas' : 'Respondidas',
    count: state.serviceRequests.filter((request) => request.status === status).length,
  }))

  function send(request) {
    const value = Number(values[request.id])

    if (!value) {
      setErrors({ ...errors, [request.id]: 'Informe o valor da proposta.' })
      return
    }

    dispatch({ type: 'service-request/decide', id: request.id, accepted: true, value })
    setErrors({ ...errors, [request.id]: undefined })
  }

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Solicitações"
        description="Pedidos de orçamento enviados por produtoras credenciadas na plataforma."
      />

      <Tabs options={options} value={filter} onChange={setFilter} />

      {visible.length === 0 ? (
        <EmptyState
          title="Nenhuma solicitação nesta aba"
          description="Quando uma produtora pedir orçamento para a sua empresa, o chamado aparece aqui."
          icon="file"
        />
      ) : (
        <div className="request-grid">
          {visible.map((request) => (
            <article className="request-card" key={request.id}>
              <header>
                <div>
                  <small className="eyebrow">{request.organizer}</small>
                  <h3>{request.event}</h3>
                  <p>{request.scope}</p>
                </div>
                <StatusBadge status={request.status} />
              </header>

              <dl className="request-facts">
                <div>
                  <dt>Período</dt>
                  <dd>{request.period}</dd>
                </div>
                <div>
                  <dt>Local</dt>
                  <dd>{request.venue}</dd>
                </div>
                <div>
                  <dt>Público</dt>
                  <dd>{request.audience}</dd>
                </div>
                {request.value ? (
                  <div>
                    <dt>Proposta enviada</dt>
                    <dd>{formatCurrency(request.value)}</dd>
                  </div>
                ) : null}
              </dl>

              {request.status === 'Em análise' ? (
                <footer className="request-footer">
                  <label className={errors[request.id] ? 'field has-error' : 'field'}>
                    Valor da proposta (R$)
                    <input
                      id={`value-${request.id}`}
                      type="number"
                      min="0"
                      value={values[request.id] ?? ''}
                      onChange={(event) => setValues({ ...values, [request.id]: event.target.value })}
                      placeholder="480000"
                    />
                    {errors[request.id] ? <small className="field-error">{errors[request.id]}</small> : null}
                  </label>
                  <div className="request-actions">
                    <button
                      className="btn-secondary"
                      onClick={() =>
                        dispatch({ type: 'service-request/decide', id: request.id, accepted: false })
                      }
                    >
                      Recusar
                    </button>
                    <button className="btn-approve" onClick={() => send(request)}>
                      Enviar proposta
                    </button>
                  </div>
                </footer>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </>
  )
}
