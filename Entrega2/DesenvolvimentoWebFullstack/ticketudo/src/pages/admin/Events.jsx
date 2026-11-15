import { useState } from 'react'
import Carregando from '../../components/Carregando'
import EmptyState from '../../components/EmptyState'
import MotivoRecusa from '../../components/MotivoRecusa'
import PageHeading from '../../components/PageHeading'
import StatusBadge from '../../components/StatusBadge'
import Tabs from '../../components/Tabs'
import { admin } from '../../api'
import { nomeDaArea } from '../../data/credenciamento'
import { useRecurso } from '../../hooks/useRecurso'
import { dataHora, moeda, numero, periodo, rotulo } from '../../utils/format'
import { useApp } from '../../state/useApp'

const abas = [
  { id: 'em_analise', label: 'Em análise' },
  { id: 'em_cotacao', label: 'Em cotação' },
  { id: 'aprovado', label: 'Aprovados' },
  { id: 'recusado', label: 'Recusados' },
  { id: 'todos', label: 'Todos' },
]

const TIPOS_CUSTO = { fiscal: 'Fiscal', operacional: 'Operacional', variavel: 'Variável', outro: 'Outro' }

// tudo o que o adm precisa para decidir: itens com a proposta escolhida,
// outros custos e o orcamento consolidado (FLX-07)
function Detalhe({ id }) {
  const { dados, carregando, erro, recarregar } = useRecurso(() => admin.evento(id), id)

  if (carregando || erro) return <Carregando erro={erro} aoTentarDeNovo={recarregar} />

  const orc = dados.orcamento
  return (
    <div className="evento-detalhe">
      <strong>Público e margem</strong>
      <p className="request-descricao">
        Público de {numero(dados.publico_minimo)} a {numero(dados.publico_maximo)} pessoas
        {dados.publico_esperado ? ` (esperado: ${numero(dados.publico_esperado)})` : ''} · margem de
        lucro de {Number(dados.margem_lucro).toLocaleString('pt-BR')}%
      </p>

      <strong>Itens de custo</strong>
      {orc.itens.length === 0 ? (
        <p>Nenhum item cadastrado.</p>
      ) : (
        <div className="tabela-rolagem">
          <table className="tabela">
            <thead>
              <tr>
                <th>Item</th>
                <th className="num">Estimado</th>
                <th className="num">Propostas</th>
                <th>Escolhida</th>
                <th className="num">Considerado</th>
              </tr>
            </thead>
            <tbody>
              {orc.itens.map((i) => (
                <tr key={i.id_item}>
                  <td>
                    {i.descricao}
                    <br />
                    <small>{nomeDaArea(i.categoria)} · qtd. {numero(i.quantidade)}</small>
                  </td>
                  <td className="num">{moeda(i.custo_estimado)}</td>
                  <td className="num">{i.propostas_recebidas}</td>
                  <td>{i.fornecedor || <small>sem escolha (vale o estimado)</small>}</td>
                  <td className="num">{moeda(i.valor_considerado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dados.custos.length > 0 ? (
        <>
          <strong>Outros custos</strong>
          <ul className="lista-simples">
            {dados.custos.map((c) => (
              <li key={c.id_custo}>
                {TIPOS_CUSTO[c.tipo]} — {c.descricao} · {moeda(c.valor)}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <dl className="request-facts">
        <div>
          <dt>Propostas escolhidas</dt>
          <dd>{moeda(orc.totais.propostas_selecionadas)}</dd>
        </div>
        <div>
          <dt>Itens pelo estimado</dt>
          <dd>{moeda(orc.totais.itens_sem_proposta)}</dd>
        </div>
        <div>
          <dt>Outros custos</dt>
          <dd>{moeda(orc.totais.outros_custos)}</dd>
        </div>
        <div>
          <dt>Custo consolidado</dt>
          <dd>
            <strong>{moeda(orc.totais.custo_total)}</strong>
          </dd>
        </div>
      </dl>

      {dados.revisado_em ? (
        <p className="request-descricao">
          Última decisão: {dataHora(dados.revisado_em)} por {dados.revisado_por || '—'}
        </p>
      ) : null}

      {dados.lotes.length > 0 ? (
        <>
          <strong>Lotes de ingresso (extensão)</strong>
          <ul className="lista-simples">
            {dados.lotes.map((l) => (
              <li key={l.id_lote}>
                {l.setor} · {l.nome} — {l.quantidade} × {moeda(l.preco)}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {dados.fornecedores_externos.length > 0 ? (
        <>
          <strong>Fornecedores particulares</strong>
          <ul className="lista-simples">
            {dados.fornecedores_externos.map((f) => (
              <li key={f.id_fornecedor_externo}>
                {f.nome} — {f.servico} · {moeda(f.valor)}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  )
}

export default function Events({ profile, onMudou }) {
  const { dispatch } = useApp()
  const [aba, setAba] = useState('em_analise')
  const [aberto, setAberto] = useState(null)
  // card com o campo de motivo aberto
  const [recusando, setRecusando] = useState(null)
  const { dados, carregando, erro, recarregar } = useRecurso(() => admin.eventos(aba), aba)

  // motivo so vem na recusa
  async function decidir(evento, aprovar, motivo) {
    try {
      if (aprovar) {
        const r = await admin.aprovarEvento(evento.id_evento)
        dispatch({
          type: 'aviso',
          texto: r.ingressos_gerados
            ? `${evento.nome} aprovado. ${r.ingressos_gerados} ingressos gerados.`
            : `${evento.nome} aprovado.`,
        })
      } else {
        await admin.recusarEvento(evento.id_evento, motivo)
        dispatch({ type: 'aviso', texto: `${evento.nome} recusado.` })
      }
      setAberto(null)
      setRecusando(null)
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
        title="Eventos"
        description="Todos os eventos da plataforma, com o custo consolidado e o andamento da cotação. Os que estão em análise esperam a sua decisão."
      />

      <Tabs options={abas} value={aba} onChange={setAba} />

      {carregando || erro ? (
        <Carregando erro={erro} aoTentarDeNovo={recarregar} />
      ) : dados.length === 0 ? (
        <EmptyState
          title="Nada nessa aba"
          description="Nenhum evento nesta situação agora."
        />
      ) : (
        <div className="report-list">
          {dados.map((evento) => {
            return (
              <article className="report-card" key={evento.id_evento}>
                <header>
                  <div>
                    <small className="eyebrow">
                      {evento.categoria} · {evento.local}, {evento.cidade}/{evento.estado}
                    </small>
                    <h3>{evento.nome}</h3>
                  </div>
                  <StatusBadge status={rotulo(evento.status)} />
                </header>

                <dl className="request-facts">
                  <div>
                    <dt>Organizador</dt>
                    <dd>{evento.nome_organizacao || evento.organizador}</dd>
                  </div>
                  <div>
                    <dt>Período</dt>
                    <dd>{periodo(evento.data_inicio, evento.data_fim)}</dd>
                  </div>
                  <div>
                    <dt>Cotação</dt>
                    <dd>
                      {evento.total_itens} item(ns) · {evento.propostas_recebidas} proposta(s) ·{' '}
                      {evento.propostas_selecionadas} escolhida(s)
                    </dd>
                  </div>
                  <div>
                    <dt>Custo consolidado</dt>
                    <dd>{moeda(evento.custo_consolidado)}</dd>
                  </div>
                </dl>

                {evento.motivo_recusa && evento.status === 'recusado' ? (
                  <p className="request-descricao">Motivo da recusa: {evento.motivo_recusa}</p>
                ) : null}

                {aberto === evento.id_evento ? <Detalhe id={evento.id_evento} /> : null}

                {recusando === evento.id_evento ? (
                  <MotivoRecusa
                    id={`motivo-evento-${evento.id_evento}`}
                    aviso="O organizador vai ver esse motivo e pode corrigir o evento."
                    onConfirmar={(motivo) => decidir(evento, false, motivo)}
                    onCancelar={() => setRecusando(null)}
                  />
                ) : (
                  <footer>
                    <button
                      className="btn-link"
                      onClick={() => setAberto(aberto === evento.id_evento ? null : evento.id_evento)}
                    >
                      {aberto === evento.id_evento ? 'Esconder detalhes' : 'Ver itens, propostas e custos'}
                    </button>
                    {evento.status === 'em_analise' ? (
                      <>
                        <button className="btn-secondary" onClick={() => setRecusando(evento.id_evento)}>
                          Recusar
                        </button>
                        <button className="btn-approve" onClick={() => decidir(evento, true)}>
                          Aprovar evento
                        </button>
                      </>
                    ) : null}
                  </footer>
                )}
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
