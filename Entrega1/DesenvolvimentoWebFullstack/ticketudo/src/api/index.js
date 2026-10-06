import { get, post, del } from './client'

export const auth = {
  cadastro: (dados) => post('/auth/cadastro', dados),
  login: (email, senha) => post('/auth/login', { email, senha }),
  eu: () => get('/auth/eu'),
}

export const catalogo = {
  categorias: () => get('/categorias'),
  locais: () => get('/locais'),
  criarLocal: (dados) => post('/locais', dados),
}

export const eventos = {
  publicos: () => get('/eventos'),
  meus: () => get('/eventos/meus'),
  detalhe: (id) => get(`/eventos/${id}`),
  criar: (dados) => post('/eventos', dados),
  criarLote: (id, dados) => post(`/eventos/${id}/lotes`, dados),
  criarFornecedorExterno: (id, dados) => post(`/eventos/${id}/fornecedores-externos`, dados),
  solicitarServico: (id, dados) => post(`/eventos/${id}/solicitacoes`, dados),
  enviarAnalise: (id) => post(`/eventos/${id}/enviar-analise`, {}),
}

export const fornecedores = {
  vitrine: () => get('/fornecedores'),
  servicosDe: (id) => get(`/fornecedores/${id}/servicos`),
  meuPerfil: () => get('/fornecedores/perfil'),
  criarPerfil: (dados) => post('/fornecedores/perfil', dados),
  meusServicos: () => get('/fornecedores/meus-servicos'),
  criarServico: (dados) => post('/fornecedores/servicos', dados),
  pedirCredenciamento: () => post('/fornecedores/credenciamento', {}),
}

export const solicitacoes = {
  minhas: () => get('/solicitacoes'),
  aceitar: (id) => post(`/solicitacoes/${id}/aceitar`, {}),
  recusar: (id) => post(`/solicitacoes/${id}/recusar`, {}),
}

export const ingressos = {
  meus: () => get('/ingressos/meus'),
  revendaDoEvento: (id) => get(`/ingressos/revenda/${id}`),
  anunciar: (id, preco) => post(`/ingressos/${id}/anunciar`, { preco }),
  cancelarAnuncio: (id) => del(`/ingressos/${id}/anuncio`),
}

export const pedidos = {
  comprar: (dados) => post('/pedidos', dados),
  comprarRevenda: (dados) => post('/pedidos/revenda', dados),
  meus: () => get('/pedidos/meus'),
}

export const chats = {
  lista: () => get('/chats'),
  usuarios: (busca = '') => get(`/chats/usuarios?busca=${encodeURIComponent(busca)}`),
  abrir: (dados) => post('/chats', dados),
  mensagens: (id) => get(`/chats/${id}/mensagens`),
  enviar: (id, texto) => post(`/chats/${id}/mensagens`, { texto }),
}

export const admin = {
  eventos: (status = 'em_analise') => get(`/admin/eventos?status=${status}`),
  aprovarEvento: (id) => post(`/admin/eventos/${id}/aprovar`, {}),
  recusarEvento: (id, motivo) => post(`/admin/eventos/${id}/recusar`, { motivo }),
  credenciamentos: (status = 'em_analise') => get(`/admin/credenciamentos?status=${status}`),
  aprovarCredenciamento: (id) => post(`/admin/credenciamentos/${id}/aprovar`, {}),
  recusarCredenciamento: (id, observacao) =>
    post(`/admin/credenciamentos/${id}/recusar`, { observacao }),
}
