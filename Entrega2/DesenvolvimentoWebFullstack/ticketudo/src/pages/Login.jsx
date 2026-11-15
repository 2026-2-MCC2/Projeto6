import { useEffect, useRef, useState } from 'react'
import Field from '../components/Field'
import Icon from '../components/Icon'
import Logo from '../components/Logo'
import { auth } from '../api'
import { guardarToken } from '../api/client'
import { profiles, roleOrder } from '../data/profiles'
import { TIPO_POR_PAPEL } from '../state/reducer'
import { useApp } from '../state/useApp'
import { mascaraCpf, mascaraTelefone } from '../utils/format'
import './Login.css'

const formVazio = { nome: '', email: '', cpf: '', telefone: '', senha: '', codigo: '' }

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
  const [senhaVisivel, setSenhaVisivel] = useState(false)
  const [recuperacao, setRecuperacao] = useState(false)
  const [codigoEnviado, setCodigoEnviado] = useState(false)
  const googleBotao = useRef(null)

  const profile = profiles[papel]
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (recuperacao || !googleClientId || !googleBotao.current) return undefined

    function renderizarGoogle() {
      if (!window.google?.accounts?.id || !googleBotao.current) return
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          setEnviando(true)
          setErros({})
          try {
            const resposta = await auth.google(credential, TIPO_POR_PAPEL[papel])
            guardarToken(resposta.token)
            dispatch({ type: 'sessao/entrou', usuario: resposta.usuario })
          } catch (e) {
            setErros({ geral: e.message })
          } finally {
            setEnviando(false)
          }
        },
      })
      googleBotao.current.innerHTML = ''
      window.google.accounts.id.renderButton(googleBotao.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        width: 320,
        text: 'continue_with',
      })
    }

    if (window.google?.accounts?.id) {
      renderizarGoogle()
      return undefined
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = renderizarGoogle
    document.head.appendChild(script)
    return () => {
      script.onload = null
    }
  }, [dispatch, googleClientId, papel, recuperacao])

  function atualizar(campo, valor) {
    setForm({ ...form, [campo]: valor })
    if (erros[campo]) setErros({ ...erros, [campo]: undefined })
  }

  async function solicitarCodigo(event) {
      event.preventDefault()
      if (!form.email.trim()) {
        setErros({ email: 'Informe o e-mail da sua conta.' })
        return
      }
      setEnviando(true)
      setErros({})
      try {
        await auth.solicitarRedefinicao(form.email.trim().toLowerCase())
        setCodigoEnviado(true)
      } catch (e) {
        setErros({ geral: e.message })
      } finally {
        setEnviando(false)
      }
  }

  async function redefinirSenha(event) {
      event.preventDefault()
      if (form.senha.length < 6) {
        setErros({ senha: 'A senha precisa ter ao menos 6 caracteres.' })
        return
      }
      setEnviando(true)
      setErros({})
      try {
        await auth.redefinirSenha(form.email.trim().toLowerCase(), form.codigo, form.senha)
        setRecuperacao(false)
        setCodigoEnviado(false)
        setErros({ geral: 'Senha redefinida. Agora você já pode entrar.' })
        setForm((atual) => ({ ...atual, codigo: '', senha: '' }))
      } catch (e) {
        setErros({ geral: e.message })
      } finally {
        setEnviando(false)
      }
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

          <h2>
            {recuperacao
              ? codigoEnviado
                ? 'Crie uma nova senha'
                : 'Recupere sua senha'
              : cadastro
                ? `Criar conta de ${profile.label.toLowerCase()}`
                : 'Acesse seu workspace'}
          </h2>

          {!recuperacao ? <div className="login-abas">
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
          </div> : null}

          {erros.geral ? (
            <p className="form-erro" role="alert">
              {erros.geral}
            </p>
          ) : null}

          {recuperacao ? (
            <form onSubmit={codigoEnviado ? redefinirSenha : solicitarCodigo} noValidate>
              <Field label="E-mail" error={erros.email}>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => atualizar('email', e.target.value)}
                  placeholder="voce@suaempresa.com.br…"
                />
              </Field>
              {codigoEnviado ? (
                <>
                  <Field label="Código recebido">
                    <input
                      name="codigo"
                      inputMode="numeric"
                      maxLength={6}
                      value={form.codigo || ''}
                      onChange={(e) => atualizar('codigo', e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                    />
                  </Field>
                  <Field label="Nova senha" error={erros.senha}>
                    <input
                      name="senha"
                      type={senhaVisivel ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={form.senha}
                      onChange={(e) => atualizar('senha', e.target.value)}
                      placeholder="Digite sua nova senha…"
                    />
                  </Field>
                </>
              ) : null}
              <button type="submit" className="btn-sticker btn-block" disabled={enviando}>
                {enviando ? 'Enviando…' : codigoEnviado ? 'Redefinir senha' : 'Enviar código'}
              </button>
              <button type="button" className="login-link" onClick={() => {
                setRecuperacao(false)
                setCodigoEnviado(false)
                setErros({})
              }}>
                Voltar para entrar
              </button>
            </form>
          ) : <form onSubmit={enviar} noValidate>
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
                      onChange={(e) => atualizar('cpf', mascaraCpf(e.target.value))}
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
                      onChange={(e) => atualizar('telefone', mascaraTelefone(e.target.value))}
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
              <span className="login-senha-controle">
                <input
                  id="login-password"
                  name="senha"
                  type={senhaVisivel ? 'text' : 'password'}
                  autoComplete={cadastro ? 'new-password' : 'current-password'}
                  value={form.senha}
                  onChange={(e) => atualizar('senha', e.target.value)}
                  placeholder="Digite sua senha…"
                />
                <button
                  type="button"
                  className="login-senha-olho"
                  aria-label={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={senhaVisivel}
                  onClick={() => setSenhaVisivel((visivel) => !visivel)}
                >
                  <Icon name={senhaVisivel ? 'eye-off' : 'eye'} size={19} />
                </button>
              </span>
            </Field>

            <button type="submit" className="btn-sticker btn-block" disabled={enviando}>
              {enviando ? 'Enviando…' : cadastro ? 'Criar conta e entrar' : 'Entrar'} <b aria-hidden="true">→</b>
            </button>
            {!cadastro ? (
              <>
                <button type="button" className="login-link" onClick={() => {
                  setRecuperacao(true)
                  setErros({})
                }}>
                  Esqueci minha senha
                </button>
                {googleClientId ? <div ref={googleBotao} className="login-google" /> : null}
              </>
            ) : null}
          </form>}
        </div>

        <small className="login-legal">
          Conta de administrador não sai pelo cadastro: ela é criada direto no banco, pelo seed.
        </small>
      </section>
    </div>
  )
}
