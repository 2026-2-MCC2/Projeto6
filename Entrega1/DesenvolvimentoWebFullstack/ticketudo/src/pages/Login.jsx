import { useState } from 'react'
import Field from '../components/Field'
import Icon from '../components/Icon'
import Logo from '../components/Logo'

const roleOptions = [
  { id: 'admin', label: 'Administrador', description: 'Gestão da plataforma', icon: 'shield', theme: 'role-admin' },
  { id: 'supplier', label: 'Fornecedor', description: 'Ofereça seus serviços', icon: 'briefcase', theme: 'role-supplier' },
  { id: 'organizer', label: 'Organizador', description: 'Crie seu próximo evento', icon: 'ticket', theme: 'role-organizer' },
]

export default function Login({ onSelectRole }) {
  const [signup, setSignup] = useState(false)

  return (
    <div className="login">
      <section className="login-art">
        <Logo />
        <div className="login-art-copy">
          <small className="eyebrow">A plataforma que conecta</small>
          <h1>
            Boas ideias
            <br />
            <i>encontram</i>
            <br />o time certo.
          </h1>
          <p>Do primeiro briefing ao último aplauso, tudo para o seu evento em um só lugar.</p>
        </div>
      </section>

      <section className="login-form">
        <small className="eyebrow">Bem-vindo de volta</small>
        <h2>{signup ? 'Crie sua conta' : 'Acesse seu workspace'}</h2>
        <p>Escolha seu perfil para continuar.</p>

        <div className="tabs">
          <button className={signup ? undefined : 'is-selected'} onClick={() => setSignup(false)}>
            Entrar
          </button>
          <button className={signup ? 'is-selected' : undefined} onClick={() => setSignup(true)}>
            Cadastrar
          </button>
        </div>

        {signup && (
          <Field label="Seu nome">
            <input placeholder="Como podemos te chamar?" />
          </Field>
        )}
        <Field label="E-mail">
          <input type="email" placeholder="voce@empresa.com" />
        </Field>
        <Field label="Senha">
          <input type="password" placeholder="Digite sua senha" />
        </Field>

        <div className="form-row">
          <label>
            <input type="checkbox" /> Lembrar de mim
          </label>
          <button className="btn-link">Esqueci minha senha</button>
        </div>

        <button className="btn-primary btn-block" onClick={() => onSelectRole('admin')}>
          Continuar <b>→</b>
        </button>

        <div className="login-divider">ou entre como</div>
        <div className="role-options">
          {roleOptions.map((role) => (
            <button onClick={() => onSelectRole(role.id)} key={role.id}>
              <b className={role.theme}>
                <Icon name={role.icon} size={13} />
              </b>
              <strong>{role.label}</strong>
              <small>{role.description}</small>
            </button>
          ))}
        </div>

        <small className="login-legal">
          Ao continuar, você concorda com nossos <u>Termos de uso</u> e <u>Política de privacidade</u>.
        </small>
      </section>
    </div>
  )
}
