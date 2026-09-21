import Field from '../../components/Field'
import PageHeading from '../../components/PageHeading'

export default function NewEvent({ profile, onNavigate }) {
  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Vamos criar algo memorável."
        description="Conte o essencial agora. Você poderá completar depois."
      />
      <section className="form-card">
        <h3>01 - Sobre o evento</h3>

        <div className="field-row">
          <Field label="Nome do evento">
            <input placeholder="Ex: Festival Brisa 2025" />
          </Field>
          <Field label="Data">
            <input type="date" />
          </Field>
        </div>

        <Field label="Endereço">
          <input placeholder="Rua, número, cidade e estado" />
        </Field>

        <Field label="Você precisa de fornecedor?">
          <select>
            <option>Sim, quero encontrar fornecedores</option>
            <option>Não, já tenho minha equipe</option>
          </select>
        </Field>

        <Field label="O que você precisa?">
          <input placeholder="Ex: fotografia, som, bar e alimentação" />
        </Field>

        <div className="field-row">
          <Field label="Quantidade de ingressos">
            <input type="number" placeholder="1.000" />
          </Field>
          <Field label="Quantidade de lotes">
            <input type="number" placeholder="3" />
          </Field>
        </div>

        <Field label="Valor médio do ingresso">
          <input placeholder="R$ 0,00" />
        </Field>

        <div className="banner banner-mint">
          <div>
            <small className="eyebrow">Previsão financeira</small>
            <h3>Ganho provável: R$ 42.000</h3>
            <p>Estimativa baseada em ingressos, lotes e valor informado.</p>
          </div>
        </div>

        <button className="btn-primary" onClick={() => onNavigate('home')}>
          Publicar evento →
        </button>
      </section>
    </>
  )
}
