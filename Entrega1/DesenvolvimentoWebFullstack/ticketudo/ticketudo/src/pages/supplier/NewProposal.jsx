import Field from '../../components/Field'
import PageHeading from '../../components/PageHeading'
import { events } from '../../data/platform'

export default function NewProposal({ profile, onNavigate }) {
  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Criar proposta"
        description="Envie uma proposta clara para o organizador."
      />
      <section className="form-card">
        <Field label="Evento">
          <select>
            {events.map((event) => (
              <option key={event.name}>{event.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Serviço oferecido">
          <input placeholder="Ex: Fotografia e vídeo" />
        </Field>

        <div className="field-row">
          <Field label="Valor">
            <input placeholder="R$ 0,00" />
          </Field>
          <Field label="Data de entrega">
            <input type="date" />
          </Field>
        </div>

        <Field label="Mensagem">
          <textarea rows="5" placeholder="Apresente seu escopo, prazo e diferenciais." />
        </Field>

        <button className="btn-primary" onClick={() => onNavigate('proposals')}>
          Enviar proposta →
        </button>
      </section>
    </>
  )
}
