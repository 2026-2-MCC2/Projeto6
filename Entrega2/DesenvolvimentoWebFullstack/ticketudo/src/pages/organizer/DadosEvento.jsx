import Field from '../../components/Field'

export default function DadosEvento({ f, erros, categorias, mudar, erroGeral }) {
  return (
    <>
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
    </>
  )
}
