import { useState } from 'react'
import Carregando from '../../components/Carregando'
import EmptyState from '../../components/EmptyState'
import Field from '../../components/Field'
import PageHeading from '../../components/PageHeading'
import StatusBadge from '../../components/StatusBadge'
import { cotacoes, propostas } from '../../api'
import { nomeDaArea } from '../../data/credenciamento'
import { useCredenciamento } from '../../hooks/useCredenciamento'
import { useRecurso } from '../../hooks/useRecurso'
import { moeda, numero, periodo, rotulo, soData } from '../../utils/format'
import { useApp } from '../../state/useApp'

// Eventos em cotacao (FLX-03) e envio de proposta por item (FLX-04).
// So para fornecedor credenciado.

// data de hoje no horario de quem esta usando (o toISOString seria em UTC)
function hoje() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function FormProposta({ item, onPronto, onCancelar }) {
  const { dispatch } = useApp()
  const editando = !!item.id_proposta && item.situacao === 'enviada'
  const [f, setF] = useState({
    valor: editando ? String(Number(item.valor)) : '',
    descricao: editando ? item.proposta_descricao : '',
    validade: editando ? String(item.validade).slice(0, 10) : '',
    observacoes: editando ? item.observacoes || '' : '',
  })
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const id = `prop-${item.id_item}`

  async function enviar(e) {
    e.preventDefault()
    setErro(null)
    if (!(Number(f.valor) > 0)) return setErro('Informe um valor maior que zero.')
    if (!f.descricao.trim()) return setErro('Descreva o que a proposta inclui.')
    if (!f.validade || f.validade < hoje()) return setErro('A validade não pode ser anterior a hoje.')
    setEnviando(true)
    try {
      const dados = { ...f, valor: Number(f.valor) }
      if (editando) await propostas.editar(item.id_proposta, dados)
      else await propostas.enviar(item.id_item, dados)
      dispatch({ type: 'aviso', texto: editando ? 'Proposta atualizada.' : 'Proposta enviada.' })
      onPronto()
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="proposta-form" onSubmit={enviar} noValidate>
      {erro ? <p className="form-erro">{erro}</p> : null}
      <div className="field-row">
        <Field label="Valor total (R$)">
          <input id={`${id}-valor`} type="number" min="0" step="0.01" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} />
        </Field>
        <Field label="Válida até">
          <input id={`${id}-validade`} type="date" min={hoje()} value={f.validade} onChange={(e) => setF({ ...f, validade: e.target.value })} />
        </Field>
      </div>
      <Field label="O que está incluso">
        <textarea id={`${id}-descricao`} rows={2} value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} placeholder="Equipamento, equipe, montagem…" />
      </Field>
      <Field label="Observações" hint="opcional">
        <textarea id={`${id}-obs`} rows={2} value={f.observacoes} onChange={(e) => setF({ ...f, observacoes: e.target.value })} placeholder="Forma de pagamento, prazo de montagem…" />
      </Field>
      <div className="request-actions">
        <button className="btn-secondary" type="button" onClick={onCancelar}>
          Cancelar
        </button>
        <button className="btn-primary" type="submit" disabled={enviando}>
          {enviando ? 'Enviando…' : editando ? 'Salvar proposta' : 'Enviar proposta'}
        </button>
      </div>
    </form>
  )
}

