import Carregando from '../../components/Carregando'
import EmptyState from '../../components/EmptyState'
import PageHeading from '../../components/PageHeading'
import StatusBadge from '../../components/StatusBadge'
import { eventos } from '../../api'
import { useRecurso } from '../../hooks/useRecurso'
import { dataHora, rotulo } from '../../utils/format'
import { useApp } from '../../state/useApp'

export default function Events({ profile, onNavigate }) {
  const { dispatch } = useApp()
  const { dados, carregando, erro, recarregar } = useRecurso(() => eventos.meus())

  async function enviar(evento) {
    try {
      await eventos.enviarAnalise(evento.id_evento)
      dispatch({ type: 'aviso', texto: `${evento.nome} enviado para análise.` })
      recarregar()
    } catch (e) {
      dispatch({ type: 'aviso', texto: e.message })
    }
  }

  if (carregando || erro) return <Carregando erro={erro} aoTentarDeNovo={recarregar} />

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Meus eventos"
        description="Rascunho é só seu. Depois de aprovado, os ingressos entram à venda."
      >
        <button className="btn-primary" onClick={() => onNavigate('new')}>
          Novo evento
        </button>
      </PageHeading>

      {dados.length === 0 ? (
        <EmptyState
          title="Você ainda não criou nenhum evento"
          description="Comece por Adicionar evento, cadastre os lotes e mande para análise."
        />
      ) : (
        <div className="report-list">
          {dados.map((evento) => (
            <article className="report-card" key={evento.id_evento}>
              <header>
                <div>
                  <small className="eyebrow">{dataHora(evento.data_hora)}</small>
                  <h3>{evento.nome}</h3>
                </div>
                <StatusBadge status={rotulo(evento.status)} />
              </header>

              {evento.descricao ? <p>{evento.descricao}</p> : null}

              {evento.motivo_recusa ? (
                <p className="request-descricao">
                  O administrador recusou: {evento.motivo_recusa}
                </p>
              ) : null}

              <footer>
                {evento.status === 'rascunho' || evento.status === 'recusado' ? (
                  <button className="btn-approve" onClick={() => enviar(evento)}>
                    Enviar para análise
                  </button>
                ) : evento.status === 'em_analise' ? (
                  <small>Aguardando um administrador analisar.</small>
                ) : (
                  <small>Aprovado — ingressos à venda.</small>
                )}
              </footer>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
