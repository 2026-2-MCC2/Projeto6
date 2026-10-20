import Carregando from '../../components/Carregando'
import PageHeading from '../../components/PageHeading'
import StatCard from '../../components/StatCard'
import StatusBadge from '../../components/StatusBadge'
import { eventos, fornecedores } from '../../api'
import { useRecurso } from '../../hooks/useRecurso'
import { dataHora, rotulo } from '../../utils/format'

export default function Overview({ profile, onNavigate }) {
  const { dados, carregando, erro, recarregar } = useRecurso(async () => {
    const [meus, vitrine] = await Promise.all([eventos.meus(), fornecedores.vitrine()])
    return { meus, vitrine }
  })

  if (carregando || erro) return <Carregando erro={erro} aoTentarDeNovo={recarregar} />

  const porStatus = (s) => dados.meus.filter((e) => e.status === s).length

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Visão geral"
        description="Seus eventos e o que falta para eles entrarem à venda."
      >
        <button className="btn-primary" onClick={() => onNavigate('new')}>
          Novo evento
        </button>
      </PageHeading>

      <div className="stat-grid">
        <StatCard label="Rascunhos" value={porStatus('rascunho')} note="ainda não enviados" icon="file" />
        <StatCard label="Em análise" value={porStatus('em_analise')} note="com o administrador" icon="check" />
        <StatCard label="Aprovados" value={porStatus('aprovado')} note="ingressos à venda" icon="ticket" />
        <StatCard
          label="Fornecedores"
          value={dados.vitrine.length}
          note="credenciados na plataforma"
          icon="users"
        />
      </div>

      <section className="bloco">
        <h3>Seus eventos</h3>
        {dados.meus.length === 0 ? (
          <p>Você ainda não criou nenhum evento.</p>
        ) : (
          <div className="data-list">
            {dados.meus.slice(0, 6).map((e) => (
              <div key={e.id_evento}>
                <span className="event-name">
                  <span>{e.nome}</span>
                  <small>{dataHora(e.data_hora)}</small>
                </span>
                <StatusBadge status={rotulo(e.status)} />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
