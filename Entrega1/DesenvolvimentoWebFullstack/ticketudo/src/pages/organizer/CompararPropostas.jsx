import { useState } from 'react'
import Carregando from '../../components/Carregando'
import StatusBadge from '../../components/StatusBadge'
import { eventos, propostas } from '../../api'
import { nomeDaArea } from '../../data/credenciamento'
import { useRecurso } from '../../hooks/useRecurso'
import { moeda, numero, rotulo, soData } from '../../utils/format'
import { useApp } from '../../state/useApp'

// Comparar as propostas de cada item e escolher uma por item (FLX-05).
// So da para escolher com a cotacao encerrada.
export default function CompararPropostas({ idEvento, versao, onMudou }) {
  const { dispatch } = useApp()
  const lista = useRecurso(() => eventos.propostas(idEvento), `${idEvento}:${versao}`)
  const [ocupado, setOcupado] = useState(null)

  if (lista.carregando || lista.erro) return <Carregando erro={lista.erro} aoTentarDeNovo={lista.recarregar} />

  const { itens, pode_selecionar: podeSelecionar, status } = lista.dados
  const total = itens.reduce((s, i) => s + i.propostas.length, 0)

  async function escolher(p, selecionar) {
    setOcupado(p.id_proposta)
    try {
      if (selecionar) await propostas.selecionar(p.id_proposta)
      else await propostas.desmarcar(p.id_proposta)
      dispatch({
        type: 'aviso',
        texto: selecionar ? `Proposta de ${p.fornecedor} selecionada.` : 'Escolha desfeita.',
      })
      lista.recarregar()
      onMudou()
    } catch (e) {
      dispatch({ type: 'aviso', texto: e.message })
    } finally {
      setOcupado(null)
    }
  }

  return (
    <div className="comparar">
      {total === 0 ? (
        <p className="comparar-nota">
          {status === 'em_cotacao'
            ? 'Nenhuma proposta ainda. Os fornecedores credenciados estão vendo os itens.'
            : 'Nenhuma proposta recebida.'}
        </p>
      ) : !podeSelecionar && status === 'em_cotacao' ? (
        <p className="comparar-nota">Encerre a cotação para escolher as propostas.</p>
      ) : null}

      {itens.map((item) => {
        const menor = item.propostas.length ? Math.min(...item.propostas.map((p) => Number(p.valor))) : null
        return (
          <div className="comparar-item" key={item.id_item}>
            <div className="comparar-item-cab">
              <div>
                <small className="eyebrow">{nomeDaArea(item.categoria)}</small>
                <strong>{item.descricao}</strong>
              </div>
              <span>
                Qtd. {numero(item.quantidade)} · estimado {moeda(item.custo_estimado)}
              </span>
            </div>

            {item.propostas.length === 0 ? (
              <p className="comparar-nota">Sem proposta. Entra no orçamento pelo custo estimado.</p>
            ) : (
              <div className="comparar-grade">
                {item.propostas.map((p) => {
                  const selecionada = p.situacao === 'selecionada'
                  return (
                    <article
                      className={`comparar-proposta${selecionada ? ' is-selecionada' : ''}`}
                      key={p.id_proposta}
                    >
                      <header>
                        <strong>{p.fornecedor}</strong>
                        <StatusBadge status={rotulo(p.situacao)} />
                      </header>
                      <b className="comparar-valor">{moeda(p.valor)}</b>
                      {Number(p.valor) === menor && item.propostas.length > 1 ? (
                        <small className="comparar-menor">Menor valor</small>
                      ) : null}
                      <p>{p.descricao}</p>
                      {p.observacoes ? <p className="comparar-obs">{p.observacoes}</p> : null}
                      <small>
                        Válida até {soData(p.validade)}
                        {p.cidade ? ` · ${p.cidade}/${p.estado}` : ''}
                      </small>
                      {podeSelecionar ? (
                        <button
                          className={selecionada ? 'btn-secondary' : 'btn-approve'}
                          disabled={ocupado === p.id_proposta}
                          onClick={() => escolher(p, !selecionada)}
                        >
                          {selecionada ? 'Desmarcar' : 'Selecionar'}
                        </button>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
