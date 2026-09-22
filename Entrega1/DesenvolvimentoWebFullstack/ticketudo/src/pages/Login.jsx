import { useState } from 'react'
import Field from '../components/Field'
import Icon from '../components/Icon'
import Logo from '../components/Logo'
import { profiles, roleOrder } from '../data/profiles'
import { useApp } from '../state/useApp'

const emptyForm = { name: '', email: '', password: '' }

function validate(form, signup) {
  const errors = {}

  if (signup && form.name.trim().length < 3) {
    errors.name = 'Informe o nome que vai aparecer no seu portal.'
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Informe um e-mail válido, como voce@empresa.com.br.'
  }

  if (form.password.length < 6) {
    errors.password = 'A senha precisa ter ao menos 6 caracteres.'
  }

  return errors
}

export default function Login({ onBack }) {
  const { dispatch } = useApp()
  const [role, setRole] = useState('organizer')
  const [signup, setSignup] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  const profile = profiles[role]

  function update(field, value) {
    setForm({ ...form, [field]: value })

    if (errors[field]) setErrors({ ...errors, [field]: undefined })
  }

  function submit(event) {
    event.preventDefault()
    const found = validate(form, signup)

    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }

    dispatch({
      type: 'session/sign-in',
      role,
      name: signup ? form.name : '',
      email: form.email.trim(),
    })
  }

  return (
    <div className="login">
      <section className="login-art">
        <button className="login-back" onClick={onBack}>
          <Icon name="logout" size={14} /> Voltar ao site
        </button>
        <div className="login-art-copy">
          <Logo />
          <small className="eyebrow">Portal do {profile.label.toLowerCase()}</small>
          <h1>
            Boas ideias
            <br />
            <i>encontram</i>
            <br />o time certo.
          </h1>
          <p>{profile.pitch}</p>
        </div>
      </section>

      <section className="login-form">
        <small className="eyebrow">Escolha seu portal</small>
        <div className="role-options">
          {roleOrder.map((id) => (
            <button
              className={role === id ? 'is-selected' : undefined}
              aria-pressed={role === id}
              onClick={() => setRole(id)}
              key={id}
            >
              <b className={profiles[id].theme}>
                <Icon name={profiles[id].icon} size={13} />
              </b>
              <strong>{profiles[id].label}</strong>
              <small>{profiles[id].tagline}</small>
            </button>
          ))}
        </div>

        <h2>{signup ? `Criar conta de ${profile.label.toLowerCase()}` : 'Acesse seu workspace'}</h2>

        <div className="tabs">
          <button className={signup ? undefined : 'is-selected'} onClick={() => setSignup(false)}>
            Entrar
          </button>
          <button className={signup ? 'is-selected' : undefined} onClick={() => setSignup(true)}>
            Cadastrar
          </button>
        </div>

        <form onSubmit={submit} noValidate>
          {signup ? (
            <Field
              label="Seu nome"
              error={errors.name}
              hint="É este nome que aparece no canto do workspace."
            >
              <input
                id="login-name"
                value={form.name}
                onChange={(event) => update('name', event.target.value)}
                placeholder="Como podemos te chamar?"
              />
            </Field>
          ) : null}

          <Field label="E-mail corporativo" error={errors.email}>
            <input
              id="login-email"
              type="email"
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
              placeholder="voce@suaempresa.com.br"
            />
          </Field>

          <Field label="Senha" error={errors.password}>
            <input
              id="login-password"
              type="password"
              value={form.password}
              onChange={(event) => update('password', event.target.value)}
              placeholder="Digite sua senha"
            />
          </Field>

          <div className="form-row">
            <label htmlFor="login-remember">
              <input id="login-remember" type="checkbox" /> Lembrar de mim
            </label>
            <button type="button" className="btn-link">
              Esqueci minha senha
            </button>
          </div>

          <button type="submit" className="btn-primary btn-block">
            {signup ? 'Criar conta e entrar' : 'Entrar'} <b>→</b>
          </button>
        </form>

        <small className="login-legal">
          Ao continuar, você concorda com nossos <u>Termos de uso</u> e <u>Política de privacidade</u>.
        </small>
      </section>
    </div>
  )
}
