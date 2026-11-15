import { useEffect, useState } from 'react'
import Carregando from '../../components/Carregando'
import Field from '../../components/Field'
import PageHeading from '../../components/PageHeading'
import StatusBadge from '../../components/StatusBadge'
import { fornecedores } from '../../api'
import { useCredenciamento } from '../../hooks/useCredenciamento'
import { useRecurso } from '../../hooks/useRecurso'
import { cnpj, moeda, rotulo } from '../../utils/format'
import { useApp } from '../../state/useApp'

const TEXTO_SITUACAO = {
  nao_solicitado:
    'Para cadastrar seus serviços e aparecer para os organizadores, faça um credenciamento simples.',
  em_analise:
    'Seu pedido está com o administrador. Você já pode cadastrar serviços; eles aparecem para os organizadores depois da aprovação.',
  credenciado: 'Sua empresa está credenciada e aparece para os organizadores.',
  recusado: 'Seu pedido foi recusado. Veja o motivo, corrija os dados e envie de novo.',
}

export default function Profile({ profile }) {
  const { dispatch } = useApp()
  const { situacao, exigir, abrir } = useCredenciamento()
  const perfil = useRecurso(
    () => fornecedores.meuPerfil().catch((e) => (e.status === 404 ? null : Promise.reject(e))),
  )
  const servicos = useRecurso(() => fornecedores.meusServicos())
  const [servico, setServico] = useState({ nome: '', descricao: '', preco: '' })
  const [erro, setErro] = useState(null)

  // o perfil da empresa nasce no credenciamento: quando a situacao muda
  // (enviou, foi aprovado ou recusado), busca de novo
  const recarregarPerfil = perfil.recarregar
  useEffect(() => {
    if (situacao) recarregarPerfil()
  }, [situacao, recarregarPerfil])

  if (perfil.carregando || perfil.erro) {
    return <Carregando erro={perfil.erro} aoTentarDeNovo={perfil.recarregar} />
  }

  async function salvarServico() {
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
      // 403 de credenciamento: o pop-up ja abre sozinho
      if (err.corpo?.codigo !== 'credenciamento_necessario') setErro(err.message)
    }
  }

  // sem credenciamento pedido, o pop-up abre e o servico e salvo depois do envio
  function criarServico(e) {
    e.preventDefault()
    exigir('Para cadastrar seus serviços, faça um credenciamento simples.', salvarServico)
  }

  const empresa = perfil.dados
  const atual = situacao || empresa?.situacao || 'nao_solicitado'

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title={empresa ? empresa.nome_empresa : 'Meu perfil'}
        description={empresa ? `CNPJ ${cnpj(empresa.cnpj)}` : 'Comece pelo credenciamento.'}
      >
        <StatusBadge status={rotulo(atual)} />
      </PageHeading>

      {erro ? <p className="form-erro">{erro}</p> : null}

      <section className="bloco">
        <h3>Credenciamento</h3>
        <p>{TEXTO_SITUACAO[atual]}</p>
        {atual === 'nao_solicitado' || atual === 'recusado' ? (
          <button className="btn-primary" onClick={abrir}>
            {atual === 'recusado' ? 'Ver motivo e corrigir' : 'Fazer credenciamento'}
          </button>
        ) : null}
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

      {/* sem credenciamento, o botao abre o pop-up antes de salvar */}
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
