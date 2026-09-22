import {
  activity,
  contracts,
  credentialRequests,
  events,
  homologationDocs,
  proposals,
  reports,
  serviceRequests,
  suppliers,
  conversation,
} from '../data/platform'

export const initialState = {
  session: null,
  sequence: 1,
  events,
  suppliers,
  credentialRequests,
  reports,
  serviceRequests,
  proposals,
  contracts,
  homologationDocs,
  activity,
  messages: conversation.messages,
  toasts: [],
}

function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) return 'TT'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function nameFromEmail(email) {
  return email
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')
}

function record(state, { toast, entry }) {
  const id = state.sequence

  return {
    ...state,
    sequence: id + 1,
    toasts: toast ? [...state.toasts, { id: `toast-${id}`, text: toast }] : state.toasts,
    activity: entry
      ? [{ id: `atv-${id}`, time: 'agora', ...entry }, ...state.activity].slice(0, 8)
      : state.activity,
  }
}

export function reducer(state, action) {
  switch (action.type) {
    case 'session/sign-in': {
      const name = action.name?.trim() || nameFromEmail(action.email)

      return {
        ...state,
        session: {
          role: action.role,
          name,
          email: action.email,
          initials: initials(name),
        },
      }
    }

    case 'session/sign-out':
      return { ...state, session: null, toasts: [] }

    case 'session/update-profile': {
      const name = action.name.trim() || state.session.name

      return record(
        {
          ...state,
          session: { ...state.session, name, email: action.email, initials: initials(name) },
        },
        { toast: 'Perfil atualizado.' },
      )
    }

    case 'credential/decide': {
      const request = state.credentialRequests.find((item) => item.id === action.id)

      return record(
        {
          ...state,
          credentialRequests: state.credentialRequests.filter((item) => item.id !== action.id),
        },
        {
          toast: action.approved
            ? `${request.company} foi credenciada.`
            : `Cadastro de ${request.company} recusado.`,
          entry: {
            title: action.approved ? 'Cadastro aprovado' : 'Cadastro recusado',
            detail: request.company,
            icon: action.approved ? 'check' : 'alert',
          },
        },
      )
    }

    case 'report/resolve': {
      const report = state.reports.find((item) => item.id === action.id)

      return record(
        {
          ...state,
          reports: state.reports.map((item) =>
            item.id === action.id ? { ...item, status: 'Resolvida' } : item,
          ),
        },
        {
          toast: 'Denúncia marcada como resolvida.',
          entry: { title: 'Denúncia resolvida', detail: report.event, icon: 'check' },
        },
      )
    }

    case 'service-request/create': {
      const id = state.sequence
      const supplier = state.suppliers.find((item) => item.id === action.supplierId)

      return record(
        {
          ...state,
          serviceRequests: [
            {
              id: `sol-${id}`,
              event: action.event,
              organizer: action.organizer,
              scope: action.scope,
              period: action.period,
              venue: action.venue,
              audience: action.audience,
              value: null,
              supplierId: supplier.id,
              status: 'Em análise',
            },
            ...state.serviceRequests,
          ],
        },
        {
          toast: `Solicitação enviada para ${supplier.name}.`,
          entry: { title: 'Solicitação enviada', detail: supplier.name, icon: 'file' },
        },
      )
    }

    case 'service-request/decide': {
      const request = state.serviceRequests.find((item) => item.id === action.id)

      if (!action.accepted) {
        return record(
          {
            ...state,
            serviceRequests: state.serviceRequests.map((item) =>
              item.id === action.id ? { ...item, status: 'Recusada' } : item,
            ),
          },
          {
            toast: 'Solicitação recusada.',
            entry: { title: 'Solicitação recusada', detail: request.event, icon: 'alert' },
          },
        )
      }

      const id = state.sequence
      const supplierName = state.session?.name ?? 'Fornecedor credenciado'

      return record(
        {
          ...state,
          serviceRequests: state.serviceRequests.map((item) =>
            item.id === action.id ? { ...item, status: 'Proposta enviada', value: action.value } : item,
          ),
          proposals: [
            {
              id: `prp-${id}`,
              supplier: supplierName,
              supplierId: request.supplierId ?? 'prosegur',
              specialty: request.scope,
              event: request.event,
              scope: request.scope,
              value: action.value,
              deadline: request.period,
              status: 'Em análise',
            },
            ...state.proposals,
          ],
        },
        {
          toast: `Proposta enviada para ${request.organizer}.`,
          entry: { title: 'Proposta enviada', detail: request.event, icon: 'file' },
        },
      )
    }

    case 'proposal/decide': {
      const proposal = state.proposals.find((item) => item.id === action.id)

      if (!action.accepted) {
        return record(
          {
            ...state,
            proposals: state.proposals.map((item) =>
              item.id === action.id ? { ...item, status: 'Recusada' } : item,
            ),
          },
          {
            toast: `Proposta de ${proposal.supplier} recusada.`,
            entry: { title: 'Proposta recusada', detail: proposal.supplier, icon: 'alert' },
          },
        )
      }

      const id = state.sequence

      return record(
        {
          ...state,
          proposals: state.proposals.map((item) =>
            item.id === action.id ? { ...item, status: 'Aceita' } : item,
          ),
          contracts: [
            {
              id: `ctr-${id}`,
              event: proposal.event,
              organizer: state.session?.name ?? 'Organizador',
              scope: proposal.scope,
              value: proposal.value,
              custody: 'Retido em custódia',
              settlement: 'Liquidação D+1 após o evento',
              status: 'Ativo',
            },
            ...state.contracts,
          ],
        },
        {
          toast: `Contrato aberto com ${proposal.supplier}.`,
          entry: { title: 'Contrato aberto', detail: proposal.supplier, icon: 'check' },
        },
      )
    }

    case 'event/create': {
      const id = state.sequence
      const capacity = Number(action.capacity) || 0
      const price = Number(action.price) || 0

      return record(
        {
          ...state,
          events: [
            {
              id: `evt-${id}`,
              name: action.name,
              subtitle: action.category,
              day: action.date.slice(8, 10) || '01',
              date: action.date,
              venue: action.venue,
              city: action.city,
              category: action.category,
              capacity,
              revenue: capacity * price,
              custody: Math.round(capacity * price * 0.06),
              sold: 0,
              status: 'Lote vigente',
              lot: 'Lote 1 Regular',
              cover: 'navy',
            },
            ...state.events,
          ],
        },
        {
          toast: `${action.name} publicado.`,
          entry: { title: 'Evento publicado', detail: action.name, icon: 'calendar' },
        },
      )
    }

    case 'homologation/attach':
      return record(
        {
          ...state,
          homologationDocs: state.homologationDocs.map((doc) =>
            doc.id === action.id ? { ...doc, status: 'Em análise' } : doc,
          ),
        },
        { toast: 'Documento enviado para auditoria.' },
      )

    case 'message/send': {
      const id = state.sequence

      return {
        ...state,
        sequence: id + 1,
        messages: [...state.messages, { id: `msg-${id}`, text: action.text, mine: true }],
      }
    }

    case 'toast/show':
      return record(state, { toast: action.text })

    case 'toast/dismiss':
      return { ...state, toasts: state.toasts.filter((toast) => toast.id !== action.id) }

    default:
      return state
  }
}
