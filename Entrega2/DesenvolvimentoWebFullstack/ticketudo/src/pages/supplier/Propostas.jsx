import { useState } from 'react'
import Carregando from '../../components/Carregando'
import EmptyState from '../../components/EmptyState'
import PageHeading from '../../components/PageHeading'
import StatusBadge from '../../components/StatusBadge'
import { propostas } from '../../api'
import { nomeDaArea } from '../../data/credenciamento'
import { useCredenciamento } from '../../hooks/useCredenciamento'
import { useRecurso } from '../../hooks/useRecurso'
import { dataHora, moeda, rotulo, soData } from '../../utils/format'
import { useApp } from '../../state/useApp'

// Historico das propostas do fornecedor (FLX-04), com a situacao de cada uma.
// Editar e cancelar so enquanto a proposta esta enviada e a cotacao aberta.
export default function Propostas({ profile, onNavigate }) {
  const { dispatch } = useApp()
  const { situacao } = useCredenciamento()
  const credenciado = situacao === 'credenciado'
  const lista = useRecurso(() => (credenciado ? propostas.minhas() : Promise.resolve([])), String(credenciado))
  const [cancelando, setCancelando] = useState(null)

  async function cancelar(p) {
    try {
      await propostas.cancelar(p.id_proposta)
      dispatch({ type: 'aviso', texto: 'Proposta cancelada.' })
      setCancelando(null)
      lista.recarregar()
    } catch (e) {
      dispatch({ type: 'aviso', texto: e.message })
    }
  }

  if (lista.carregando || lista.erro) return <Carregando erro={lista.erro} aoTentarDeNovo={lista.recarregar} />

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Minhas propostas"
        description="Tudo o que você enviou, com a situação de cada proposta."
      />

      {lista.dados.length === 0 ? (
        <EmptyState
          title="Nenhuma proposta ainda"
          description={
            credenciado
              ? 'Abra Eventos em cotação e mande sua primeira proposta.'
              : 'Depois do credenciamento, você manda propostas pelos Eventos em cotação.'
          }
        />
      ) : (
        <div className="tabela-rolagem bloco">
          <table className="tabela">
            <thead>
              <tr>
                <th>Evento</th>
                <th>Item</th>
                <th className="num">Valor</th>
                <th>Validade</th>
                <th>Situação</th>
                <th>Atualizada</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {lista.dados.map((p) => {
                const podeMudar = p.situacao === 'enviada' && p.status_evento === 'em_cotacao'
                return (
                  <tr key={p.id_proposta}>
                    <td>
                      <strong>{p.evento}</strong>
                      <br />
                      <small>{rotulo(p.status_evento)}</small>
                    </td>
                    <td>
                      {p.item}
                      <br />
                      <small>{nomeDaArea(p.categoria)}</small>
                    </td>
                    <td className="num">{moeda(p.valor)}</td>
                    <td>
                      {soData(p.validade)}
                      {p.vencida && p.situacao === 'enviada' ? <small className="texto-perigo"> vencida</small> : null}
                    </td>
                    <td>
                      <StatusBadge status={rotulo(p.situacao)} />
                    </td>
                    <td>{dataHora(p.atualizado_em)}</td>
                    <td className="planilha-acoes">
                      {podeMudar ? (
                        cancelando === p.id_proposta ? (
                          <>
                            <button className="btn-link" onClick={() => setCancelando(null)}>
                              Não
                            </button>
                            <button className="btn-recusar" onClick={() => cancelar(p)}>
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="btn-link" onClick={() => onNavigate('cotacoes', p.id_evento)}>
                              Editar
                            </button>
                            <button className="btn-link perigo" onClick={() => setCancelando(p.id_proposta)}>
                              Cancelar
                            </button>
                          </>
                        )
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
