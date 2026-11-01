import Field from '../../components/Field'

export default function PublicoEvento({ f, erros, mudar }) {
  return (
    <>
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
    </>
  )
}
