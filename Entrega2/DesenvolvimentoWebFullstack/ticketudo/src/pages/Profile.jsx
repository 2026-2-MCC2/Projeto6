import { useEffect, useState } from 'react'
import Avatar from '../components/Avatar'
import Carregando from '../components/Carregando'
import Field from '../components/Field'
import PageHeading from '../components/PageHeading'
import { auth } from '../api'
import { iniciais } from '../state/reducer'
import { useApp } from '../state/useApp'
import './Profile.css'

const LIMITE_FOTO = 2 * 1024 * 1024

function dataCadastro(data) {
  if (!data) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(data))
}

export default function Profile({ profile }) {
  const { dispatch } = useApp()
  const [dados, setDados] = useState(null)
  const [form, setForm] = useState({ nome: '', telefone: '', foto_perfil: null })
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    let vivo = true
    auth.eu()
      .then((usuario) => {
        if (!vivo) return
        setDados(usuario)
        setForm({
          nome: usuario.nome || '',
          telefone: usuario.telefone || '',
          foto_perfil: usuario.foto_perfil || null,
        })
      })
      .catch((e) => vivo && setErro(e.message))
    return () => {
      vivo = false
    }
  }, [])

  function escolherFoto(event) {
    const arquivo = event.target.files?.[0]
    if (!arquivo) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(arquivo.type)) {
      setErro('Escolha uma imagem JPG, PNG ou WEBP.')
      return
    }
    if (arquivo.size > LIMITE_FOTO) {
      setErro('A foto deve ter no máximo 2 MB.')
      return
    }
    const leitor = new FileReader()
    leitor.onload = () => setForm((atual) => ({ ...atual, foto_perfil: leitor.result }))
    leitor.onerror = () => setErro('Não foi possível ler a foto.')
    leitor.readAsDataURL(arquivo)
  }

  async function salvar(event) {
    event.preventDefault()
    setErro(null)
    setSalvando(true)
    try {
      const usuario = await auth.atualizarPerfil(form)
      setDados(usuario)
      setForm({ nome: usuario.nome, telefone: usuario.telefone || '', foto_perfil: usuario.foto_perfil || null })
      dispatch({ type: 'sessao/restaurada', usuario })
      dispatch({ type: 'aviso', texto: 'Perfil atualizado.' })
    } catch (e) {
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  if (erro && !dados) return <Carregando erro={erro} aoTentarDeNovo={() => window.location.reload()} />
  if (!dados) return <Carregando />

  const foto = form.foto_perfil || dados.foto_perfil
  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Meu perfil"
        description="Confira seus dados de cadastro e personalize sua identificação na plataforma."
      />
      <form className="perfil-form" onSubmit={salvar}>
        <section className="perfil-card perfil-identidade">
          <div className="perfil-avatar">
            <Avatar initials={iniciais(form.nome)} foto={foto} />
            <label className="btn-secondary perfil-foto-botao">
              Escolher foto
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={escolherFoto} />
            </label>
            {foto ? (
              <button type="button" className="perfil-remover-foto" onClick={() => setForm({ ...form, foto_perfil: null })}>
                Remover foto
              </button>
            ) : null}
            <small>JPG, PNG ou WEBP · até 2 MB</small>
          </div>
          <div className="perfil-dados">
            <span className="perfil-selo">{profile.label}</span>
            <h3>{dados.nome}</h3>
            <p>{dados.email}</p>
            <dl>
              <div><dt>CPF</dt><dd>{dados.cpf || 'Não informado'}</dd></div>
              <div><dt>Cadastro desde</dt><dd>{dataCadastro(dados.criado_em)}</dd></div>
            </dl>
          </div>
        </section>
        <section className="perfil-card">
          <h3>Dados pessoais</h3>
          <p className="perfil-ajuda">Seu e-mail e CPF não podem ser alterados nesta tela.</p>
          <div className="field-row">
            <Field label="Nome completo">
              <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} maxLength={120} required />
            </Field>
            <Field label="Telefone">
              <input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} maxLength={20} placeholder="(11) 99999-9999" />
            </Field>
          </div>
          {erro ? <p className="form-erro">{erro}</p> : null}
          <div className="perfil-acoes">
            <button className="btn-primary" type="submit" disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar alterações'}
            </button>
          </div>
        </section>
      </form>
    </>
  )
}
