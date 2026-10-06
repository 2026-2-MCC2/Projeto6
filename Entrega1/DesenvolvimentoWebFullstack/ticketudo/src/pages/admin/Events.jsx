import { useState } from 'react'
import Carregando from '../../components/Carregando'
import EmptyState from '../../components/EmptyState'
import PageHeading from '../../components/PageHeading'
import StatusBadge from '../../components/StatusBadge'
import Tabs from '../../components/Tabs'
import { admin, eventos as apiEventos } from '../../api'
import { useRecurso } from '../../hooks/useRecurso'
import { dataHora, moeda, rotulo } from '../../utils/format'
import { useApp } from '../../state/useApp'

const abas = [
  { id: 'em_analise', label: 'Em análise' },
  { id: 'aprovado', label: 'Aprovados' },
  { id: 'recusado', label: 'Recusados' },
]

function Detalhe({ id }) {
  const { dados, carregando, erro, recarregar } = useRecurso(() => apiEventos.detalhe(id), id)

  if (carregando || erro) return <Carregando erro={erro} aoTentarDeNovo={recarregar} />

  return (
    <div className="evento-detalhe">
      <strong>Lotes</strong>
      {dados.lotes.length === 0 ? (
        <p>Nenhum lote cadastrado.</p>
      ) : (
        <table className="tabela">
          <thead>
            <tr>
              <th>Setor</th>
              <th>Lote</th>
              <th>Preço</th>
              <th>Qtd.</th>
              <th>Teto revenda</th>
              <th>Venda</th>
            </tr>
          </thead>
          <tbody>
            {dados.lotes.map((lote) => (
              <tr key={lote.id_lote}>
                <td>{lote.setor}</td>
                <td>{lote.nome}</td>
                <td>{moeda(lote.preco)}</td>
                <td>{lote.quantidade}</td>
                <td>{moeda(Number(lote.preco) * (1 + Number(lote.margem_revenda) / 100))}</td>
                <td>
                  {dataHora(lote.data_inicio)} → {dataHora(lote.data_fim)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

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

      {dados.servicos_solicitados.length > 0 ? (
        <>
          <strong>Fornecedores da plataforma</strong>
          <ul className="lista-simples">
            {dados.servicos_solicitados.map((s) => (
              <li key={s.id_solicitacao}>
                {s.nome_empresa} — {s.servico} · {moeda(s.valor_proposto)} ({rotulo(s.status)})
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
  const { dados, carregando, erro, recarregar } = useRecurso(() => admin.eventos(aba), aba)

  async function decidir(evento, aprovar) {
    try {
      if (aprovar) {
        const r = await admin.aprovarEvento(evento.id_evento)
        dispatch({
          type: 'aviso',
          texto: `${evento.nome} aprovado. ${r.ingressos_gerados} ingressos gerados.`,
        })
      } else {
        const motivo = window.prompt('Por que está recusando?')
        if (!motivo) return
        await admin.recusarEvento(evento.id_evento, motivo)
        dispatch({ type: 'aviso', texto: `${evento.nome} recusado.` })
      }
      setAberto(null)
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
        title="Eventos para análise"
        description="Confira os lotes, o teto de revenda e o custo com fornecedores antes de liberar a venda."
      />

      <Tabs options={abas} value={aba} onChange={setAba} />

      {carregando || erro ? (
        <Carregando erro={erro} aoTentarDeNovo={recarregar} />
      ) : dados.length === 0 ? (
        <EmptyState
          title="Nada nessa aba"
          description="Quando um organizador enviar um evento para análise, ele aparece aqui."
        />
      ) : (
        <div className="report-list">
          {dados.map((evento) => {
            const custo =
              Number(evento.custo_fornecedores_externos) +
              Number(evento.custo_fornecedores_plataforma)

            return (
              <article className="report-card" key={evento.id_evento}>
                <header>
                  <div>
                    <small className="eyebrow">
                      {evento.categoria} · {evento.local}, {evento.cidade}
                    </small>
                    <h3>{evento.nome}</h3>
                  </div>
                  <StatusBadge status={rotulo(evento.status)} />
                </header>

                <dl className="request-facts">
                  <div>
                    <dt>Organizador</dt>
                    <dd>{evento.organizador}</dd>
                  </div>
                  <div>
                    <dt>Data do evento</dt>
                    <dd>{dataHora(evento.data_hora)}</dd>
                  </div>
                  <div>
                    <dt>Lotes</dt>
                    <dd>{evento.total_lotes}</dd>
                  </div>
                  <div>
                    <dt>Custo com fornecedores</dt>
                    <dd>{moeda(custo)}</dd>
                  </div>
                </dl>

                {evento.motivo_recusa ? (
                  <p className="request-descricao">Motivo da recusa: {evento.motivo_recusa}</p>
                ) : null}

                {aberto === evento.id_evento ? <Detalhe id={evento.id_evento} /> : null}

                <footer>
                  <button
                    className="btn-link"
                    onClick={() => setAberto(aberto === evento.id_evento ? null : evento.id_evento)}
                  >
                    {aberto === evento.id_evento ? 'Esconder detalhes' : 'Ver lotes e fornecedores'}
                  </button>
                  {evento.status === 'em_analise' ? (
                    <>
                      <button className="btn-secondary" onClick={() => decidir(evento, false)}>
                        Recusar
                      </button>
                      <button className="btn-approve" onClick={() => decidir(evento, true)}>
                        Aprovar evento
                      </button>
                    </>
                  ) : null}
                </footer>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
