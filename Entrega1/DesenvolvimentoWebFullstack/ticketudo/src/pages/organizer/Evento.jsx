import { useState } from 'react'
import Carregando from '../../components/Carregando'
import PageHeading from '../../components/PageHeading'
import StatusBadge from '../../components/StatusBadge'
import EventoForm from './EventoForm'
import PlanilhaCustos from './PlanilhaCustos'
import { catalogo, eventos } from '../../api'
import { AREAS_FORNECEDOR } from '../../data/credenciamento'
import { useRecurso } from '../../hooks/useRecurso'
import { moeda, numero, periodo, rotulo } from '../../utils/format'
import { useApp } from '../../state/useApp'

// Tela de um evento do organizador: dados, itens de custo e outros custos
// (FLX-02), editar e excluir (WEB-05).

const TIPOS_CUSTO = [
  { id: 'fiscal', label: 'Fiscal' },
  { id: 'operacional', label: 'Operacional' },
  { id: 'variavel', label: 'Variável' },
  { id: 'outro', label: 'Outro' },
]

const COLUNAS_ITEM = [
  { campo: 'categoria', rotulo: 'Categoria', tipo: 'select', opcoes: AREAS_FORNECEDOR },
  { campo: 'descricao', rotulo: 'Descrição', tipo: 'texto', exemplo: 'Iluminação de palco' },
  { campo: 'quantidade', rotulo: 'Qtd.', tipo: 'inteiro', exemplo: '1' },
  { campo: 'custo_estimado', rotulo: 'Custo estimado (R$)', tipo: 'dinheiro', exemplo: '0,00' },
]

const COLUNAS_CUSTO = [
  { campo: 'tipo', rotulo: 'Tipo', tipo: 'select', opcoes: TIPOS_CUSTO },
  { campo: 'descricao', rotulo: 'Descrição', tipo: 'texto', exemplo: 'ISS, taxa de alvará…' },
  { campo: 'valor', rotulo: 'Valor (R$)', tipo: 'dinheiro', exemplo: '0,00' },
]

// em que situacao da pra mexer em cada parte (mesma regra do backend)
const EDITAVEL = {
  dados: ['rascunho', 'recusado'],
  itens: ['rascunho', 'recusado'],
  custos: ['rascunho', 'recusado', 'em_cotacao', 'cotacao_encerrada'],
}

