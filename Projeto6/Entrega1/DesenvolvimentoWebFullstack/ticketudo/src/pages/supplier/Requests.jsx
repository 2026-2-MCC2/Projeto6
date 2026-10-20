import Carregando from '../../components/Carregando'
import EmptyState from '../../components/EmptyState'
import PageHeading from '../../components/PageHeading'
import StatusBadge from '../../components/StatusBadge'
import { solicitacoes } from '../../api'
import { useRecurso } from '../../hooks/useRecurso'
import { dataHora, moeda, rotulo } from '../../utils/format'
import { useApp } from '../../state/useApp'

export default function Requests({ profile, onOpenPanel, onMudou }) {
  const { dispatch } = useApp()
  const { dados, carregando, erro, recarregar } = useRecurso(() => solicitacoes.minhas())

  async function responder(item, aceitar) {
    try {
      if (aceitar) await solicitacoes.aceitar(item.id_solicitacao)
      else await solicitacoes.recusar(item.id_solicitacao)
      dispatch({
        type: 'aviso',
        texto: `Solicitação de ${item.evento} ${aceitar ? 'aceita' : 'recusada'}.`,
      })
      recarregar()
      onMudou?.()
    } catch (e) {
      dispatch({ type: 'aviso', texto: e.message })
    }
  }

  if (carregando || erro) return <Carregando erro={erro} aoTentarDeNovo={recarregar} />

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Solicitações"
        description="Organizadores que pediram um serviço seu. Negocie pelo chat antes de responder."
      />

      {dados.length === 0 ? (
        <EmptyState
          title="Nenhuma solicitação ainda"
          description="Depois de credenciado, os organizadores conseguem te encontrar e pedir orçamento."
        />
      ) : (
        <div className="request-grid">
          {dados.map((item) => (
            <article className="request-card" key={item.id_solicitacao}>
              <header>
                <div>
                  <small className="eyebrow">{item.servico}</small>
                  <h3>{item.evento}</h3>
                  <p>{item.organizador}</p>
                </div>
                <StatusBadge status={rotulo(item.status)} />
              </header>

              <dl className="request-facts">
                <div>
                  <dt>Data do evento</dt>
                  <dd>{dataHora(item.data_hora)}</dd>
                </div>
                <div>
                  <dt>Valor proposto</dt>
                  <dd>{moeda(item.valor_proposto)}</dd>
                </div>
              </dl>

              {item.mensagem ? <p className="request-descricao">“{item.mensagem}”</p> : null}

              <footer>
                <button className="btn-link" onClick={() => onOpenPanel('chat')}>
                  Abrir chat
                </button>
                {item.status === 'em_analise' ? (
                  <>
                    <button className="btn-secondary" onClick={() => responder(item, false)}>
                      Recusar
                    </button>
                    <button className="btn-approve" onClick={() => responder(item, true)}>
                      Aceitar
                    </button>
                  </>
                ) : null}
              </footer>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
