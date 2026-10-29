import { useState } from 'react'
import Carregando from '../../components/Carregando'
import EmptyState from '../../components/EmptyState'
import PageHeading from '../../components/PageHeading'
import StatusBadge from '../../components/StatusBadge'
import { eventos } from '../../api'
import { useRecurso } from '../../hooks/useRecurso'
import { numero, periodo, rotulo } from '../../utils/format'
import { useApp } from '../../state/useApp'

// so da pra editar ou excluir antes de o evento ir para o administrador
const EDITAVEL = ['rascunho', 'recusado']
const NAO_EXCLUI = ['em_analise', 'aprovado']

export default function Events({ profile, onNavigate }) {
  const { dispatch } = useApp()
  const { dados, carregando, erro, recarregar } = useRecurso(() => eventos.meus())
  const [excluindo, setExcluindo] = useState(null)

  async function excluir(evento) {
    try {
      await eventos.excluir(evento.id_evento)
      dispatch({ type: 'aviso', texto: `${evento.nome} excluído.` })
      setExcluindo(null)
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
        description="Abra um evento para montar os itens de custo, os outros custos e acompanhar o total."
      >
        <button className="btn-primary" onClick={() => onNavigate('new')}>
          Novo evento
        </button>
      </PageHeading>

      {dados.length === 0 ? (
        <EmptyState
          title="Você ainda não criou nenhum evento"
          description="Comece por Adicionar evento. Depois cadastre os itens de custo e envie para análise."
        />
      ) : (
        <div className="report-list">
          {dados.map((evento) => (
            <article className="report-card" key={evento.id_evento}>
              <header>
                <div>
                  <small className="eyebrow">{periodo(evento.data_inicio, evento.data_fim)}</small>
                  <h3>{evento.nome}</h3>
                </div>
                <StatusBadge status={rotulo(evento.status)} />
              </header>

              <p>
                {evento.local} — {evento.cidade}/{evento.estado} · público de{' '}
                {numero(evento.publico_minimo)} a {numero(evento.publico_maximo)} ·{' '}
                {evento.total_itens} item(ns) de custo
              </p>

              {evento.motivo_recusa && evento.status === 'recusado' ? (
                <p className="request-descricao">O administrador recusou: {evento.motivo_recusa}</p>
              ) : null}

              {excluindo === evento.id_evento ? (
                <div className="confirmar-exclusao" role="alert">
                  <p>Excluir “{evento.nome}”? Isso apaga também os itens e os custos.</p>
                  <div>
                    <button className="btn-secondary" onClick={() => setExcluindo(null)}>
                      Cancelar
                    </button>
                    <button className="btn-recusar" onClick={() => excluir(evento)}>
                      Excluir evento
                    </button>
                  </div>
                </div>
              ) : (
                <footer>
                  {NAO_EXCLUI.includes(evento.status) ? null : (
                    <button className="btn-link perigo" onClick={() => setExcluindo(evento.id_evento)}>
                      Excluir
                    </button>
                  )}
                  {EDITAVEL.includes(evento.status) ? (
                    <button
                      className="btn-secondary"
                      onClick={() => onNavigate('evento', { id: evento.id_evento, editar: true })}
                    >
                      Editar
                    </button>
                  ) : null}
                  <button className="btn-primary" onClick={() => onNavigate('evento', evento.id_evento)}>
                    Abrir evento
                  </button>
                </footer>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  )
}
