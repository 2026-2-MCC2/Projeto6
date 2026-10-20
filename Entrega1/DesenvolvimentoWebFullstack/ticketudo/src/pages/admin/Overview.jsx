import Carregando from '../../components/Carregando'
import PageHeading from '../../components/PageHeading'
import StatCard from '../../components/StatCard'
import { admin, eventos, fornecedores } from '../../api'
import { useRecurso } from '../../hooks/useRecurso'
import { dataHora } from '../../utils/format'

export default function Overview({ profile, onNavigate }) {
  const { dados, carregando, erro, recarregar } = useRecurso(async () => {
    const [fila, creds, publicos, vitrine] = await Promise.all([
      admin.eventos('em_analise'),
      admin.credenciamentos('em_analise'),
      eventos.publicos(),
      fornecedores.vitrine(),
    ])
    return { fila, creds, publicos, vitrine }
  })

  if (carregando || erro) return <Carregando erro={erro} aoTentarDeNovo={recarregar} />

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Visão geral"
        description="O que está esperando uma decisão sua."
      />

      <div className="stat-grid">
        <StatCard
          label="Eventos na fila"
          value={dados.fila.length}
          note="aguardando aprovação"
          icon="calendar"
        />
        <StatCard
          label="Credenciamentos na fila"
          value={dados.creds.length}
          note="aguardando análise"
          icon="check"
        />
        <StatCard
          label="Eventos à venda"
          value={dados.publicos.length}
          note="já aprovados"
          icon="ticket"
        />
        <StatCard
          label="Fornecedores credenciados"
          value={dados.vitrine.length}
          note="na vitrine"
          icon="users"
        />
      </div>

      {dados.fila.length > 0 ? (
        <section className="bloco">
          <h3>Eventos esperando você</h3>
          <div className="data-list">
            {dados.fila.slice(0, 5).map((e) => (
              <div key={e.id_evento}>
                <span className="event-name">
                  <span>{e.nome}</span>
                  <small>
                    {e.organizador} · {dataHora(e.data_hora)}
                  </small>
                </span>
                <button className="btn-link" onClick={() => onNavigate('events')}>
                  Analisar
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {dados.creds.length > 0 ? (
        <section className="bloco">
          <h3>Credenciamentos esperando você</h3>
          <div className="data-list">
            {dados.creds.slice(0, 5).map((c) => (
              <div key={c.id_credenciamento}>
                <span className="event-name">
                  <span>{c.nome_empresa}</span>
                  <small>
                    {c.total_servicos} serviço(s) · {c.nome}
                  </small>
                </span>
                <button className="btn-link" onClick={() => onNavigate('requests')}>
                  Analisar
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  )
}
