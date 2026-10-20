// O estado global guarda so o que e realmente global: quem esta logado e os
// avisos de canto de tela. Os dados de cada pagina vem da API, pela
// useRecurso, pra nao ter duas versoes da verdade.

export const initialState = {
  sessao: null,
  carregandoSessao: true,
  toasts: [],
  sequencia: 0,
}

export function iniciais(nome) {
  return (nome || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase()
}

// o backend fala organizador/fornecedor/adm, o front sempre falou
// organizer/supplier/admin. a traducao mora aqui.
const PAPEL_POR_TIPO = {
  organizador: 'organizer',
  fornecedor: 'supplier',
  adm: 'admin',
  comprador: 'comprador',
}

export const TIPO_POR_PAPEL = {
  organizer: 'organizador',
  supplier: 'fornecedor',
  admin: 'adm',
  comprador: 'comprador',
}

function montarSessao(usuario) {
  if (!usuario) return null

  const nome = usuario.nome || usuario.email
  return {
    id: usuario.id_usuario ?? usuario.id,
    nome,
    email: usuario.email,
    tipo: usuario.tipo,
    papel: PAPEL_POR_TIPO[usuario.tipo] || 'comprador',
    iniciais: iniciais(nome),
  }
}

function comAviso(state, texto) {
  const id = state.sequencia + 1
  return {
    ...state,
    sequencia: id,
    toasts: [...state.toasts, { id, texto }],
  }
}

export function reducer(state, action) {
  switch (action.type) {
    case 'sessao/restaurada':
      return { ...state, sessao: montarSessao(action.usuario), carregandoSessao: false }

    case 'sessao/entrou':
      return comAviso(
        { ...state, sessao: montarSessao(action.usuario), carregandoSessao: false },
        action.aviso || `Bem-vindo, ${action.usuario.nome || action.usuario.email}.`,
      )

    case 'sessao/saiu':
      return { ...initialState, carregandoSessao: false }

    case 'aviso':
      return comAviso(state, action.texto)

    case 'aviso/fechar':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) }

    default:
      return state
  }
}
