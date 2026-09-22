export const events = [
  {
    id: 'primavera-sound',
    name: 'Primavera Sound 2025',
    subtitle: 'Passaporte Oficial',
    day: '22',
    date: '22 nov 2025',
    venue: 'Autódromo de Interlagos',
    city: 'São Paulo, SP',
    category: 'Festival musical',
    capacity: 85000,
    revenue: 4298450,
    custody: 251600,
    sold: 87,
    status: 'Lote vigente',
    lot: 'Lote 2',
    cover: 'coral',
  },
  {
    id: 'rock-in-rio',
    name: 'Rock in Rio 2026',
    subtitle: 'Palco Mundo & VIP Lounge',
    day: '04',
    date: '04 set 2026',
    venue: 'Parque Olímpico',
    city: 'Rio de Janeiro, RJ',
    category: 'Festival musical',
    capacity: 100000,
    revenue: 3180000,
    custody: 160000,
    sold: 62,
    status: 'Lote vigente',
    lot: 'Lote 1 Regular',
    cover: 'navy',
  },
  {
    id: 'festival-inverno',
    name: 'Festival de Inverno 2025',
    subtitle: 'Campos do Jordão',
    day: '12',
    date: '12 jul 2025',
    venue: 'Auditório Claudio Santoro',
    city: 'Campos do Jordão, SP',
    category: 'Música instrumental',
    capacity: 14000,
    revenue: 1284600,
    custody: 85620,
    sold: 94,
    status: 'Lotes fechados',
    lot: 'Lote 3',
    cover: 'yellow',
  },
  {
    id: 'alok-tour',
    name: 'Alok Tour Exclusiva',
    subtitle: 'Experiência Imersiva',
    day: '28',
    date: '28 mar 2026',
    venue: 'Allianz Parque',
    city: 'São Paulo, SP',
    category: 'Show',
    capacity: 45000,
    revenue: 849750,
    custody: 56650,
    sold: 41,
    status: 'Lote vigente',
    lot: 'Lote 1 Regular',
    cover: 'coral',
  },
]

export const platformStats = {
  clients: 2846,
  suppliers: 384,
  organizers: 196,
  validated: 99.4,
  settlement: 'D+1',
}

export const incomeBreakdown = [
  {
    id: 'revenda',
    label: 'Taxação de revenda P2P',
    value: 1120400,
    note: 'Spread e comissão sobre transferências entre usuários, com retenção em custódia.',
  },
  {
    id: 'produtores',
    label: 'Repartição com produtores',
    value: 518250,
    note: 'Royalties da revenda direcionados automaticamente às produtoras dos eventos.',
  },
  {
    id: 'fornecedores',
    label: 'Fornecedores credenciados',
    value: 204000,
    note: 'Validação em borda, verificação de identidade e orquestração de pagamentos.',
  },
]

export const credentialRequests = [
  {
    id: 'req-8841',
    protocol: '#8841-BR',
    company: 'Vigilância & Eventos S.A.',
    kind: 'Fornecedor',
    specialty: 'Segurança privada',
    document: 'CNPJ 12.345.678/0001-90',
    owner: 'Marcos Tavares · Diretor de Operações',
    kyc: 'Aprovado',
    escrow: 'Banco Itaú Corp · Ag 0921 C/C 44920-1',
    forecast: '8 festivais (320.000 ingressos)',
    fee: '5,8% flat',
    submitted: 'há 3 h',
    status: 'Em análise',
  },
  {
    id: 'req-8842',
    protocol: '#8842-BR',
    company: 'Ana Lima Eventos',
    kind: 'Organizador',
    specialty: 'Festival musical',
    document: 'CNPJ 98.765.432/0001-11',
    owner: 'Ana Lima · Sócia-administradora',
    kyc: 'Pendente',
    escrow: 'Banco Bradesco · Ag 3377 C/C 10238-4',
    forecast: '3 eventos (48.000 ingressos)',
    fee: '5,2% flat',
    submitted: 'há 6 h',
    status: 'Em análise',
  },
  {
    id: 'req-8843',
    protocol: '#8843-BR',
    company: 'Gabisom Audio Equipment Ltda.',
    kind: 'Fornecedor',
    specialty: 'Sonorização e estrutura',
    document: 'CNPJ 54.912.441/0001-92',
    owner: 'Renato Gabi · Responsável técnico',
    kyc: 'Aprovado',
    escrow: 'Banco Santander · Ag 0142 C/C 77310-9',
    forecast: '12 eventos (210.000 ingressos)',
    fee: '4,9% flat',
    submitted: 'ontem',
    status: 'Em análise',
  },
]

