import { useState } from 'react'
import Field from '../Field'
import { useApp } from '../../state/useApp'

const forms = {
  report: {
    intro: 'Relate uma situação para a equipe de disputas. Os fundos seguem retidos até a conclusão.',
    subject: { label: 'Assunto', placeholder: 'Ex: ingresso transferido sem autorização' },
    message: { label: 'Descrição', placeholder: 'Conte o que aconteceu, com datas e valores.' },
    submit: 'Enviar denúncia',
    toast: 'Denúncia registrada. O protocolo chega no seu e-mail.',
  },
  contact: {
    intro: 'Estamos por aqui para ajudar com o que precisar.',
    subject: { label: 'Assunto', placeholder: 'Tenho uma dúvida' },
    message: { label: 'Mensagem', placeholder: 'Como podemos ajudar?' },
    submit: 'Enviar mensagem →',
    toast: 'Mensagem enviada para o suporte.',
  },
}

export default function MessageForm({ type, onClose }) {
  const { dispatch } = useApp()
  const form = forms[type] ?? forms.contact
  const [values, setValues] = useState({ subject: '', message: '' })
  const [error, setError] = useState('')

  function submit(event) {
    event.preventDefault()

    if (values.subject.trim().length < 3) {
      setError('Descreva o assunto em poucas palavras.')
      return
    }

    dispatch({ type: 'toast/show', text: form.toast })
    onClose()
  }

  return (
    <form className="panel-form" onSubmit={submit} noValidate>
      <p>{form.intro}</p>
      <Field label={form.subject.label} error={error}>
        <input
          id="panel-subject"
          value={values.subject}
          onChange={(event) => setValues({ ...values, subject: event.target.value })}
          placeholder={form.subject.placeholder}
        />
      </Field>
      <Field label={form.message.label}>
        <textarea
          id="panel-message"
          rows="5"
          value={values.message}
          onChange={(event) => setValues({ ...values, message: event.target.value })}
          placeholder={form.message.placeholder}
        />
      </Field>
      <button type="submit" className="btn-primary">
        {form.submit}
      </button>
    </form>
  )
}
