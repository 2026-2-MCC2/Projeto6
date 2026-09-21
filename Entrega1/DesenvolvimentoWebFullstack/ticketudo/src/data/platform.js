export const events = [
  {
    name: 'Festival Brisa',
    day: '18',
    date: '18 mai 2025',
    city: 'São Paulo, SP',
    revenue: 24800,
    status: 'Em alta',
    cover: 'coral',
    suppliers: 3,
    progress: 72,
  },
  {
    name: 'Conecta Summit',
    day: '02',
    date: '02 jun 2025',
    city: 'Recife, PE',
    revenue: 18400,
    status: 'Publicado',
    cover: 'navy',
    suppliers: 3,
    progress: 42,
  },
  {
    name: 'Feira Criativa',
    day: '21',
    date: '21 jun 2025',
    city: 'Curitiba, PR',
    revenue: 12600,
    status: 'Publicado',
    cover: 'yellow',
    suppliers: 2,
    progress: 30,
  },
]

export const platformAccounts = [
  { label: 'Clientes', total: '2.846', trend: '+8,2%' },
  { label: 'Fornecedores', total: '384', trend: '+12,4%' },
  { label: 'Organizadores', total: '196', trend: '+6,8%' },
]

export const incomeSummary = [
  { label: 'Receita acumulada', value: 'R$ 18.420', trend: '+14,6%', note: 'este mês' },
  { label: 'Movimentado pelos eventos', value: 'R$ 1,84 mi', note: '128 eventos ativos' },
  { label: 'Lucro de 1%', value: 'R$ 18.420', note: 'previsão mensal', icon: 'wallet' },
]

export const reports = [
  { subject: 'Descrição enganosa no evento', origin: 'Festival Brisa · há 2 horas', status: 'Em análise' },
  { subject: 'Fornecedor não entregou o combinado', origin: 'Noite do Jazz · ontem', status: 'Em análise' },
  { subject: 'Comportamento inadequado', origin: 'Conecta Summit · 12 mai', status: 'Resolvida' },
]

export const pendingAccounts = [
  { name: 'Casa Sonora', detail: 'Fornecedor · CNPJ 12.345.678/0001-90' },
  { name: 'Ana Lima Eventos', detail: 'Organizador · CPF 123.456.789-00' },
  { name: 'Cenário Vivo', detail: 'Fornecedor · CNPJ 98.765.432/0001-11' },
]

export const receivedProposals = [
  { supplier: 'Estúdio Aurora', service: 'Fotografia e vídeo', value: 'R$ 4.500', status: 'Em análise' },
  { supplier: 'Som & Luz Co.', service: 'Sonorização', value: 'R$ 2.800', status: 'Em análise' },
  { supplier: 'Mesa Boa', service: 'Bar e alimentação', value: 'R$ 6.200', status: 'Aceita' },
]

export const sentProposals = [
  { event: 'Festival Brisa', service: 'Fotografia e vídeo', deadline: 'Entrega: 18 mai 2025', status: 'Em análise' },
  { event: 'Conecta Summit', service: 'Sonorização', deadline: 'Entrega: 02 jun 2025', status: 'Aceita' },
  { event: 'Feira Criativa', service: 'Estrutura', deadline: 'Entrega: 21 jun 2025', status: 'Rascunho' },
]

export const deliveries = [
  { event: 'Festival Brisa', service: 'Fotografia e vídeo', deadline: 'Entrega em 18 mai 2025' },
  { event: 'Conecta Summit', service: 'Sonorização', deadline: 'Entrega em 02 jun 2025' },
]

export const partners = [
  { name: 'Estúdio Aurora', cover: 'cover-sand' },
  { name: 'Som & Luz Co.', cover: 'cover-ice' },
  { name: 'Mesa Boa', cover: 'cover-gold' },
]

export const recentActivity = [
  { title: 'Novo fornecedor aprovado', detail: 'Estúdio Aurora', icon: 'check' },
  { title: 'Novo evento publicado', detail: 'Festival Brisa', icon: 'calendar' },
  { title: 'Denúncia recebida', detail: 'Conecta Summit', icon: 'alert' },
  { title: 'Novo organizador', detail: 'Lucas Almeida', icon: 'plus' },
]

export const conversation = {
  contact: { name: 'Lucas Almeida', status: 'Online agora', initials: 'LA' },
  messages: [
    { text: 'Oi, tudo bem? Vi sua proposta para o Festival Brisa.', mine: false },
    { text: 'Oi, Lucas! Tudo certo. Posso te enviar o portfólio ainda hoje.', mine: true },
  ],
}
