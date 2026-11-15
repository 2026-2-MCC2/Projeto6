import { useState } from 'react'
import Field from '../components/Field'
import Icon from '../components/Icon'
import Logo from '../components/Logo'
import { auth } from '../api'
import { guardarToken } from '../api/client'
import { profiles, roleOrder } from '../data/profiles'
import { TIPO_POR_PAPEL } from '../state/reducer'
import { useApp } from '../state/useApp'
import './Login.css'

const formVazio = { nome: '', email: '', cpf: '', telefone: '', senha: '' }

// id de cada campo, na ordem em que aparecem na tela: o foco vai para o
// primeiro que tiver erro
const CAMPOS_NA_TELA = [
  ['nome', 'login-name'],
  ['cpf', 'login-cpf'],
  ['email', 'login-email'],
  ['senha', 'login-password'],
]

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
      const primeiro = CAMPOS_NA_TELA.find(([campo]) => encontrados[campo])
      if (primeiro) document.getElementById(primeiro[1])?.focus()
      return
    }

    setEnviando(true)
    try {
      const resposta = cadastro
        ? await auth.cadastro({
            nome: form.nome.trim(),
            email: form.email.trim().toLowerCase(),
            cpf: soDigitos(form.cpf),
            telefone: form.telefone.trim() || undefined,
            senha: form.senha,
            tipo: TIPO_POR_PAPEL[papel],
          })
        : await auth.login(form.email.trim().toLowerCase(), form.senha)

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
      <section className="login-art faixa-escura">
        <button className="btn-sticker btn-sticker-claro login-back" type="button" onClick={onBack}>
          <Icon name="logout" size={16} /> Voltar ao site
        </button>
        <div className="login-art-copy">
          <Logo />
          <h1>Boas ideias encontram o time certo.</h1>
          <p>{profile.pitch}</p>
          <span className="login-portal">Portal do {profile.label.toLowerCase()}</span>
        </div>
      </section>

      <section className="login-form faixa-clara">
        <div className="login-cartao">
          {cadastro ? (
            <>
              <p className="login-subtitulo">Escolha seu portal</p>
              <div className="role-options">
                {roleOrder.map((id) => (
                  <button
                    className={papel === id ? 'is-selected' : undefined}
                    aria-pressed={papel === id}
                    onClick={() => setPapel(id)}
                    key={id}
                    type="button"
                  >
                    <b>
                      <Icon name={profiles[id].icon} size={16} />
                    </b>
                    <strong>{profiles[id].label}</strong>
                    <small>{profiles[id].tagline}</small>
                  </button>
                ))}
              </div>
            </>
          ) : null}

          <h2>{cadastro ? `Criar conta de ${profile.label.toLowerCase()}` : 'Acesse seu workspace'}</h2>

          <div className="login-abas">
            <button
              type="button"
              className={cadastro ? undefined : 'is-selected'}
              aria-pressed={!cadastro}
              onClick={() => setCadastro(false)}
            >
              Entrar
            </button>
            <button
              type="button"
              className={cadastro ? 'is-selected' : undefined}
              aria-pressed={cadastro}
              onClick={() => setCadastro(true)}
            >
              Cadastrar
            </button>
          </div>

          {erros.geral ? (
            <p className="form-erro" role="alert">
              {erros.geral}
            </p>
          ) : null}

          <form onSubmit={enviar} noValidate>
            {cadastro ? (
              <>
                <Field label="Seu nome" error={erros.nome} hint="É este nome que aparece no canto do workspace.">
                  <input
                    id="login-name"
                    name="nome"
                    autoComplete="name"
                    value={form.nome}
                    onChange={(e) => atualizar('nome', e.target.value)}
                    placeholder="Ex.: Marina Lopes…"
                  />
                </Field>

                <div className="field-row">
                  <Field label="CPF" error={erros.cpf}>
                    <input
                      id="login-cpf"
                      name="cpf"
                      inputMode="numeric"
                      autoComplete="off"
                      value={form.cpf}
                      onChange={(e) => atualizar('cpf', e.target.value)}
                      placeholder="000.000.000-00…"
                    />
                  </Field>
                  <Field label="Telefone">
                    <input
                      id="login-telefone"
                      name="telefone"
                      type="tel"
                      autoComplete="tel"
                      value={form.telefone}
                      onChange={(e) => atualizar('telefone', e.target.value)}
                      placeholder="(11) 99999-0000…"
                    />
                  </Field>
                </div>
              </>
            ) : null}

            <Field label="E-mail" error={erros.email}>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={form.email}
                onChange={(e) => atualizar('email', e.target.value)}
                placeholder="voce@suaempresa.com.br…"
              />
            </Field>

            <Field label="Senha" error={erros.senha}>
              <input
                id="login-password"
                name="senha"
                type="password"
                autoComplete={cadastro ? 'new-password' : 'current-password'}
                value={form.senha}
                onChange={(e) => atualizar('senha', e.target.value)}
                placeholder="Digite sua senha…"
              />
            </Field>

            <button type="submit" className="btn-sticker btn-block" disabled={enviando}>
              {enviando ? 'Enviando…' : cadastro ? 'Criar conta e entrar' : 'Entrar'} <b aria-hidden="true">→</b>
            </button>
          </form>
        </div>

        <small className="login-legal">
          Conta de administrador não sai pelo cadastro: ela é criada direto no banco, pelo seed.
        </small>
      </section>
    </div>
  )
}
