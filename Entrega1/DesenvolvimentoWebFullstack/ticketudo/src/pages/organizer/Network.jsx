import { useState } from 'react'
import Field from '../../components/Field'
import Icon from '../../components/Icon'
import PageHeading from '../../components/PageHeading'
import StatusBadge from '../../components/StatusBadge'
import { useApp } from '../../state/useApp'

function SupplierProfile({ supplier, onBack, onRequest, events }) {
  const [eventName, setEventName] = useState(events[0]?.name ?? '')
  const [scope, setScope] = useState('')
  const [error, setError] = useState('')

  function submit(event) {
    event.preventDefault()

    if (scope.trim().length < 4) {
      setError('Descreva o serviço que você precisa contratar.')
      return
    }

    onRequest({ event: eventName, scope: scope.trim() })
    setScope('')
    setError('')
  }

  return (
    <>
      <PageHeading
        eyebrow={supplier.specialty}
        title={supplier.name}
        description={`${supplier.city} · ${supplier.metrics.eventos} eventos atendidos · índice de conformidade ${supplier.metrics.conformidade}`}
      >
        <button className="btn-secondary" onClick={onBack}>
          Voltar à vitrine
        </button>
      </PageHeading>

      <div className="stats">
        <article className="stat">
          <span className="stat-label">Público atendido</span>
          <strong className="stat-value">{supplier.metrics.publico}</strong>
          <small className="stat-trend">
            <i>capacidade de mobilização simultânea</i>
          </small>
        </article>
        <article className="stat">
          <span className="stat-label">Efetivo homologado</span>
          <strong className="stat-value">{supplier.metrics.efetivo}</strong>
          <small className="stat-trend">
            <i>com documentação auditada</i>
          </small>
        </article>
        <article className="stat">
          <span className="stat-label">Incidentes</span>
          <strong className="stat-value">{supplier.metrics.incidentes}</strong>
          <small className="stat-trend">
            <i>seguro de {supplier.metrics.seguro}</i>
          </small>
        </article>
      </div>

      <div className="split-columns">
        <section className="card">
          <h3>Certificações verificadas</h3>
          <p>Documentos conferidos pela auditoria da plataforma.</p>
          <ul className="credential-list">
            {supplier.credentials.map((item) => (
              <li key={item.label}>
                <Icon name="check" size={14} />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.detail}</small>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h3>Capacidade operacional</h3>
          <p>Recursos homologados para grandes públicos.</p>
          <ul className="credential-list">
            {supplier.resources.map((item) => (
              <li key={item.label}>
                <Icon name="briefcase" size={14} />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.value}</small>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="section-title">
        <h3>Solicitar orçamento</h3>
      </div>
      <form className="form-card" onSubmit={submit} noValidate>
        <div className="field-row">
          <Field label="Evento">
            <select id="request-event" value={eventName} onChange={(event) => setEventName(event.target.value)}>
              {events.map((item) => (
                <option key={item.id}>{item.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Serviço necessário" error={error}>
            <input
              id="request-scope"
              value={scope}
              onChange={(event) => setScope(event.target.value)}
              placeholder="Ex: segurança perimetral e revista"
            />
          </Field>
        </div>
        <button type="submit" className="btn-primary">
          Enviar solicitação →
        </button>
      </form>
    </>
  )
}

export default function Network({ profile }) {
  const { state, dispatch } = useApp()
  const [selected, setSelected] = useState(null)

  const supplier = state.suppliers.find((item) => item.id === selected)

  if (supplier) {
    return (
      <SupplierProfile
        supplier={supplier}
        events={state.events}
        onBack={() => setSelected(null)}
        onRequest={({ event, scope }) => {
          const target = state.events.find((item) => item.name === event)

          dispatch({
            type: 'service-request/create',
            supplierId: supplier.id,
            organizer: state.session.name,
            event,
            scope,
            period: target?.date ?? 'A definir',
            venue: `${target?.venue ?? ''} · ${target?.city ?? ''}`,
            audience: `${(target?.capacity ?? 0).toLocaleString('pt-BR')} pessoas`,
          })
          setSelected(null)
        }}
      />
    )
  }

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Fornecedores credenciados"
        description="Empresas homologadas pela auditoria, com certidões e capacidade operacional verificadas."
      />

      <div className="partner-grid">
        {state.suppliers.map((item) => (
          <article className="partner-card" key={item.id}>
            <div className={`partner-cover ${item.cover}`}>
              <Icon name="briefcase" size={18} />
            </div>
            <div className="partner-body">
              {item.verified ? <StatusBadge status="Aprovado" /> : <StatusBadge status="Em análise" />}
              <h3>{item.name}</h3>
              <p>
                {item.specialty} · {item.city}
              </p>
              <dl className="partner-metrics">
                <div>
                  <dt>Público</dt>
                  <dd>{item.metrics.publico}</dd>
                </div>
                <div>
                  <dt>Incidentes</dt>
                  <dd>{item.metrics.incidentes}</dd>
                </div>
                <div>
                  <dt>Conformidade</dt>
                  <dd>{item.metrics.conformidade}</dd>
                </div>
              </dl>
              <button className="btn-soft" onClick={() => setSelected(item.id)}>
                Ver perfil e solicitar
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
