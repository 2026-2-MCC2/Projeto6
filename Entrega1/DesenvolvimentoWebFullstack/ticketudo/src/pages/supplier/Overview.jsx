import Carregando from '../../components/Carregando'
import PageHeading from '../../components/PageHeading'
import StatCard from '../../components/StatCard'
import StatusBadge from '../../components/StatusBadge'
import { fornecedores, solicitacoes } from '../../api'
import { useRecurso } from '../../hooks/useRecurso'
import { rotulo } from '../../utils/format'

export default function Overview({ profile, onNavigate }) {
  const { dados, carregando, erro, recarregar } = useRecurso(async () => {
    const perfil = await fornecedores.meuPerfil().catch((e) => (e.status === 404 ? null : Promise.reject(e)))
    if (!perfil) return { perfil: null, servicos: [], pedidos: [] }

    const [servicos, pedidos] = await Promise.all([
      fornecedores.meusServicos(),
      solicitacoes.minhas(),
    ])
    return { perfil, servicos, pedidos }
  })

  if (carregando || erro) return <Carregando erro={erro} aoTentarDeNovo={recarregar} />

  if (!dados.perfil) {
    return (
      <>
        <PageHeading
          eyebrow={profile.tagline}
          title="Bem-vindo"
          description="Falta um passo para você aparecer na plataforma."
        />
        <div className="empty-state">
          <strong>Cadastre sua empresa</strong>
          <p>Depois do perfil e dos serviços, você pede credenciamento ao administrador.</p>
          <button className="btn-primary" onClick={() => onNavigate('profile')}>
            Ir para Meu perfil
          </button>
        </div>
      </>
    )
  }

  const emAnalise = dados.pedidos.filter((p) => p.status === 'em_analise').length

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title={dados.perfil.nome_empresa}
        description="Seu resumo na plataforma."
      >
        <StatusBadge status={rotulo(dados.perfil.situacao)} />
      </PageHeading>

      <div className="stat-grid">
        <StatCard label="Serviços cadastrados" value={dados.servicos.length} note="no seu catálogo" icon="briefcase" />
        <StatCard label="Solicitações abertas" value={emAnalise} note="esperando sua resposta" icon="file" />
        <StatCard
          label="Aceitas"
          value={dados.pedidos.filter((p) => p.status === 'aceita').length}
          note="fechadas com organizadores"
          icon="check"
        />
      </div>

      {dados.perfil.situacao !== 'credenciado' ? (
        <div className="empty-state">
          <strong>Você ainda não está credenciado</strong>
          <p>Enquanto isso, sua empresa não aparece para os organizadores.</p>
          <button className="btn-primary" onClick={() => onNavigate('profile')}>
            Ver situação do credenciamento
          </button>
        </div>
      ) : null}
    </>
  )
}
