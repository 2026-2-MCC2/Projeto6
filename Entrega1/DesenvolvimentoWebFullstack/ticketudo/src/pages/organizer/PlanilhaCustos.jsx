import { Fragment, useState } from 'react'
import { moeda, numero } from '../../utils/format'

// Tabela editavel usada nos itens de custo e nos outros custos do evento.
// colunas: [{ campo, rotulo, tipo: 'select' | 'texto' | 'inteiro' | 'dinheiro', opcoes }]
// Cada linha pode ser editada ali mesmo; a ultima linha da tabela e a de adicionar.

function vazio(colunas) {
  return Object.fromEntries(colunas.map((c) => [c.campo, c.tipo === 'select' ? c.opcoes[0].id : '']))
}

function Celula({ coluna, valor }) {
  if (coluna.tipo === 'dinheiro') return moeda(valor)
  if (coluna.tipo === 'inteiro') return numero(valor)
  if (coluna.tipo === 'select') return coluna.opcoes.find((o) => o.id === valor)?.label ?? valor
  return valor
}

function Entrada({ coluna, valor, onChange, id }) {
  if (coluna.tipo === 'select') {
    return (
      <select id={id} value={valor} onChange={(e) => onChange(e.target.value)} aria-label={coluna.rotulo}>
        {coluna.opcoes.map((o) => (
          <option value={o.id} key={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    )
  }
  const numerico = coluna.tipo === 'inteiro' || coluna.tipo === 'dinheiro'
  return (
    <input
      id={id}
      aria-label={coluna.rotulo}
      type={numerico ? 'number' : 'text'}
      min={numerico ? '0' : undefined}
      step={coluna.tipo === 'dinheiro' ? '0.01' : coluna.tipo === 'inteiro' ? '1' : undefined}
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      placeholder={coluna.exemplo}
    />
  )
}

// converte os valores do formulario para o que a API espera
function paraApi(colunas, linha) {
  return Object.fromEntries(
    colunas.map((c) => [c.campo, c.tipo === 'inteiro' || c.tipo === 'dinheiro' ? Number(linha[c.campo]) : linha[c.campo]]),
  )
}

export default function PlanilhaCustos({
  nome, colunas, linhas, chave, podeEditar, onCriar, onEditar, onExcluir, total, vazioTexto,
}) {
  const [nova, setNova] = useState(() => vazio(colunas))
  const [editando, setEditando] = useState(null)
  const [rascunho, setRascunho] = useState({})
  const [removendo, setRemovendo] = useState(null)
  const [erro, setErro] = useState(null)

  async function executar(acao) {
    setErro(null)
    try {
      await acao()
      return true
    } catch (e) {
      setErro(e.message)
      return false
    }
  }

  async function adicionar(e) {
    e.preventDefault()
    if (await executar(() => onCriar(paraApi(colunas, nova)))) setNova(vazio(colunas))
  }

  async function salvar(linha) {
    if (await executar(() => onEditar(linha[chave], paraApi(colunas, rascunho)))) setEditando(null)
  }

  async function remover(linha) {
    if (await executar(() => onExcluir(linha[chave]))) setRemovendo(null)
  }

  return (
    <div className="planilha">
      {erro ? <p className="form-erro">{erro}</p> : null}
      <div className="tabela-rolagem">
        <table className="tabela planilha-tabela">
          <thead>
            <tr>
              {colunas.map((c) => (
                <th key={c.campo} className={c.tipo === 'dinheiro' || c.tipo === 'inteiro' ? 'num' : ''}>
                  {c.rotulo}
                </th>
              ))}
              {podeEditar ? <th aria-label="Ações" /> : null}
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 ? (
              <tr>
                <td colSpan={colunas.length + 1} className="planilha-vazia">
                  {vazioTexto}
                </td>
              </tr>
            ) : null}
            {linhas.map((linha) => {
              const id = linha[chave]
              if (editando === id) {
                return (
                  <tr key={id} className="planilha-editando">
                    {colunas.map((c) => (
                      <td key={c.campo}>
                        <Entrada
                          id={`${nome}-${id}-${c.campo}`}
                          coluna={c}
                          valor={rascunho[c.campo]}
                          onChange={(v) => setRascunho({ ...rascunho, [c.campo]: v })}
                        />
                      </td>
                    ))}
                    <td className="planilha-acoes">
                      <button className="btn-link" onClick={() => setEditando(null)}>
                        Cancelar
                      </button>
                      <button className="btn-approve" onClick={() => salvar(linha)}>
                        Salvar
                      </button>
                    </td>
                  </tr>
                )
              }
              return (
                <Fragment key={id}>
                  <tr>
                    {colunas.map((c) => (
                      <td key={c.campo} className={c.tipo === 'dinheiro' || c.tipo === 'inteiro' ? 'num' : ''}>
                        <Celula coluna={c} valor={linha[c.campo]} />
                      </td>
                    ))}
                    {podeEditar ? (
                      <td className="planilha-acoes">
                        {removendo === id ? (
                          <>
                            <span>Remover?</span>
                            <button className="btn-link" onClick={() => setRemovendo(null)}>
                              Não
                            </button>
                            <button className="btn-recusar" onClick={() => remover(linha)}>
                              Remover
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn-link"
                              onClick={() => {
                                setEditando(id)
                                setRemovendo(null)
                                setRascunho(Object.fromEntries(colunas.map((c) => [c.campo, String(linha[c.campo])])))
                              }}
                            >
                              Editar
                            </button>
                            <button className="btn-link perigo" onClick={() => setRemovendo(id)}>
                              Remover
                            </button>
                          </>
                        )}
                      </td>
                    ) : null}
                  </tr>
                </Fragment>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={colunas.length - 1}>Total</td>
              <td className="num">{moeda(total)}</td>
              {podeEditar ? <td /> : null}
            </tr>
          </tfoot>
        </table>
      </div>

      {podeEditar ? (
        <form className="planilha-nova" onSubmit={adicionar}>
          {colunas.map((c) => (
            <label key={c.campo} htmlFor={`${nome}-novo-${c.campo}`}>
              <span>{c.rotulo}</span>
              <Entrada
                id={`${nome}-novo-${c.campo}`}
                coluna={c}
                valor={nova[c.campo]}
                onChange={(v) => setNova({ ...nova, [c.campo]: v })}
              />
            </label>
          ))}
          <button className="btn-secondary" type="submit">
            Adicionar
          </button>
        </form>
      ) : null}
    </div>
  )
}
