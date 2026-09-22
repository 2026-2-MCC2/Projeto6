import { useState } from 'react'
import Field from '../../components/Field'
import PageHeading from '../../components/PageHeading'
import { formatCurrency } from '../../utils/format'
import { useApp } from '../../state/useApp'

const emptyForm = {
  name: '',
  category: 'Festival musical',
  date: '',
  venue: '',
  city: '',
  capacity: '',
  price: '',
}

const categories = ['Festival musical', 'Show', 'Esporte', 'Teatro', 'Congresso']

function validate(form) {
  const errors = {}

  if (form.name.trim().length < 3) errors.name = 'Dê um nome oficial ao evento.'
  if (!form.date) errors.date = 'Informe a data de realização.'
  if (form.venue.trim().length < 3) errors.venue = 'Informe o local do evento.'
  if (form.city.trim().length < 3) errors.city = 'Informe cidade e estado.'
  if (!Number(form.capacity)) errors.capacity = 'Informe a capacidade estimada.'
  if (!Number(form.price)) errors.price = 'Informe o preço facial do primeiro lote.'

  return errors
}

export default function NewEvent({ profile, onNavigate }) {
  const { dispatch } = useApp()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  const capacity = Number(form.capacity) || 0
  const price = Number(form.price) || 0
  const gross = capacity * price
  const fee = gross * 0.01
  const custody = gross * 0.06

  function update(field, value) {
    setForm({ ...form, [field]: value })

    if (errors[field]) setErrors({ ...errors, [field]: undefined })
  }

  function submit(event) {
    event.preventDefault()
    const found = validate(form)

    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }

    dispatch({ type: 'event/create', ...form })
    setForm(emptyForm)
    onNavigate('events')
  }

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Vamos criar algo memorável."
        description="Conte o essencial agora. Lotes e fornecedores podem ser ajustados depois da publicação."
      />

      <form className="create-layout" onSubmit={submit} noValidate>
        <section className="form-card">
          <h3>01 - Sobre o evento</h3>

          <Field label="Nome oficial do evento" error={errors.name}>
            <input
              id="event-name"
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              placeholder="Ex: Festival Eletrônico Pulse 2026"
            />
          </Field>

          <div className="field-row">
            <Field label="Categoria / segmento">
              <select
                id="event-category"
                value={form.category}
                onChange={(event) => update('category', event.target.value)}
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </Field>
            <Field label="Data de realização" error={errors.date}>
              <input
                id="event-date"
                type="date"
                value={form.date}
                onChange={(event) => update('date', event.target.value)}
              />
            </Field>
          </div>

          <div className="field-row">
            <Field label="Local homologado" error={errors.venue}>
              <input
                id="event-venue"
                value={form.venue}
                onChange={(event) => update('venue', event.target.value)}
                placeholder="Ex: Autódromo de Interlagos"
              />
            </Field>
            <Field label="Cidade e estado" error={errors.city}>
              <input
                id="event-city"
                value={form.city}
                onChange={(event) => update('city', event.target.value)}
                placeholder="Ex: São Paulo, SP"
              />
            </Field>
          </div>

          <h3>02 - Primeiro lote</h3>

          <div className="field-row">
            <Field label="Capacidade estimada" error={errors.capacity}>
              <input
                id="event-capacity"
                type="number"
                min="0"
                value={form.capacity}
                onChange={(event) => update('capacity', event.target.value)}
                placeholder="25000"
              />
            </Field>
            <Field label="Preço facial inteira (R$)" error={errors.price}>
              <input
                id="event-price"
                type="number"
                min="0"
                value={form.price}
                onChange={(event) => update('price', event.target.value)}
                placeholder="250"
              />
            </Field>
          </div>

          <button type="submit" className="btn-primary">
            Publicar evento →
          </button>
        </section>

        <aside className="estimate-card">
          <small className="eyebrow">Previsão financeira</small>
          <h3>{formatCurrency(gross)}</h3>
          <p>Bilheteria bruta estimada para o lote informado.</p>
          <dl>
            <div>
              <dt>Taxa da plataforma (1%)</dt>
              <dd>{formatCurrency(fee)}</dd>
            </div>
            <div>
              <dt>Retido em custódia (6%)</dt>
              <dd>{formatCurrency(custody)}</dd>
            </div>
            <div>
              <dt>Repasse previsto</dt>
              <dd>{formatCurrency(gross - fee - custody)}</dd>
            </div>
          </dl>
          <p className="estimate-note">
            A custódia é liberada em D+1 após a confirmação de entrada do público.
          </p>
        </aside>
      </form>
    </>
  )
}
