import { useState } from 'react'
import Carregando from '../../components/Carregando'
import EmptyState from '../../components/EmptyState'
import Field from '../../components/Field'
import PageHeading from '../../components/PageHeading'
import StatusBadge from '../../components/StatusBadge'
import { fornecedores } from '../../api'
import { useRecurso } from '../../hooks/useRecurso'
import { cnpj, moeda, rotulo } from '../../utils/format'
import { useApp } from '../../state/useApp'

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

  // o perfil da empresa nasce quando o fornecedor envia o credenciamento
  if (!perfil.dados) {
    return (
      <>
        <PageHeading eyebrow={profile.tagline} title="Meu perfil" description="Comece por aqui." />
        <EmptyState
          title="Faça seu credenciamento"
          description="Para cadastrar seus serviços, envie os dados da sua empresa no credenciamento."
        />
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

  const situacao = perfil.dados.situacao

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title={perfil.dados.nome_empresa}
        description={`CNPJ ${cnpj(perfil.dados.cnpj)}`}
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
          <p>Seu pedido foi recusado. Corrija os dados do credenciamento e envie de novo.</p>
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

      {/* recusado nao cadastra servico ate reenviar o credenciamento */}
      {situacao === 'recusado' ? null : (
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
      )}
    </>
  )
}