function Itens({ idEvento, onMudou }) {
  const { dispatch } = useApp()
  const detalhe = useRecurso(() => cotacoes.detalhe(idEvento), idEvento)
  const [aberto, setAberto] = useState(null)
  const [cancelando, setCancelando] = useState(null)

  if (detalhe.carregando || detalhe.erro) return <Carregando erro={detalhe.erro} aoTentarDeNovo={detalhe.recarregar} />

  async function cancelar(item) {
    try {
      await propostas.cancelar(item.id_proposta)
      dispatch({ type: 'aviso', texto: 'Proposta cancelada.' })
      setCancelando(null)
      detalhe.recarregar()
      onMudou()
    } catch (e) {
      dispatch({ type: 'aviso', texto: e.message })
    }
  }

  return (
    <div className="cotacao-itens">
      {detalhe.dados.itens.map((item) => {
        const temProposta = item.id_proposta && item.situacao !== 'cancelada'
        return (
          <div className="cotacao-item" key={item.id_item}>
            <div className="cotacao-item-cab">
              <div>
                <small className="eyebrow">{nomeDaArea(item.categoria)}</small>
                <strong>{item.descricao}</strong>
                <span>Quantidade: {numero(item.quantidade)}</span>
              </div>
              {temProposta ? <StatusBadge status={rotulo(item.situacao)} /> : null}
            </div>

            {temProposta && aberto !== item.id_item ? (
              <div className="cotacao-minha">
                <p>
                  Sua proposta: <strong>{moeda(item.valor)}</strong> · válida até {soData(item.validade)}
                </p>
                <p>{item.proposta_descricao}</p>
                {item.situacao === 'enviada' ? (
                  cancelando === item.id_item ? (
                    <div className="request-actions">
                      <span>Cancelar esta proposta?</span>
                      <button className="btn-secondary" onClick={() => setCancelando(null)}>
                        Não
                      </button>
                      <button className="btn-recusar" onClick={() => cancelar(item)}>
                        Cancelar proposta
                      </button>
                    </div>
                  ) : (
                    <div className="request-actions">
                      <button className="btn-link perigo" onClick={() => setCancelando(item.id_item)}>
                        Cancelar
                      </button>
                      <button className="btn-secondary" onClick={() => setAberto(item.id_item)}>
                        Editar proposta
                      </button>
                    </div>
                  )
                ) : null}
              </div>
            ) : aberto === item.id_item ? (
              <FormProposta
                item={item}
                onCancelar={() => setAberto(null)}
                onPronto={() => {
                  setAberto(null)
                  detalhe.recarregar()
                  onMudou()
                }}
              />
            ) : (
              <div className="request-actions">
                <button className="btn-approve" onClick={() => setAberto(item.id_item)}>
                  {item.situacao === 'cancelada' ? 'Enviar nova proposta' : 'Enviar proposta'}
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Cotacoes({ profile, parametro }) {
  const { situacao, abrir } = useCredenciamento()
  const credenciado = situacao === 'credenciado'
  const lista = useRecurso(() => (credenciado ? cotacoes.lista() : Promise.resolve([])), String(credenciado))
  const [aberto, setAberto] = useState(parametro ?? null)

  const cabecalho = (
    <PageHeading
      eyebrow={profile.tagline}
      title="Eventos em cotação"
      description="Eventos que os organizadores publicaram. Mande uma proposta para cada item que você atende."
    />
  )

  if (situacao && !credenciado) {
    return (
      <>
        {cabecalho}
        <EmptyState
          title="Disponível depois do credenciamento"
          description="Só fornecedores aprovados pelo administrador veem os eventos em cotação."
        />
        <div className="request-actions">
          <button className="btn-primary" onClick={abrir}>
            Ver meu credenciamento
          </button>
        </div>
      </>
    )
  }

  if (lista.carregando || lista.erro) return <Carregando erro={lista.erro} aoTentarDeNovo={lista.recarregar} />

  return (
    <>
      {cabecalho}
      {lista.dados.length === 0 ? (
        <EmptyState
          title="Nenhum evento em cotação agora"
          description="Quando um organizador publicar um evento, ele aparece aqui."
        />
      ) : (
        <div className="report-list">
          {lista.dados.map((ev) => (
            <article className="report-card" key={ev.id_evento}>
              <header>
                <div>
                  <small className="eyebrow">
                    {ev.categoria} · {periodo(ev.data_inicio, ev.data_fim)}
                  </small>
                  <h3>{ev.nome}</h3>
                </div>
                <StatusBadge status={rotulo(ev.status)} />
              </header>
              <p>
                {ev.local} — {ev.cidade}/{ev.estado} · público de {numero(ev.publico_minimo)} a{' '}
                {numero(ev.publico_maximo)} · organizado por {ev.organizador}
              </p>
              {ev.descricao ? <p className="request-descricao">{ev.descricao}</p> : null}

              {aberto === ev.id_evento ? <Itens idEvento={ev.id_evento} onMudou={lista.recarregar} /> : null}

              <footer>
                <small>
                  {ev.total_itens} item(ns) · {ev.minhas_propostas} proposta(s) suas
                </small>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setAberto(aberto === ev.id_evento ? null : ev.id_evento)
                    lista.recarregar()
                  }}
                >
                  {aberto === ev.id_evento ? 'Fechar itens' : 'Ver itens e propor'}
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
