import { useState } from 'react'
import Carregando from '../../components/Carregando'
import EmptyState from '../../components/EmptyState'
import PageHeading from '../../components/PageHeading'
import StatusBadge from '../../components/StatusBadge'
import Tabs from '../../components/Tabs'
import { admin } from '../../api'
import { useRecurso } from '../../hooks/useRecurso'
import { dataHora, rotulo } from '../../utils/format'
import { useApp } from '../../state/useApp'

const abas = [
  { id: 'em_analise', label: 'Em análise' },
  { id: 'aprovado', label: 'Aprovados' },
  { id: 'recusado', label: 'Recusados' },
]

export default function Requests({ profile, onMudou }) {
  const { dispatch } = useApp()
  const [aba, setAba] = useState('em_analise')
  const { dados, carregando, erro, recarregar } = useRecurso(
    () => admin.credenciamentos(aba), aba)

  async function decidir(pedido, aprovar) {
    try {
      if (aprovar) {
        await admin.aprovarCredenciamento(pedido.id_credenciamento)
      } else {
        const motivo = window.prompt('Por que está recusando?')
        if (!motivo) return
        await admin.recusarCredenciamento(pedido.id_credenciamento, motivo)
      }
      dispatch({
        type: 'aviso',
        texto: `${pedido.nome_empresa} ${aprovar ? 'credenciada' : 'recusada'}.`,
      })
      recarregar()
      onMudou?.()
    } catch (e) {
      dispatch({ type: 'aviso', texto: e.message })
    }
  }

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Credenciamentos"
        description="Confira CNPJ e serviços antes de liberar a empresa na vitrine dos organizadores."
      />

      <Tabs options={abas} value={aba} onChange={setAba} />

      {carregando || erro ? (
        <Carregando erro={erro} aoTentarDeNovo={recarregar} />
      ) : dados.length === 0 ? (
        <EmptyState
          title="Nada nessa aba"
          description="Quando um fornecedor pedir credenciamento, ele aparece aqui."
        />
      ) : (
        <div className="request-grid">
          {dados.map((pedido) => (
            <article className="request-card" key={pedido.id_credenciamento}>
              <header>
                <div>
                  <small className="eyebrow">Protocolo {pedido.id_credenciamento}</small>
                  <h3>{pedido.nome_empresa}</h3>
                  <p>CNPJ {pedido.cnpj}</p>
                </div>
                <StatusBadge status={rotulo(pedido.status)} />
              </header>

              <dl className="request-facts">
                <div>
                  <dt>Responsável</dt>
                  <dd>{pedido.nome}</dd>
                </div>
                <div>
                  <dt>E-mail</dt>
                  <dd>{pedido.email}</dd>
                </div>
                <div>
                  <dt>Serviços cadastrados</dt>
                  <dd>{pedido.total_servicos}</dd>
                </div>
                <div>
                  <dt>Enviado</dt>
                  <dd>{dataHora(pedido.solicitado_em)}</dd>
                </div>
              </dl>

              {pedido.descricao ? <p className="request-descricao">{pedido.descricao}</p> : null}
              {pedido.observacao ? <p className="request-descricao">Parecer: {pedido.observacao}</p> : null}

              {pedido.status === 'em_analise' ? (
                <footer>
                  <button className="btn-secondary" onClick={() => decidir(pedido, false)}>
                    Recusar
                  </button>
                  <button className="btn-approve" onClick={() => decidir(pedido, true)}>
                    Credenciar
                  </button>
                </footer>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </>
  )
}
