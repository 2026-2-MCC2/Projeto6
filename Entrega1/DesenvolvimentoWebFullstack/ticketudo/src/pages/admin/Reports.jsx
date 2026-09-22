import { useState } from 'react'
import EmptyState from '../../components/EmptyState'
import PageHeading from '../../components/PageHeading'
import StatusBadge from '../../components/StatusBadge'
import Tabs from '../../components/Tabs'
import { useApp } from '../../state/useApp'

export default function Reports({ profile }) {
  const { state, dispatch } = useApp()
  const [filter, setFilter] = useState('Em análise')

  const visible = state.reports.filter((report) => report.status === filter)

  const options = ['Em análise', 'Resolvida'].map((status) => ({
    id: status,
    label: status === 'Em análise' ? 'Em análise' : 'Resolvidas',
    count: state.reports.filter((report) => report.status === status).length,
  }))

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Denúncias"
        description="Situações reportadas pela comunidade com fundos retidos até a conclusão da análise."
      />

      <Tabs options={options} value={filter} onChange={setFilter} />

      {visible.length === 0 ? (
        <EmptyState
          title={filter === 'Em análise' ? 'Nenhuma denúncia em aberto' : 'Nenhuma denúncia resolvida'}
          description={
            filter === 'Em análise'
              ? 'A fila está limpa. Novas ocorrências aparecem aqui assim que forem abertas.'
              : 'As denúncias que você concluir passam a ser listadas nesta aba.'
          }
          icon="flag"
        />
      ) : (
        <div className="report-list">
          {visible.map((report) => (
            <article className="report-card" key={report.id}>
              <header>
                <div>
                  <small className="eyebrow">
                    {report.event} · aberta {report.opened}
                  </small>
                  <h3>{report.subject}</h3>
                </div>
                <StatusBadge status={report.severity} />
              </header>
              <p>{report.detail}</p>
              <footer>
                <StatusBadge status={report.status} />
                {report.status === 'Em análise' ? (
                  <button
                    className="btn-approve"
                    onClick={() => dispatch({ type: 'report/resolve', id: report.id })}
                  >
                    Marcar como resolvida
                  </button>
                ) : null}
              </footer>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
