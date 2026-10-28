// Textos FIXOS da página inicial (pages/Home.jsx).
// Não vêm do banco de dados nem da API: para mudar o que aparece na Home,
// edite este arquivo. Os dados dinâmicos do site são buscados na API.
//
// Regra desta página: cada frase precisa ser verdade sobre o que o sistema
// faz hoje. Se uma função ainda não existe no código, ela não entra aqui.

// os três destaques do topo (valor numérico anima no Contador; texto aparece como está)
export const destaques = [
  { id: 'perfis', rotulo: 'Perfis', valor: 3, texto: 'administrador, organizador e fornecedor' },
  { id: 'etapas', rotulo: 'Etapas', valor: 4, texto: 'do cadastro à revisão do evento' },
  { id: 'negociacao', rotulo: 'Negociação', valor: 'Chat', texto: 'entre organizador e fornecedor' },
]

export const testimonials = [
  {
    id: 'dep-1',
    quote:
      'Consegui meu ingresso de pista no dia anterior ao show. O dinheiro só saiu da custódia depois que eu entrei na catraca. Nunca mais compro por rede social.',
    author: 'Marina R.',
    detail: 'Comprou para o Primavera Sound 2025',
  },
  {
    id: 'dep-2',
    quote:
      'Tive um imprevisto e precisei repassar meu par de ingressos pelo valor original. A renomeação foi imediata e o Pix caiu duas horas depois do início da apresentação.',
    author: 'Thiago M.',
    detail: 'Revendeu para a Alok Tour Exclusiva',
  },
]

// as quatro regras da plataforma (cada uma confere com uma rota do backend)
export const guarantees = [
  {
    id: 'reg-cadastro',
    title: 'Cadastro aprovado por um administrador',
    detail:
      'Organizadores e fornecedores enviam o credenciamento, e o administrador aprova ou recusa. A recusa sempre vem com o motivo.',
    icon: 'check',
  },
  {
    id: 'reg-fornecedor',
    title: 'Só fornecedor aprovado aparece',
    detail:
      'A lista de fornecedores e de serviços que o organizador vê é só de quem já passou pelo credenciamento.',
    icon: 'users',
  },
  {
    id: 'reg-retido',
    title: 'Pedido retido até a aprovação',
    detail:
      'Se o organizador ainda não foi aprovado, o pedido de serviço fica guardado e o fornecedor só o vê depois da aprovação.',
    icon: 'shield',
  },
  {
    id: 'reg-revisao',
    title: 'Evento liberado só depois da revisão',
    detail:
      'O administrador confere o custo com fornecedores e aprova ou recusa o evento, informando o motivo.',
    icon: 'calendar',
  },
]
