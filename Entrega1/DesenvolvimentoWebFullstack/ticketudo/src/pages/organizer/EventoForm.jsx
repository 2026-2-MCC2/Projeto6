import { useState } from 'react'
import Field from '../../components/Field'
import { UFS } from '../../utils/validacao'

// Formulario dos dados do evento (FLX-02). Serve para criar (NewEvent) e
// para editar (tela do evento, WEB-05).

// o input datetime-local usa "2027-03-14T20:00"; o banco grava "2027-03-14 20:00:00"
function paraBanco(valor) {
  return valor ? valor.replace('T', ' ') + ':00' : ''
}

// data que veio da API -> valor do input datetime-local, no horario local
function paraInput(valor) {
  if (!valor) return ''
  const d = new Date(valor)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function inicial(evento) {
  if (!evento) {
    return {
      nome: '', descricao: '', id_categoria: '', data_inicio: '', data_fim: '',
      local_nome: '', cidade: '', estado: '', endereco: '',
      publico_minimo: '', publico_maximo: '', publico_esperado: '', margem_lucro: '',
    }
  }
  return {
    nome: evento.nome,
    descricao: evento.descricao || '',
    id_categoria: String(evento.id_categoria),
    data_inicio: paraInput(evento.data_inicio),
    data_fim: paraInput(evento.data_fim),
    local_nome: evento.local?.nome || '',
    cidade: evento.local?.cidade || '',
    estado: evento.local?.estado || '',
    endereco: evento.local?.endereco || '',
    publico_minimo: String(evento.publico_minimo),
    publico_maximo: String(evento.publico_maximo),
    publico_esperado: evento.publico_esperado ? String(evento.publico_esperado) : '',
    margem_lucro: String(Number(evento.margem_lucro)),
  }
}

// mesmas regras do backend, para avisar antes de enviar
function validar(f, editando) {
  const erros = {}
  const inteiro = (v) => Number.isInteger(Number(v)) && v !== ''
  if (!f.nome.trim()) erros.nome = 'Dê um nome ao evento.'
  if (!f.id_categoria) erros.id_categoria = 'Escolha a categoria.'
  if (!f.data_inicio) erros.data_inicio = 'Informe quando começa.'
  else if (!editando && new Date(f.data_inicio) <= new Date()) erros.data_inicio = 'O evento precisa começar no futuro.'
  if (!f.data_fim) erros.data_fim = 'Informe quando termina.'
  else if (f.data_inicio && f.data_fim < f.data_inicio) erros.data_fim = 'O fim não pode ser antes do começo.'
  if (!f.local_nome.trim()) erros.local_nome = 'Informe o local.'
  if (!f.cidade.trim()) erros.cidade = 'Informe a cidade.'
  if (!f.estado) erros.estado = 'Escolha a UF.'
  if (!inteiro(f.publico_minimo) || Number(f.publico_minimo) <= 0) erros.publico_minimo = 'Número inteiro maior que zero.'
  if (!inteiro(f.publico_maximo) || Number(f.publico_maximo) < Number(f.publico_minimo)) {
    erros.publico_maximo = 'Precisa ser maior ou igual ao mínimo.'
  }
  if (f.publico_esperado !== '') {
    const e = Number(f.publico_esperado)
    if (!inteiro(f.publico_esperado) || e < Number(f.publico_minimo) || e > Number(f.publico_maximo)) {
      erros.publico_esperado = 'Fica entre o mínimo e o máximo.'
    }
  }
  const m = f.margem_lucro === '' ? 0 : Number(f.margem_lucro)
  if (!(m >= 0 && m < 100)) erros.margem_lucro = 'De 0 a 99,99%.'
  return erros
}

export default function EventoForm({ evento, categorias, rotuloBotao, onSalvar, onCancelar }) {
  const editando = !!evento
  const [f, setF] = useState(() => inicial(evento))
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState(null)
  const [enviando, setEnviando] = useState(false)

  const mudar = (campo) => (e) => {
    const valor = campo === 'estado' ? e.target.value.toUpperCase() : e.target.value
    setF((atual) => ({ ...atual, [campo]: valor }))
    setErros((atual) => ({ ...atual, [campo]: undefined }))
  }

  async function enviar(e) {
    e.preventDefault()
    setErroGeral(null)
    const encontrados = validar(f, editando)
    setErros(encontrados)
    if (Object.keys(encontrados).length) return

    setEnviando(true)
    try {
      await onSalvar({
        nome: f.nome.trim(),
        descricao: f.descricao.trim() || undefined,
        id_categoria: Number(f.id_categoria),
        data_inicio: paraBanco(f.data_inicio),
        data_fim: paraBanco(f.data_fim),
        local: { nome: f.local_nome, cidade: f.cidade, estado: f.estado, endereco: f.endereco },
        publico_minimo: Number(f.publico_minimo),
        publico_maximo: Number(f.publico_maximo),
        publico_esperado: f.publico_esperado === '' ? null : Number(f.publico_esperado),
        margem_lucro: f.margem_lucro === '' ? 0 : Number(f.margem_lucro),
      })
    } catch (err) {
      setErroGeral(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="form-card" onSubmit={enviar} noValidate>
      <h3>Dados do evento</h3>
      {erroGeral ? <p className="form-erro">{erroGeral}</p> : null}

      <Field label="Nome do evento" error={erros.nome}>
        <input id="event-name" value={f.nome} onChange={mudar('nome')} />
      </Field>

      <Field label="Descrição">
        <textarea id="event-desc" rows={3} value={f.descricao} onChange={mudar('descricao')} />
      </Field>

      <div className="field-row">
        <Field label="Começa" error={erros.data_inicio}>
          <input id="event-inicio" type="datetime-local" value={f.data_inicio} onChange={mudar('data_inicio')} />
        </Field>
        <Field label="Termina" error={erros.data_fim}>
          <input id="event-fim" type="datetime-local" value={f.data_fim} onChange={mudar('data_fim')} />
        </Field>
        <Field label="Categoria" error={erros.id_categoria}>
          <select id="event-categoria" value={f.id_categoria} onChange={mudar('id_categoria')}>
            <option value="">Escolha…</option>
            {categorias.map((c) => (
              <option value={c.id_categoria} key={c.id_categoria}>
                {c.nome}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <h3>Onde vai acontecer</h3>

      <Field label="Nome do local" error={erros.local_nome}>
        <input
          id="event-venue"
          value={f.local_nome}
          onChange={mudar('local_nome')}
          placeholder="Arena da Barra, Clube XV, Chácara do Zé…"
        />
      </Field>

      <div className="field-row">
        <Field label="Cidade" error={erros.cidade}>
          <input id="event-city" value={f.cidade} onChange={mudar('cidade')} />
        </Field>
        <Field label="UF" error={erros.estado}>
          <select id="event-uf" value={f.estado} onChange={mudar('estado')}>
            <option value="">—</option>
            {UFS.map((uf) => (
              <option key={uf}>{uf}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Endereço">
        <input id="event-address" value={f.endereco} onChange={mudar('endereco')} placeholder="Rua, número, bairro" />
      </Field>

      <h3>Público e margem</h3>
      <p className="form-nota">
        O público mínimo e o máximo são os dois cenários do cálculo do ticket. A margem é o lucro
        desejado sobre a receita.
      </p>

      <div className="field-row">
        <Field label="Público mínimo" error={erros.publico_minimo}>
          <input id="event-pub-min" type="number" min="1" step="1" value={f.publico_minimo} onChange={mudar('publico_minimo')} />
        </Field>
        <Field label="Público máximo" error={erros.publico_maximo}>
          <input id="event-pub-max" type="number" min="1" step="1" value={f.publico_maximo} onChange={mudar('publico_maximo')} />
        </Field>
        <Field label="Público esperado" hint="opcional" error={erros.publico_esperado}>
          <input id="event-pub-esp" type="number" min="1" step="1" value={f.publico_esperado} onChange={mudar('publico_esperado')} />
        </Field>
        <Field label="Margem de lucro (%)" error={erros.margem_lucro}>
          <input id="event-margem" type="number" min="0" max="99.99" step="0.01" value={f.margem_lucro} onChange={mudar('margem_lucro')} placeholder="20" />
        </Field>
      </div>

      <div className="request-actions">
        {onCancelar ? (
          <button className="btn-secondary" type="button" onClick={onCancelar}>
            Cancelar
          </button>
        ) : null}
        <button className="btn-primary" type="submit" disabled={enviando}>
          {enviando ? 'Salvando…' : rotuloBotao}
        </button>
      </div>
    </form>
  )
}
