export const profiles = {
  organizer: {
    label: 'Organizador',
    demoName: 'Lucas Almeida',
    company: 'Live Nation Brasil S.A.',
    tagline: 'Produtor de eventos',
    pitch: 'Gerencie lotes, autorize transferências oficiais e acompanhe a custódia em tempo real.',
    icon: 'ticket',
    theme: 'role-organizer',
    menu: [
      { id: 'home', label: 'Visão geral', icon: 'home' },
      { id: 'events', label: 'Meus eventos', icon: 'calendar' },
      { id: 'new', label: 'Adicionar evento', icon: 'plus' },
      { id: 'proposals', label: 'Propostas recebidas', icon: 'file' },
      { id: 'network', label: 'Fornecedores credenciados', icon: 'users' },
    ],
  },
  supplier: {
    label: 'Fornecedor',
    demoName: 'Prosegur Special Events',
    company: 'CNPJ 12.345.678/0001-90',
    tagline: 'Parceiro credenciado',
    pitch: 'Integre credenciamento, totens de autoatendimento e liquidação automatizada.',
    icon: 'briefcase',
    theme: 'role-supplier',
    menu: [
      { id: 'home', label: 'Visão geral', icon: 'home' },
      { id: 'requests', label: 'Solicitações', icon: 'file' },
      { id: 'contracts', label: 'Meus contratos', icon: 'calendar' },
      { id: 'homologation', label: 'Homologação', icon: 'shield' },
      { id: 'profile', label: 'Meu perfil', icon: 'user' },
    ],
  },
  admin: {
    label: 'Administrador',
    demoName: 'Marina Costa',
    company: 'Operação de custódia',
    tagline: 'Gestão central',
    pitch: 'Auditoria de transações, resolução de disputas e controle de custódia.',
    icon: 'shield',
    theme: 'role-admin',
    menu: [
      { id: 'home', label: 'Visão geral', icon: 'home' },
      { id: 'events', label: 'Eventos ativos', icon: 'calendar' },
      { id: 'income', label: 'Renda da plataforma', icon: 'wallet' },
      { id: 'requests', label: 'Requisições de cadastro', icon: 'check' },
      { id: 'reports', label: 'Denúncias', icon: 'flag' },
    ],
  },
}

export const roleOrder = ['organizer', 'supplier', 'admin']
