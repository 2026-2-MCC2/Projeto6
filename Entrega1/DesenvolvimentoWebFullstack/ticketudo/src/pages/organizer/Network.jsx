import { useState } from 'react'
import Carregando from '../../components/Carregando'
import EmptyState from '../../components/EmptyState'
import Field from '../../components/Field'
import PageHeading from '../../components/PageHeading'
import { eventos, fornecedores } from '../../api'
import { useRecurso } from '../../hooks/useRecurso'
import { moeda } from '../../utils/format'
import { useApp } from '../../state/useApp'

function Solicitar({ fornecedor, meusEventos, onPronto }) {
  const { dispatch } = useApp()
  const servicos = useRecurso(
    () => fornecedores.servicosDe(fornecedor.id_fornecedor),
    fornecedor.id_fornecedor,
  )
  const [form, setForm] = useState({ id_evento: '', id_servico: '', mensagem: '', valor: '' })
  const [erro, setErro] = useState(null)

  if (servicos.carregando || servicos.erro) {
    return <Carregando erro={servicos.erro} aoTentarDeNovo={servicos.recarregar} />
  }

  async function enviar(e) {
    e.preventDefault()
    setErro(null)
    try {
      await eventos.solicitarServico(Number(form.id_evento), {
        id_servico: Number(form.id_servico),
        mensagem: form.mensagem || undefined,
        valor_proposto: form.valor ? Number(form.valor) : undefined,
      })
      dispatch({
        type: 'aviso',
        texto: `Solicitação enviada para ${fornecedor.nome_empresa}. O chat já está aberto.`,
      })
      onPronto()
    } catch (err) {
      setErro(err.message)
    }
  }

  const disponiveis = meusEventos.filter((e) => e.status === 'rascunho' || e.status === 'aprovado')

  return (
    <form className="form-card" onSubmit={enviar}>
      <h3>Solicitar serviço de {fornecedor.nome_empresa}</h3>
      {erro ? <p className="form-erro">{erro}</p> : null}

      {disponiveis.length === 0 ? (
        <p className="form-nota">Crie um evento antes de solicitar serviço.</p>
      ) : (
        <>
          <Field label="Para qual evento">
            <select
              id="request-evento"
              value={form.id_evento}
              onChange={(e) => setForm({ ...form, id_evento: e.target.value })}
              required
            >
              <option value="">Escolha…</option>
              {disponiveis.map((e) => (
                <option value={e.id_evento} key={e.id_evento}>
                  {e.nome}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Serviço">
            <select
              id="request-servico"
              value={form.id_servico}
              onChange={(e) => setForm({ ...form, id_servico: e.target.value })}
              required
            >
              <option value="">Escolha…</option>
              {servicos.dados.map((s) => (
                <option value={s.id_servico} key={s.id_servico}>
                  {s.nome} — {moeda(s.preco)}
                </option>
              ))}
            </select>
          </Field>

          <div className="field-row">
            <Field label="Valor que você propõe (R$)" hint="Deixe vazio para usar o preço de tabela">
              <input
                id="request-valor"
                type="number"
                min="0"
                step="0.01"
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Mensagem">
            <textarea
              id="request-scope"
              rows={3}
              value={form.mensagem}
              onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
              placeholder="Conte o que você precisa."
            />
          </Field>

          <div className="request-actions">
            <button className="btn-primary" type="submit">
              Enviar solicitação
            </button>
          </div>
        </>
      )}
    </form>
  )
}

export default function Network({ profile }) {
  const [aberto, setAberto] = useState(null)
  const vitrine = useRecurso(() => fornecedores.vitrine())
  const meus = useRecurso(() => eventos.meus())

  if (vitrine.carregando || vitrine.erro) {
    return <Carregando erro={vitrine.erro} aoTentarDeNovo={vitrine.recarregar} />
  }

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Fornecedores credenciados"
        description="Só aparece aqui quem passou pela análise do administrador."
      />

      {vitrine.dados.length === 0 ? (
        <EmptyState
          title="Nenhum fornecedor credenciado ainda"
          description="Assim que o administrador aprovar um credenciamento, a empresa aparece aqui."
        />
      ) : (
        <div className="request-grid">
          {vitrine.dados.map((f) => (
            <article className="request-card" key={f.id_fornecedor}>
              <header>
                <div>
                  <small className="eyebrow">{f.total_servicos} serviço(s)</small>
                  <h3>{f.nome_empresa}</h3>
                  <p>{f.email}</p>
                </div>
              </header>

              {f.descricao ? <p className="request-descricao">{f.descricao}</p> : null}

              <footer>
                <button
                  className="btn-primary"
                  onClick={() => setAberto(aberto?.id_fornecedor === f.id_fornecedor ? null : f)}
                >
                  {aberto?.id_fornecedor === f.id_fornecedor ? 'Fechar' : 'Ver perfil e solicitar'}
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}

      {aberto && !meus.carregando ? (
        <Solicitar
          fornecedor={aberto}
          meusEventos={meus.dados || []}
          onPronto={() => setAberto(null)}
        />
      ) : null}
    </>
  )
}
