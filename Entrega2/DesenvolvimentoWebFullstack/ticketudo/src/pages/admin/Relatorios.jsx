import Carregando from '../../components/Carregando'
import PageHeading from '../../components/PageHeading'
import StatCard from '../../components/StatCard'
import { admin } from '../../api'
import { useRecurso } from '../../hooks/useRecurso'
import { moeda, numero, rotulo } from '../../utils/format'

// Relatorios gerenciais (FLX-07): usuarios, credenciamentos, eventos,
// propostas e valores do planejamento. Com o banco vazio, tudo aparece zero.

const ORDEM = {
  usuarios: ['organizador', 'fornecedor', 'comprador', 'adm'],
  credenciamento: ['nao_solicitado', 'em_analise', 'credenciado', 'recusado'],
  eventos: ['rascunho', 'em_cotacao', 'cotacao_encerrada', 'em_analise', 'aprovado', 'recusado'],
  propostas: ['enviada', 'selecionada', 'nao_selecionada', 'cancelada'],
}

const NOME_PERFIL = { organizador: 'Organizadores', fornecedor: 'Fornecedores', comprador: 'Compradores', adm: 'Administradores' }

// uma tabela de "situacao -> quantidade" com barra proporcional
function Distribuicao({ titulo, valores, ordem, nome = rotulo }) {
  const total = ordem.reduce((s, k) => s + (valores?.[k] || 0), 0)
  return (
    <section className="bloco relatorio-bloco">
      <div className="bloco-cab">
        <h3>{titulo}</h3>
        <span className="relatorio-total">{numero(total)}</span>
      </div>
      <table className="tabela">
        <tbody>
          {ordem.map((k) => {
            const v = valores?.[k] || 0
            return (
              <tr key={k}>
                <td>{nome(k)}</td>
                <td className="relatorio-barra">
                  <span style={{ width: total ? `${(v / total) * 100}%` : 0 }} />
                </td>
                <td className="num">{numero(v)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}

export default function Relatorios({ profile }) {
  const { dados, carregando, erro, recarregar } = useRecurso(() => admin.relatorios())
  if (carregando || erro) return <Carregando erro={erro} aoTentarDeNovo={recarregar} />

  const v = dados.valores
  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Relatórios"
        description="Números da plataforma, calculados na hora a partir do banco."
      />

      <div className="stat-grid">
        <StatCard label="Eventos" value={numero(v.eventos)} note="cadastrados na plataforma" icon="calendar" />
        <StatCard
          label="Custo consolidado"
          value={moeda(v.custo_consolidado_total)}
          note={`média de ${moeda(v.custo_consolidado_medio)} por evento`}
          icon="wallet"
        />
        <StatCard
          label="Eventos aprovados"
          value={moeda(v.custo_consolidado_aprovados)}
          note="soma do custo consolidado"
          icon="check"
        />
        <StatCard
          label="Propostas escolhidas"
          value={moeda(v.propostas_selecionadas_total)}
          note={`média de ${moeda(v.proposta_selecionada_media)} por proposta`}
          icon="users"
        />
      </div>

      <div className="relatorio-grade">
        <Distribuicao
          titulo="Usuários por perfil"
          valores={dados.usuarios}
          ordem={ORDEM.usuarios}
          nome={(k) => NOME_PERFIL[k]}
        />
        <Distribuicao titulo="Eventos por situação" valores={dados.eventos} ordem={ORDEM.eventos} />
        <Distribuicao
          titulo="Credenciamento de organizadores"
          valores={dados.credenciamento.organizador}
          ordem={ORDEM.credenciamento}
        />
        <Distribuicao
          titulo="Credenciamento de fornecedores"
          valores={dados.credenciamento.fornecedor}
          ordem={ORDEM.credenciamento}
        />
        <Distribuicao titulo="Propostas por situação" valores={dados.propostas} ordem={ORDEM.propostas} />
      </div>
    </>
  )
}
