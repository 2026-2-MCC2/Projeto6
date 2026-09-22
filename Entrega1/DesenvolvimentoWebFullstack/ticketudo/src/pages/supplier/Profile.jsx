import { useState } from 'react'
import Avatar from '../../components/Avatar'
import Field from '../../components/Field'
import Icon from '../../components/Icon'
import PageHeading from '../../components/PageHeading'
import { suppliers } from '../../data/platform'
import { useApp } from '../../state/useApp'

export default function Profile({ profile }) {
  const { state, dispatch } = useApp()
  const { session } = state
  const [form, setForm] = useState({ name: session.name, email: session.email })
  const [error, setError] = useState('')

  const showcase = suppliers[0]

  function submit(event) {
    event.preventDefault()

    if (form.name.trim().length < 3) {
      setError('O nome precisa ter ao menos 3 caracteres.')
      return
    }

    dispatch({ type: 'session/update-profile', name: form.name, email: form.email })
    setError('')
  }

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Meu perfil"
        description="É assim que produtoras enxergam a sua empresa na vitrine de credenciados."
      />

      <section className="profile-card">
        <div className="profile-cover" />
        <Avatar initials={session.initials} />
        <h3>{session.name}</h3>
        <p>
          {profile.label} · {showcase.city}
        </p>

        <form onSubmit={submit} noValidate>
          <div className="field-row">
            <Field label="Nome exibido" error={error} hint="Aparece na barra lateral e na vitrine.">
              <input
                id="profile-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </Field>
            <Field label="E-mail de contato">
              <input
                id="profile-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </Field>
          </div>
          <button type="submit" className="btn-primary">
            Salvar alterações
          </button>
        </form>
      </section>

      <div className="section-title">
        <h3>Credenciais verificadas</h3>
      </div>
      <section className="card">
        <ul className="credential-list">
          {showcase.credentials.map((item) => (
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
    </>
  )
}
