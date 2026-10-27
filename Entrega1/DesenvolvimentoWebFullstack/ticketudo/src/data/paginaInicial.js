// Textos e números FIXOS da página inicial (pages/Home.jsx).
// Não vêm do banco de dados nem da API: para mudar o que aparece na Home,
// edite este arquivo. Os dados dinâmicos do site são buscados na API.

export const platformStats = {
  clients: 2846,
  suppliers: 384,
  organizers: 196,
  validated: 99.4,
  settlement: 'D+1',
}

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

export const guarantees = [
  {
    id: 'gar-qr',
    title: 'QR Code antigo invalidado',
    detail: 'A transferência revoga o código do vendedor no mesmo instante em que emite o do comprador.',
    icon: 'check',
  },
  {
    id: 'gar-custodia',
    title: 'Custódia em padrão bancário',
    detail: 'O valor fica retido em conta garantida e só é liberado depois da entrada confirmada.',
    icon: 'wallet',
  },
  {
    id: 'gar-liquidacao',
    title: 'Liquidação em D+1',
    detail: 'O repasse ao vendedor acontece no dia seguinte à confirmação, sem intermediário manual.',
    icon: 'trend',
  },
  {
    id: 'gar-bots',
    title: 'Bloqueio de bots e verificação de CPF',
    detail: 'Cada conta passa por checagem biométrica antes de anunciar ou comprar em evento esgotado.',
    icon: 'shield',
  },
]