// parametro: o id do evento, ou { id, editar: true } para abrir ja editando
export default function Evento({ parametro, onNavigate }) {
  const id = typeof parametro === 'object' && parametro ? parametro.id : parametro
  const { dispatch } = useApp()
  const plano = useRecurso(() => eventos.planejamento(id), id)
  const categorias = useRecurso(() => catalogo.categorias())
  const [editando, setEditando] = useState(!!parametro?.editar)
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState(null)

  if (!id) {
    return (
      <div className="empty-state">
        <strong>Nenhum evento aberto</strong>
        <button className="btn-primary" onClick={() => onNavigate('events')}>
          Ver meus eventos
        </button>
      </div>
    )
  }
  if (plano.carregando || plano.erro) return <Carregando erro={plano.erro} aoTentarDeNovo={plano.recarregar} />

  const ev = plano.dados
  const pode = (parte) => EDITAVEL[parte].includes(ev.status)
  const totalEstimado = ev.totais.itens_estimado + ev.totais.custos

  async function acao(fn, aviso) {
    setErro(null)
    try {
      await fn()
      if (aviso) dispatch({ type: 'aviso', texto: aviso })
      plano.recarregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  async function salvarDados(dados) {
    await eventos.editar(ev.id_evento, dados)
    setEditando(false)
    dispatch({ type: 'aviso', texto: 'Evento atualizado.' })
    plano.recarregar()
  }

  async function excluir() {
    setErro(null)
    try {
      await eventos.excluir(ev.id_evento)
      dispatch({ type: 'aviso', texto: `${ev.nome} excluído.` })
      onNavigate('events')
    } catch (e) {
      setErro(e.message)
      setExcluindo(false)
    }
  }

  return (
    <>
      <PageHeading
        eyebrow={`${ev.local.categoria} · ${periodo(ev.data_inicio, ev.data_fim)}`}
        title={ev.nome}
        description={`${ev.local.nome} — ${ev.local.cidade}/${ev.local.estado}`}
      >
        <StatusBadge status={rotulo(ev.status)} />
      </PageHeading>

      {erro ? <p className="form-erro">{erro}</p> : null}
      {ev.motivo_recusa && ev.status === 'recusado' ? (
        <p className="request-descricao">O administrador recusou: {ev.motivo_recusa}</p>
      ) : null}

      <div className="create-layout">
        <div className="evento-secoes">
          {editando && !categorias.carregando ? (
            <EventoForm
              evento={ev}
              categorias={categorias.dados || []}
              rotuloBotao="Salvar alterações"
              onSalvar={salvarDados}
              onCancelar={() => setEditando(false)}
            />
          ) : (
            <section className="bloco">
              <div className="bloco-cab">
                <h3>Dados do evento</h3>
                {pode('dados') ? (
                  <button className="btn-secondary" onClick={() => setEditando(true)}>
                    Editar dados
                  </button>
                ) : null}
              </div>
              {ev.descricao ? <p>{ev.descricao}</p> : null}
              <dl className="request-facts">
                <div>
                  <dt>Público mínimo</dt>
                  <dd>{numero(ev.publico_minimo)} pessoas</dd>
                </div>
                <div>
                  <dt>Público máximo</dt>
                  <dd>{numero(ev.publico_maximo)} pessoas</dd>
                </div>
                <div>
                  <dt>Público esperado</dt>
                  <dd>{ev.publico_esperado ? `${numero(ev.publico_esperado)} pessoas` : '—'}</dd>
                </div>
                <div>
                  <dt>Margem de lucro</dt>
                  <dd>{Number(ev.margem_lucro).toLocaleString('pt-BR')}%</dd>
                </div>
              </dl>
            </section>
          )}

          <section className="bloco">
            <div className="bloco-cab">
              <h3>Itens de custo</h3>
            </div>
            <p>
              O que o evento precisa contratar. É sobre esses itens que os fornecedores mandam
              propostas.
              {!pode('itens') ? ' Com o evento nesta situação, os itens não mudam.' : ''}
            </p>
            <PlanilhaCustos
              nome="item"
              colunas={COLUNAS_ITEM}
              linhas={ev.itens}
              chave="id_item"
              podeEditar={pode('itens')}
              total={ev.totais.itens_estimado}
              vazioTexto="Nenhum item ainda. Comece pelo que o evento mais precisa."
              onCriar={(d) => acao(() => eventos.criarItem(ev.id_evento, d), 'Item adicionado.')}
              onEditar={(idItem, d) => acao(() => eventos.editarItem(ev.id_evento, idItem, d), 'Item atualizado.')}
              onExcluir={(idItem) => acao(() => eventos.excluirItem(ev.id_evento, idItem), 'Item removido.')}
            />
          </section>

          <section className="bloco">
            <div className="bloco-cab">
              <h3>Outros custos</h3>
            </div>
            <p>
              Custos que não vêm de fornecedor: impostos e taxas (fiscal), equipe e produção
              (operacional) e gastos que mudam com o público (variável, lançado como valor total).
            </p>
            <PlanilhaCustos
              nome="custo"
              colunas={COLUNAS_CUSTO}
              linhas={ev.custos}
              chave="id_custo"
              podeEditar={pode('custos')}
              total={ev.totais.custos}
              vazioTexto="Nenhum custo extra lançado."
              onCriar={(d) => acao(() => eventos.criarCusto(ev.id_evento, d), 'Custo adicionado.')}
              onEditar={(idCusto, d) => acao(() => eventos.editarCusto(ev.id_evento, idCusto, d), 'Custo atualizado.')}
              onExcluir={(idCusto) => acao(() => eventos.excluirCusto(ev.id_evento, idCusto), 'Custo removido.')}
            />
          </section>
        </div>

        <aside className="estimate-card">
          <small className="eyebrow">Custo estimado</small>
          <h3>{moeda(totalEstimado)}</h3>
          <p>itens de custo + outros custos</p>
          <dl>
            <div>
              <dt>Itens de custo ({ev.itens.length})</dt>
              <dd>{moeda(ev.totais.itens_estimado)}</dd>
            </div>
            {TIPOS_CUSTO.map((t) =>
              ev.totais.custos_por_tipo[t.id] ? (
                <div key={t.id}>
                  <dt>{t.label}</dt>
                  <dd>{moeda(ev.totais.custos_por_tipo[t.id])}</dd>
                </div>
              ) : null,
            )}
          </dl>

          {['rascunho', 'recusado'].includes(ev.status) ? (
            <button
              className="btn-primary btn-block"
              disabled={ev.itens.length === 0}
              onClick={() =>
                acao(() => eventos.enviarAnalise(ev.id_evento), 'Evento enviado para o administrador.')
              }
            >
              Enviar para análise
            </button>
          ) : null}
          {ev.itens.length === 0 && ['rascunho', 'recusado'].includes(ev.status) ? (
            <p className="estimate-note">Cadastre pelo menos um item de custo para enviar.</p>
          ) : null}

          {!['em_analise', 'aprovado'].includes(ev.status) ? (
            excluindo ? (
              <div className="confirmar-exclusao" role="alert">
                <p>Excluir “{ev.nome}”? Isso apaga também os itens e os custos.</p>
                <div>
                  <button className="btn-secondary" onClick={() => setExcluindo(false)}>
                    Cancelar
                  </button>
                  <button className="btn-recusar" onClick={excluir}>
                    Excluir evento
                  </button>
                </div>
              </div>
            ) : (
              <button className="btn-link perigo" onClick={() => setExcluindo(true)}>
                Excluir evento
              </button>
            )
          ) : null}
        </aside>
      </div>
    </>
  )
}
