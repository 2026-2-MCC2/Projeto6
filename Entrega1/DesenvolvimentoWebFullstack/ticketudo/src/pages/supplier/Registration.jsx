import Field from '../../components/Field'
import PageHeading from '../../components/PageHeading'

export default function Registration({ profile }) {
  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Cadastro de fornecedor"
        description="Crie seu perfil profissional para receber pedidos."
      />
      <section className="form-card">
        <div className="field-row">
          <Field label="Nome completo">
            <input placeholder="Seu nome" />
          </Field>
          <Field label="Nome da empresa">
            <input placeholder="Nome comercial" />
          </Field>
        </div>

        <div className="field-row">
          <Field label="CNPJ (caso tenha)">
            <input placeholder="00.000.000/0000-00" />
          </Field>
          <Field label="CPF">
            <input placeholder="000.000.000-00" />
          </Field>
        </div>

        <div className="field-row">
          <Field label="E-mail">
            <input type="email" placeholder="voce@empresa.com" />
          </Field>
          <Field label="Senha">
            <input type="password" placeholder="Crie uma senha" />
          </Field>
        </div>

        <Field label="Descrição dos serviços">
          <textarea rows="5" placeholder="Conte o que sua empresa oferece e seus diferenciais." />
        </Field>

        <button className="btn-primary">Criar cadastro →</button>
      </section>
    </>
  )
}