export const reports = [
  {
    id: 'den-4417',
    subject: 'Revenda com comprovante falso via QR Code já validado',
    event: 'Primavera Sound 2025',
    opened: 'há 2 h',
    severity: 'Alta',
    detail:
      'O comprador alega que o token de transferência gerou colisão de validação no gateway. A assinatura do QR Code apresenta divergência de timestamp em relação à emissão original do lote. Os fundos seguem congelados em custódia.',
    status: 'Em análise',
  },
  {
    id: 'den-4418',
    subject: 'Ingresso transferido sem autorização após pagamento em custódia',
    event: 'Alok Tour Exclusiva',
    opened: 'ontem',
    severity: 'Alta',
    detail:
      'A compradora relata que o repasse foi executado por um aplicativo parceiro, mas a carteira de destino foi alterada por terceiro antes da confirmação. O repasse manual foi pausado pelo gatilho de divergência cadastral.',
    status: 'Em análise',
  },
  {
    id: 'den-4419',
    subject: 'Suspeita de spoofing de identidade em evento esgotado',
    event: 'Rock in Rio 2026',
    opened: '12 mai',
    severity: 'Média',
    detail:
      'O titular da conta reportou acesso não autorizado após receber códigos OTP não solicitados. O motor de risco bloqueou a emissão dos tokens por salto de geolocalização incompatível.',
    status: 'Resolvida',
  },
]

export const suppliers = [
  {
    id: 'prosegur',
    name: 'Prosegur Special Events',
    specialty: 'Segurança privada',
    city: 'São Paulo, SP',
    verified: true,
    cover: 'cover-ice',
    metrics: {
      publico: '120.000 pessoas',
      efetivo: '530 profissionais',
      seguro: 'R$ 10.000.000',
      incidentes: '0 em 24 meses',
      eventos: 84,
      conformidade: '98,6%',
    },
    credentials: [
      { label: 'Portaria Polícia Federal', detail: 'DREX/CGCSP · Nº 8.921/2024' },
      { label: 'Seguro de responsabilidade civil', detail: 'Porto Seguro · R$ 10.000.000' },
      { label: 'AVCB Bombeiros', detail: 'CBMESP · Nº CB-88492/SP' },
      { label: 'CND trabalhista e criminal', detail: 'TRT / Receita Federal unificada' },
    ],
    resources: [
      { label: 'Efetivo homologado', value: '450 vigilantes + 80 brigadistas certificados' },
      { label: 'Equipamentos', value: '320 rádios criptografados e 40 portais detectores' },
      { label: 'Suporte médico', value: '2 UTIs móveis tipo D com equipe de prontidão' },
    ],
  },
  {
    id: 'gabisom',
    name: 'Gabisom Audio Equipment',
    specialty: 'Sonorização e estrutura',
    city: 'São Paulo, SP',
    verified: true,
    cover: 'cover-sand',
    metrics: {
      publico: '85.000 pessoas',
      efetivo: '180 profissionais',
      seguro: 'R$ 4.000.000',
      incidentes: '1 em 24 meses',
      eventos: 62,
      conformidade: '96,2%',
    },
    credentials: [
      { label: 'ART de responsabilidade técnica', detail: 'CREA-SP · Nº 5061992' },
      { label: 'Seguro de responsabilidade civil', detail: 'Chubb · R$ 4.000.000' },
      { label: 'CND trabalhista', detail: 'TRT unificada' },
    ],
    resources: [
      { label: 'Line array', value: 'Cobertura homologada para arenas de até 85.000 pessoas' },
      { label: 'Energia', value: '4 geradores redundantes com transferência automática' },
      { label: 'Equipe técnica', value: '24 operadores com certificação de fabricante' },
    ],
  },
  {
    id: 'mesa-boa',
    name: 'Mesa Boa Food Service',
    specialty: 'Bar e alimentação',
    city: 'Campinas, SP',
    verified: false,
    cover: 'cover-gold',
    metrics: {
      publico: '30.000 pessoas',
      efetivo: '210 profissionais',
      seguro: 'R$ 1.500.000',
      incidentes: '2 em 24 meses',
      eventos: 38,
      conformidade: '91,4%',
    },
    credentials: [
      { label: 'Alvará sanitário', detail: 'Vigilância Sanitária · Nº VS-2291/SP' },
      { label: 'Emissão fiscal NFC-e', detail: '100% das transações com estorno automático' },
    ],
    resources: [
      { label: 'Pontos de venda', value: '48 totens de autoatendimento com recarga antecipada' },
      { label: 'Equipe', value: '210 atendentes treinados em atendimento de grande público' },
    ],
  },
]

