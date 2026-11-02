import Field from '../../components/Field'
import { UFS } from '../../utils/validacao'

export default function LocalEvento({ f, erros, mudar }) {
  return (
    <>
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
    </>
  )
}
