import { useState } from 'react'
import Carregando from '../../components/Carregando'
import Field from '../../components/Field'
import PageHeading from '../../components/PageHeading'
import StatusBadge from '../../components/StatusBadge'
import { fornecedores } from '../../api'
import { useRecurso } from '../../hooks/useRecurso'
import { moeda, rotulo } from '../../utils/format'
import { useApp } from '../../state/useApp'

function CriarPerfil({ onPronto }) {
  const { dispatch } = useApp()
  const [form, setForm] = useState({ nome_empresa: '', cnpj: '', descricao: '' })
  const [erro, setErro] = useState(null)

  async function enviar(e) {
    e.preventDefault()
    setErro(null)
    try {
      await fornecedores.criarPerfil({
        nome_empresa: form.nome_empresa,
        cnpj: form.cnpj.replace(/\D/g, ''),
        descricao: form.descricao || undefined,
      })
      dispatch({ type: 'aviso', texto: 'Perfil criado. Agora cadastre seus serviços.' })
      onPronto()
    } catch (err) {
      setErro(err.message)
    }
  }

  return (
    <form className="form-card" onSubmit={enviar}>
      <h3>Cadastre sua empresa</h3>
      <p className="form-nota">
        Antes de pedir credenciamento, a plataforma precisa saber quem é a empresa.
      </p>
      {erro ? <p className="form-erro">{erro}</p> : null}

      <div className="field-row">
        <Field label="Nome da empresa">
          <input
            id="perfil-empresa"
            value={form.nome_empresa}
            onChange={(e) => setForm({ ...form, nome_empresa: e.target.value })}
            required
          />
        </Field>
        <Field label="CNPJ">
          <input
            id="perfil-cnpj"
            value={form.cnpj}
            onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
            placeholder="00.000.000/0001-00"
            required
          />
        </Field>
      </div>

      <Field label="O que vocês fazem">
        <textarea
          id="perfil-descricao"
          rows={3}
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
        />
      </Field>

      <div className="request-actions">
        <button className="btn-primary" type="submit">
          Criar perfil
        </button>
      </div>
    </form>
  )
}

export default function Profile({ profile }) {
  const { dispatch } = useApp()
  const perfil = useRecurso(
    () => fornecedores.meuPerfil().catch((e) => (e.status === 404 ? null : Promise.reject(e))),
  )
  const servicos = useRecurso(
    () => fornecedores.meusServicos().catch((e) => (e.status === 404 ? [] : Promise.reject(e))),
  )
  const [servico, setServico] = useState({ nome: '', descricao: '', preco: '' })
  const [erro, setErro] = useState(null)

  if (perfil.carregando || perfil.erro) {
    return <Carregando erro={perfil.erro} aoTentarDeNovo={perfil.recarregar} />
  }

  function recarregarTudo() {
    perfil.recarregar()
    servicos.recarregar()
  }

  if (!perfil.dados) {
    return (
      <>
        <PageHeading eyebrow={profile.tagline} title="Meu perfil" description="Comece por aqui." />
        <CriarPerfil onPronto={recarregarTudo} />
      </>
    )
  }

  async function criarServico(e) {
    e.preventDefault()
    setErro(null)
    try {
      await fornecedores.criarServico({
        nome: servico.nome,
        descricao: servico.descricao || undefined,
        preco: Number(servico.preco),
      })
      setServico({ nome: '', descricao: '', preco: '' })
      servicos.recarregar()
      dispatch({ type: 'aviso', texto: 'Serviço cadastrado.' })
    } catch (err) {
      setErro(err.message)
    }
  }

  async function pedirCredenciamento() {
    setErro(null)
    try {
      await fornecedores.pedirCredenciamento()
      dispatch({ type: 'aviso', texto: 'Pedido enviado. Agora é esperar o administrador.' })
      perfil.recarregar()
    } catch (err) {
      setErro(err.message)
    }
  }

  const situacao = perfil.dados.situacao

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title={perfil.dados.nome_empresa}
        description={`CNPJ ${perfil.dados.cnpj}`}
      >
        <StatusBadge status={rotulo(situacao)} />
      </PageHeading>

      {erro ? <p className="form-erro">{erro}</p> : null}

      <section className="bloco">
        <h3>Credenciamento</h3>
        {situacao === 'credenciado' ? (
          <p>Sua empresa está credenciada e aparece para os organizadores.</p>
        ) : situacao === 'em_analise' ? (
          <p>Seu pedido está com o administrador. Assim que ele decidir, aparece aqui.</p>
        ) : (
          <>
            <p>
              {situacao === 'recusado'
                ? 'Seu pedido foi recusado. Ajuste os serviços e peça de novo.'
                : 'Cadastre pelo menos um serviço e peça credenciamento.'}
            </p>
            <button
              className="btn-primary"
              onClick={pedirCredenciamento}
              disabled={(servicos.dados || []).length === 0}
            >
              Pedir credenciamento
            </button>
          </>
        )}
      </section>

      <section className="bloco">
        <h3>Meus serviços</h3>
        {servicos.carregando ? (
          <Carregando />
        ) : (servicos.dados || []).length === 0 ? (
          <p>Nenhum serviço cadastrado ainda.</p>
        ) : (
          <div className="data-list">
            {servicos.dados.map((s) => (
              <div key={s.id_servico}>
                <span className="event-name">
                  <span>{s.nome}</span>
                  <small>{s.descricao || 'sem descrição'}</small>
                </span>
                <strong>{moeda(s.preco)}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      <form className="form-card" onSubmit={criarServico}>
        <h3>Adicionar serviço</h3>
        <div className="field-row">
          <Field label="Nome do serviço">
            <input
              id="servico-nome"
              value={servico.nome}
              onChange={(e) => setServico({ ...servico, nome: e.target.value })}
              placeholder="Som e luz, máquina de fumaça, segurança…"
              required
            />
          </Field>
          <Field label="Preço (R$)">
            <input
              id="servico-preco"
              type="number"
              min="0"
              step="0.01"
              value={servico.preco}
              onChange={(e) => setServico({ ...servico, preco: e.target.value })}
              required
            />
          </Field>
        </div>
        <Field label="Descrição">
          <textarea
            id="servico-descricao"
            rows={2}
            value={servico.descricao}
            onChange={(e) => setServico({ ...servico, descricao: e.target.value })}
          />
        </Field>
        <div className="request-actions">
          <button className="btn-secondary" type="submit">
            Cadastrar serviço
          </button>
        </div>
      </form>
    </>
  )
}
