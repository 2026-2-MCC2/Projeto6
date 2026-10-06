import { useState } from 'react'
import Carregando from '../../components/Carregando'
import Field from '../../components/Field'
import PageHeading from '../../components/PageHeading'
import { catalogo, eventos, fornecedores } from '../../api'
import { useRecurso } from '../../hooks/useRecurso'
import { moeda } from '../../utils/format'
import { useApp } from '../../state/useApp'

const loteVazio = {
  setor: '',
  nome: '',
  preco: '',
  quantidade: '',
  margem_revenda: '20',
  data_inicio: '',
  data_fim: '',
}

// o input datetime-local devolve "2027-03-14T20:00"; o mysql quer espaco
function paraBanco(valor) {
  return valor ? valor.replace('T', ' ') + ':00' : ''
}

// Bloco de um fornecedor credenciado, com os servicos dele e o botao
// de solicitar. Carrega os servicos so quando o organizador abre.
function Fornecedor({ fornecedor, idEvento, jaPedidos, onPedido }) {
  const [aberto, setAberto] = useState(false)
  const [escolhido, setEscolhido] = useState(null)
  const [valor, setValor] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState(null)
  const servicos = useRecurso(
    () => (aberto ? fornecedores.servicosDe(fornecedor.id_fornecedor) : Promise.resolve([])),
    `${fornecedor.id_fornecedor}:${aberto}`,
  )

  async function solicitar(e) {
    e.preventDefault()
    setErro(null)
    try {
      await eventos.solicitarServico(idEvento, {
        id_servico: escolhido.id_servico,
        valor_proposto: valor ? Number(valor) : undefined,
        mensagem: mensagem || undefined,
      })
      onPedido(escolhido, fornecedor)
      setEscolhido(null)
      setValor('')
      setMensagem('')
    } catch (err) {
      setErro(err.message)
    }
  }

  return (
    <article className="request-card">
      <header>
        <div>
          <small className="eyebrow">{fornecedor.total_servicos} serviço(s)</small>
          <h3>{fornecedor.nome_empresa}</h3>
          <p>{fornecedor.email}</p>
        </div>
      </header>

      {fornecedor.descricao ? <p className="request-descricao">{fornecedor.descricao}</p> : null}

      {aberto ? (
        servicos.carregando ? (
          <Carregando />
        ) : (
          <div className="servico-lista">
            {(servicos.dados || []).map((s) => {
              const pedido = jaPedidos.includes(s.id_servico)
              return (
                <div key={s.id_servico}>
                  <span className="event-name">
                    <span>{s.nome}</span>
                    <small>{s.descricao || 'sem descrição'}</small>
                  </span>
                  <strong>{moeda(s.preco)}</strong>
                  {pedido ? (
                    <small className="servico-pedido">Solicitado</small>
                  ) : (
                    <button
                      className="btn-approve"
                      onClick={() => {
                        setEscolhido(s)
                        setValor(String(s.preco))
                      }}
                    >
                      Solicitar
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )
      ) : null}

      {escolhido ? (
        <form className="servico-form" onSubmit={solicitar}>
          <strong>Solicitar “{escolhido.nome}”</strong>
          {erro ? <p className="form-erro">{erro}</p> : null}
          <div className="field-row">
            <Field label="Valor que você propõe (R$)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Mensagem">
            <textarea
              rows={2}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Conte o que você precisa. Isso abre o chat com o fornecedor."
            />
          </Field>
          <div className="request-actions">
            <button className="btn-secondary" type="button" onClick={() => setEscolhido(null)}>
              Cancelar
            </button>
            <button className="btn-primary" type="submit">
              Enviar solicitação
            </button>
          </div>
        </form>
      ) : null}

      <footer>
        <button className="btn-secondary" onClick={() => setAberto(!aberto)}>
          {aberto ? 'Fechar serviços' : 'Ver serviços'}
        </button>
      </footer>
    </article>
  )
}

export default function NewEvent({ profile, onNavigate }) {
  const { dispatch } = useApp()
  const categorias = useRecurso(() => catalogo.categorias())
  const vitrine = useRecurso(() => fornecedores.vitrine())

  const [evento, setEvento] = useState({
    nome: '',
    descricao: '',
    data_hora: '',
    id_categoria: '',
    local_nome: '',
    cidade: '',
    estado: '',
    endereco: '',
  })
  const [criado, setCriado] = useState(null)
  const [pedidos, setPedidos] = useState([])
  const [lote, setLote] = useState(loteVazio)
  const [lotes, setLotes] = useState([])
  const [externo, setExterno] = useState({ nome: '', servico: '', valor: '' })
  const [externos, setExternos] = useState([])
  const [mostrarExterno, setMostrarExterno] = useState(false)
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  if (categorias.carregando || categorias.erro) {
    return <Carregando erro={categorias.erro} aoTentarDeNovo={categorias.recarregar} />
  }

  async function criarEvento(e) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      const r = await eventos.criar({
        nome: evento.nome,
        descricao: evento.descricao || undefined,
        data_hora: paraBanco(evento.data_hora),
        id_categoria: Number(evento.id_categoria),
        local: {
          nome: evento.local_nome,
          cidade: evento.cidade,
          estado: evento.estado,
          endereco: evento.endereco,
        },
      })
      setCriado(r)
      dispatch({ type: 'aviso', texto: 'Evento criado. Agora escolha os fornecedores.' })
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  async function adicionarLote(e) {
    e.preventDefault()
    setErro(null)
    try {
      const r = await eventos.criarLote(criado.id_evento, {
        setor: lote.setor,
        nome: lote.nome,
        preco: Number(lote.preco),
        quantidade: Number(lote.quantidade),
        margem_revenda: Number(lote.margem_revenda || 0),
        data_inicio: paraBanco(lote.data_inicio),
        data_fim: paraBanco(lote.data_fim),
      })
      setLotes([...lotes, r])
      setLote({ ...loteVazio, setor: lote.setor, data_inicio: lote.data_inicio, data_fim: lote.data_fim })
    } catch (err) {
      setErro(err.message)
    }
  }

  async function adicionarExterno(e) {
    e.preventDefault()
    setErro(null)
    try {
      const r = await eventos.criarFornecedorExterno(criado.id_evento, {
        nome: externo.nome,
        servico: externo.servico,
        valor: Number(externo.valor),
      })
      setExternos([...externos, r])
      setExterno({ nome: '', servico: '', valor: '' })
    } catch (err) {
      setErro(err.message)
    }
  }

  async function enviarAnalise() {
    setErro(null)
    try {
      await eventos.enviarAnalise(criado.id_evento)
      dispatch({ type: 'aviso', texto: 'Evento enviado. Agora é esperar o administrador aprovar.' })
      onNavigate('events')
    } catch (err) {
      setErro(err.message)
    }
  }

  const arrecadacao = lotes.reduce((s, l) => s + l.preco * l.quantidade, 0)
  const custo =
    pedidos.reduce((s, p) => s + Number(p.valor), 0) + externos.reduce((s, f) => s + Number(f.valor), 0)

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Adicionar evento"
        description="Cadastre o evento, contrate os fornecedores, monte os lotes e envie para análise."
      />

      {erro ? <p className="form-erro">{erro}</p> : null}

      <div className="create-layout">
        <div>
          {!criado ? (
            <form className="form-card" onSubmit={criarEvento}>
              <h3>Dados do evento</h3>

              <Field label="Nome do evento">
                <input
                  id="event-name"
                  value={evento.nome}
                  onChange={(e) => setEvento({ ...evento, nome: e.target.value })}
                  required
                />
              </Field>

              <Field label="Descrição">
                <textarea
                  id="event-desc"
                  rows={3}
                  value={evento.descricao}
                  onChange={(e) => setEvento({ ...evento, descricao: e.target.value })}
                />
              </Field>

              <div className="field-row">
                <Field label="Data e hora">
                  <input
                    id="event-date"
                    type="datetime-local"
                    value={evento.data_hora}
                    onChange={(e) => setEvento({ ...evento, data_hora: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Categoria">
                  <select
                    id="event-categoria"
                    value={evento.id_categoria}
                    onChange={(e) => setEvento({ ...evento, id_categoria: e.target.value })}
                    required
                  >
                    <option value="">Escolha…</option>
                    {categorias.dados.map((c) => (
                      <option value={c.id_categoria} key={c.id_categoria}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <h3>Onde vai acontecer</h3>

              <Field label="Nome do local">
                <input
                  id="event-venue"
                  value={evento.local_nome}
                  onChange={(e) => setEvento({ ...evento, local_nome: e.target.value })}
                  placeholder="Arena da Barra, Clube XV, Chácara do Zé…"
                  required
                />
              </Field>

              <div className="field-row">
                <Field label="Cidade">
                  <input
                    id="event-city"
                    value={evento.cidade}
                    onChange={(e) => setEvento({ ...evento, cidade: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Estado" hint="duas letras">
                  <input
                    id="event-uf"
                    value={evento.estado}
                    maxLength={2}
                    onChange={(e) => setEvento({ ...evento, estado: e.target.value.toUpperCase() })}
                    placeholder="SP"
                    required
                  />
                </Field>
              </div>

              <Field label="Endereço">
                <input
                  id="event-address"
                  value={evento.endereco}
                  onChange={(e) => setEvento({ ...evento, endereco: e.target.value })}
                  placeholder="Rua, número, bairro"
                />
              </Field>

              <div className="request-actions">
                <button className="btn-primary" type="submit" disabled={enviando}>
                  {enviando ? 'Criando…' : 'Criar evento'}
                </button>
              </div>
            </form>
          ) : (
            <>
              <section className="bloco">
                <h3>Fornecedores credenciados</h3>
                <p>
                  Empresas aprovadas pelo administrador. Ao solicitar um serviço, o chat com o
                  fornecedor abre automaticamente.
                </p>
              </section>

              {vitrine.carregando ? (
                <Carregando />
              ) : (vitrine.dados || []).length === 0 ? (
                <div className="empty-state">
                  <strong>Nenhum fornecedor credenciado ainda</strong>
                  <p>Assim que o administrador aprovar um credenciamento, a empresa aparece aqui.</p>
                </div>
              ) : (
                <div className="request-grid">
                  {vitrine.dados.map((f) => (
                    <Fornecedor
                      key={f.id_fornecedor}
                      fornecedor={f}
                      idEvento={criado.id_evento}
                      jaPedidos={pedidos.map((p) => p.id_servico)}
                      onPedido={(servico, forn) => {
                        setPedidos([
                          ...pedidos,
                          {
                            id_servico: servico.id_servico,
                            nome: servico.nome,
                            empresa: forn.nome_empresa,
                            valor: servico.preco,
                          },
                        ])
                        dispatch({
                          type: 'aviso',
                          texto: `Solicitação enviada para ${forn.nome_empresa}. O chat já está aberto.`,
                        })
                      }}
                    />
                  ))}
                </div>
              )}

              <section className="bloco">
                <h3>Tem fornecedor próprio?</h3>
                <p>
                  Se você já contratou alguém fora da plataforma, registre aqui. Serve para o
                  administrador ver o custo total do evento.
                </p>
                {!mostrarExterno ? (
                  <button className="btn-secondary" onClick={() => setMostrarExterno(true)}>
                    Registrar fornecedor próprio
                  </button>
                ) : null}
              </section>

              {mostrarExterno ? (
                <form className="form-card" onSubmit={adicionarExterno}>
                  <h3>Fornecedor próprio</h3>
                  <div className="field-row">
                    <Field label="Nome">
                      <input
                        id="ext-nome"
                        value={externo.nome}
                        onChange={(e) => setExterno({ ...externo, nome: e.target.value })}
                        required
                      />
                    </Field>
                    <Field label="Serviço">
                      <input
                        id="ext-servico"
                        value={externo.servico}
                        onChange={(e) => setExterno({ ...externo, servico: e.target.value })}
                        required
                      />
                    </Field>
                    <Field label="Valor (R$)">
                      <input
                        id="ext-valor"
                        type="number"
                        min="0"
                        step="0.01"
                        value={externo.valor}
                        onChange={(e) => setExterno({ ...externo, valor: e.target.value })}
                        required
                      />
                    </Field>
                  </div>
                  <div className="request-actions">
                    <button className="btn-secondary" type="submit">
                      Registrar fornecedor
                    </button>
                  </div>
                </form>
              ) : null}

              <form className="form-card" onSubmit={adicionarLote}>
                <h3>Lotes de {criado.nome}</h3>
                <p className="form-nota">
                  O setor é onde a pessoa fica (Pista, Camarote). O lote é a fase da venda (1º lote,
                  2º lote). A margem é o quanto o ingresso pode subir na revenda.
                </p>

                <div className="field-row">
                  <Field label="Setor">
                    <input
                      id="lote-setor"
                      value={lote.setor}
                      onChange={(e) => setLote({ ...lote, setor: e.target.value })}
                      placeholder="Pista"
                      required
                    />
                  </Field>
                  <Field label="Lote">
                    <input
                      id="lote-nome"
                      value={lote.nome}
                      onChange={(e) => setLote({ ...lote, nome: e.target.value })}
                      placeholder="1º lote"
                      required
                    />
                  </Field>
                </div>

                <div className="field-row">
                  <Field label="Preço (R$)">
                    <input
                      id="lote-preco"
                      type="number"
                      min="0"
                      step="0.01"
                      value={lote.preco}
                      onChange={(e) => setLote({ ...lote, preco: e.target.value })}
                      required
                    />
                  </Field>
                  <Field label="Quantidade">
                    <input
                      id="lote-qtd"
                      type="number"
                      min="1"
                      value={lote.quantidade}
                      onChange={(e) => setLote({ ...lote, quantidade: e.target.value })}
                      required
                    />
                  </Field>
                  <Field label="Margem revenda (%)" hint="0 trava a revenda no preço original">
                    <input
                      id="lote-margem"
                      type="number"
                      min="0"
                      value={lote.margem_revenda}
                      onChange={(e) => setLote({ ...lote, margem_revenda: e.target.value })}
                    />
                  </Field>
                </div>

                <div className="field-row">
                  <Field label="Venda começa">
                    <input
                      id="lote-inicio"
                      type="datetime-local"
                      value={lote.data_inicio}
                      onChange={(e) => setLote({ ...lote, data_inicio: e.target.value })}
                      required
                    />
                  </Field>
                  <Field label="Venda termina">
                    <input
                      id="lote-fim"
                      type="datetime-local"
                      value={lote.data_fim}
                      onChange={(e) => setLote({ ...lote, data_fim: e.target.value })}
                      required
                    />
                  </Field>
                </div>

                <div className="request-actions">
                  <button className="btn-secondary" type="submit">
                    Adicionar lote
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <aside className="estimate-card">
          <small className="eyebrow">Previsão de arrecadação</small>
          <h3>{moeda(arrecadacao)}</h3>
          <p>se todos os ingressos cadastrados forem vendidos</p>

          {lotes.length > 0 ? (
            <dl>
              {lotes.map((l) => (
                <div key={l.id_lote}>
                  <dt>
                    {l.setor} · {l.nome}
                  </dt>
                  <dd>
                    {l.quantidade} × {moeda(l.preco)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          {pedidos.length > 0 || externos.length > 0 ? (
            <dl>
              {pedidos.map((p) => (
                <div key={`s${p.id_servico}`}>
                  <dt>{p.empresa}</dt>
                  <dd>− {moeda(p.valor)}</dd>
                </div>
              ))}
              {externos.map((f) => (
                <div key={`e${f.id_fornecedor_externo}`}>
                  <dt>{f.nome}</dt>
                  <dd>− {moeda(f.valor)}</dd>
                </div>
              ))}
              <div>
                <dt>
                  <strong>Custo com fornecedores</strong>
                </dt>
                <dd>
                  <strong>{moeda(custo)}</strong>
                </dd>
              </div>
            </dl>
          ) : null}

          <p className="estimate-note">
            {!criado
              ? 'Crie o evento para escolher fornecedores e cadastrar os lotes.'
              : lotes.length === 0
                ? 'Cadastre pelo menos um lote para poder enviar o evento para análise.'
                : 'Quando estiver pronto, envie para o administrador aprovar.'}
          </p>

          {criado && lotes.length > 0 ? (
            <button className="btn-primary btn-block" onClick={enviarAnalise}>
              Enviar para análise
            </button>
          ) : null}
        </aside>
      </div>
    </>
  )
}
