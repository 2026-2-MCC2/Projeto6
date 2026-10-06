import { useState } from 'react'
import Field from '../components/Field'
import Icon from '../components/Icon'
import Logo from '../components/Logo'
import { auth } from '../api'
import { guardarToken } from '../api/client'
import { profiles, roleOrder } from '../data/profiles'
import { TIPO_POR_PAPEL } from '../state/reducer'
import { useApp } from '../state/useApp'

const formVazio = { nome: '', email: '', cpf: '', telefone: '', senha: '' }

function soDigitos(valor) {
  return valor.replace(/\D/g, '')
}

function validar(form, cadastro) {
  const erros = {}

  if (cadastro && form.nome.trim().length < 3) {
    erros.nome = 'Informe o nome que vai aparecer no seu portal.'
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    erros.email = 'Informe um e-mail válido, como voce@empresa.com.br.'
  }

  if (cadastro && soDigitos(form.cpf).length !== 11) {
    erros.cpf = 'O CPF precisa ter 11 dígitos.'
  }

  if (form.senha.length < 6) {
    erros.senha = 'A senha precisa ter ao menos 6 caracteres.'
  }

  return erros
}

export default function Login({ onBack }) {
  const { dispatch } = useApp()
  const [papel, setPapel] = useState('organizer')
  const [cadastro, setCadastro] = useState(false)
  const [form, setForm] = useState(formVazio)
  const [erros, setErros] = useState({})
  const [enviando, setEnviando] = useState(false)

  const profile = profiles[papel]

  function atualizar(campo, valor) {
    setForm({ ...form, [campo]: valor })
    if (erros[campo]) setErros({ ...erros, [campo]: undefined })
  }

  async function enviar(event) {
    event.preventDefault()
    const encontrados = validar(form, cadastro)

    if (Object.keys(encontrados).length > 0) {
      setErros(encontrados)
      return
    }

    setEnviando(true)
    try {
      const resposta = cadastro
        ? await auth.cadastro({
            nome: form.nome.trim(),
            email: form.email.trim(),
            cpf: soDigitos(form.cpf),
            telefone: form.telefone.trim() || undefined,
            senha: form.senha,
            tipo: TIPO_POR_PAPEL[papel],
          })
        : await auth.login(form.email.trim(), form.senha)

      guardarToken(resposta.token)
      dispatch({
        type: 'sessao/entrou',
        usuario: resposta.usuario,
        aviso: cadastro ? 'Conta criada. Bem-vindo ao TrocaTicket.' : undefined,
      })
    } catch (e) {
      // 409 e sempre e-mail ou cpf repetido; o resto cai no aviso geral
      if (e.status === 409) {
        setErros({ geral: e.message })
      } else if (e.status === 401) {
        setErros({ geral: 'E-mail ou senha incorretos.' })
      } else {
        setErros({ geral: e.message })
      }
    } finally {
      setEnviando(false)
    }
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
        {cadastro ? (
          <>
            <small className="eyebrow">Escolha seu portal</small>
            <div className="role-options">
              {roleOrder.map((id) => (
                <button
                  className={papel === id ? 'is-selected' : undefined}
                  aria-pressed={papel === id}
                  onClick={() => setPapel(id)}
                  key={id}
                  type="button"
                >
                  <b className={profiles[id].theme}>
                    <Icon name={profiles[id].icon} size={13} />
                  </b>
                  <strong>{profiles[id].label}</strong>
                  <small>{profiles[id].tagline}</small>
                </button>
              ))}
            </div>
          </>
        ) : null}

        <h2>{cadastro ? `Criar conta de ${profile.label.toLowerCase()}` : 'Acesse seu workspace'}</h2>

        <div className="tabs">
          <button className={cadastro ? undefined : 'is-selected'} onClick={() => setCadastro(false)}>
            Entrar
          </button>
          <button className={cadastro ? 'is-selected' : undefined} onClick={() => setCadastro(true)}>
            Cadastrar
          </button>
        </div>

        {erros.geral ? <p className="form-erro">{erros.geral}</p> : null}

        <form onSubmit={enviar} noValidate>
          {cadastro ? (
            <>
              <Field label="Seu nome" error={erros.nome} hint="É este nome que aparece no canto do workspace.">
                <input
                  id="login-name"
                  value={form.nome}
                  onChange={(e) => atualizar('nome', e.target.value)}
                  placeholder="Como podemos te chamar?"
                />
              </Field>

              <div className="field-row">
                <Field label="CPF" error={erros.cpf}>
                  <input
                    id="login-cpf"
                    value={form.cpf}
                    onChange={(e) => atualizar('cpf', e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </Field>
                <Field label="Telefone">
                  <input
                    id="login-telefone"
                    value={form.telefone}
                    onChange={(e) => atualizar('telefone', e.target.value)}
                    placeholder="(11) 99999-0000"
                  />
                </Field>
              </div>
            </>
          ) : null}

          <Field label="E-mail" error={erros.email}>
            <input
              id="login-email"
              type="email"
              value={form.email}
              onChange={(e) => atualizar('email', e.target.value)}
              placeholder="voce@suaempresa.com.br"
            />
          </Field>

          <Field label="Senha" error={erros.senha}>
            <input
              id="login-password"
              type="password"
              value={form.senha}
              onChange={(e) => atualizar('senha', e.target.value)}
              placeholder="Digite sua senha"
            />
          </Field>

          <button type="submit" className="btn-primary btn-block" disabled={enviando}>
            {enviando ? 'Enviando…' : cadastro ? 'Criar conta e entrar' : 'Entrar'} <b>→</b>
          </button>
        </form>

        <small className="login-legal">
          Conta de administrador não sai pelo cadastro: ela é criada direto no banco, pelo seed.
        </small>
      </section>
    </div>
  )
}