export const serviceRequests = [
  {
    id: 'sol-2201',
    event: 'Ultra Music Festival SP 2026',
    organizer: 'Live Nation Brasil S.A.',
    scope: 'Segurança perimetral e revista',
    period: '18 a 22 de fevereiro de 2026',
    venue: 'Autódromo de Interlagos, São Paulo - SP',
    audience: '85.000 pessoas / dia',
    value: null,
    status: 'Em análise',
  },
  {
    id: 'sol-2202',
    event: 'Copa Brasil E-Sports Arena',
    organizer: 'Singularity Events Ltda',
    scope: 'Controle de acesso e credenciamento',
    period: '12 a 15 de março de 2026',
    venue: 'Ginásio do Ibirapuera, São Paulo - SP',
    audience: '14.000 pessoas / dia',
    value: null,
    status: 'Em análise',
  },
  {
    id: 'sol-2203',
    event: 'Final Supercopa Brasil 2026',
    organizer: 'Confederação Nac. Desportiva',
    scope: 'Brigada civil e suporte médico',
    period: '04 de abril de 2026',
    venue: 'Allianz Parque, São Paulo - SP',
    audience: '45.000 pessoas',
    value: 312000,
    status: 'Proposta enviada',
  },
]

export const proposals = [
  {
    id: 'prp-3301',
    supplier: 'Prosegur Special Events',
    supplierId: 'prosegur',
    specialty: 'Segurança privada',
    event: 'Primavera Sound 2025',
    scope: 'Segurança perimetral e revista',
    value: 480000,
    deadline: 'Mobilização em 18 nov 2025',
    status: 'Em análise',
  },
  {
    id: 'prp-3302',
    supplier: 'Gabisom Audio Equipment',
    supplierId: 'gabisom',
    specialty: 'Sonorização e estrutura',
    event: 'Primavera Sound 2025',
    scope: 'Line array e energia redundante',
    value: 286000,
    deadline: 'Montagem em 19 nov 2025',
    status: 'Em análise',
  },
  {
    id: 'prp-3303',
    supplier: 'Mesa Boa Food Service',
    supplierId: 'mesa-boa',
    specialty: 'Bar e alimentação',
    event: 'Alok Tour Exclusiva',
    scope: '48 pontos de venda com totens',
    value: 132000,
    deadline: 'Operação em 26 mar 2026',
    status: 'Aceita',
  },
]

export const contracts = [
  {
    id: 'ctr-5501',
    event: 'Ultra Music Festival SP 2026',
    organizer: 'Live Nation Brasil S.A.',
    scope: 'Segurança perimetral',
    value: 480000,
    custody: 'Retido em custódia',
    settlement: 'Liquidação D+1 após o evento',
    status: 'Ativo',
  },
  {
    id: 'ctr-5502',
    event: 'Turnê Coldplay · Arena BRB',
    organizer: 'T4F Entretenimento S.A.',
    scope: 'Controle de acesso',
    value: 260000,
    custody: 'Retido em custódia',
    settlement: 'Liquidação D+1 após o evento',
    status: 'Ativo',
  },
  {
    id: 'ctr-5503',
    event: 'Innovation Summit Latam 2026',
    organizer: 'Singularity Events Ltda',
    scope: 'Credenciamento e totens',
    value: 96000,
    custody: 'Liberado',
    settlement: 'Liquidado em 12 mai 2026',
    status: 'Concluído',
  },
]

export const homologationDocs = [
  { id: 'doc-contrato', label: 'Contrato social consolidado', status: 'Aprovado' },
  { id: 'doc-cnd', label: 'CND trabalhista e criminal', status: 'Aprovado' },
  { id: 'doc-seguro', label: 'Apólice de responsabilidade civil', status: 'Em análise' },
  { id: 'doc-avcb', label: 'AVCB do Corpo de Bombeiros', status: 'Em análise' },
  { id: 'doc-portaria', label: 'Portaria da Polícia Federal', status: 'Pendente' },
  { id: 'doc-tecnica', label: 'Responsabilidade técnica (ART)', status: 'Pendente' },
]

export const activity = [
  { id: 'atv-1', title: 'Fornecedor homologado', detail: 'Prosegur Special Events', icon: 'check', time: 'há 2 h' },
  { id: 'atv-2', title: 'Lote aberto', detail: 'Primavera Sound 2025 · Lote 2', icon: 'calendar', time: 'há 4 h' },
  { id: 'atv-3', title: 'Denúncia recebida', detail: 'Alok Tour Exclusiva', icon: 'alert', time: 'ontem' },
  { id: 'atv-4', title: 'Custódia liberada', detail: 'Innovation Summit Latam 2026', icon: 'wallet', time: 'ontem' },
]

export const conversation = {
  contact: { name: 'Lucas Almeida', role: 'Organizador · Live Nation Brasil', initials: 'LA' },
  messages: [
    { id: 'msg-1', text: 'Oi, tudo bem? Vi sua proposta para o Ultra Music Festival.', mine: false },
    { id: 'msg-2', text: 'Oi, Lucas! Tudo certo. Posso enviar o plano operacional ainda hoje.', mine: true },
  ],
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
