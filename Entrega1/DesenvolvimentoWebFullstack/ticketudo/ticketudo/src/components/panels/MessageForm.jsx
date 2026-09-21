import Field from '../Field'

const forms = {
  report: {
    intro: 'Relate uma situação para nossa equipe analisar.',
    subject: { label: 'Assunto', placeholder: 'Ex: problema com fornecedor' },
    message: { label: 'Mensagem', placeholder: 'Descreva o que aconteceu.' },
    submit: 'Enviar denúncia',
  },
  'add-contact': {
    intro: 'Adicione uma pessoa para iniciar uma conversa.',
    subject: { label: 'Nome ou e-mail', placeholder: 'Busque pelo nome ou e-mail' },
    message: { label: 'Mensagem inicial', placeholder: 'Olá, podemos conversar?' },
    submit: 'Adicionar contato',
  },
  contact: {
    intro: 'Estamos por aqui para ajudar com o que precisar.',
    subject: { label: 'Assunto', placeholder: 'Tenho uma dúvida' },
    message: { label: 'Mensagem', placeholder: 'Como podemos ajudar?' },
    submit: 'Enviar mensagem →',
  },
}

export default function MessageForm({ type, onClose }) {
  const form = forms[type] ?? forms.contact

  return (
    <div className="panel-form">
      <p>{form.intro}</p>
      <Field label={form.subject.label}>
        <input placeholder={form.subject.placeholder} />
      </Field>
      <Field label={form.message.label}>
        <textarea rows="5" placeholder={form.message.placeholder} />
      </Field>
      <button className="btn-primary" onClick={onClose}>
        {form.submit}
      </button>
    </div>
  )
}
