export const profiles = {
  admin: {
    label: 'Administrador',
    name: 'Marina Costa',
    initials: 'MC',
    tagline: 'Gestão central',
    menu: [
      { id: 'home', label: 'Visão geral', icon: 'home' },
      { id: 'events', label: 'Eventos ativos', icon: 'calendar' },
      { id: 'income', label: 'Renda da plataforma', icon: 'wallet' },
      { id: 'reports', label: 'Denúncias', icon: 'flag' },
      { id: 'approvals', label: 'Aprovações', icon: 'check', badge: 8 },
    ],
  },
  supplier: {
    label: 'Fornecedor',
    name: 'Estúdio Aurora',
    initials: 'EA',
    tagline: 'Parceiro verificado',
    menu: [
      { id: 'home', label: 'Visão geral', icon: 'home' },
      { id: 'register', label: 'Cadastro', icon: 'edit' },
      { id: 'events', label: 'Meus eventos', icon: 'calendar' },
      { id: 'proposals', label: 'Minhas propostas', icon: 'file' },
      { id: 'profile', label: 'Meu perfil', icon: 'user' },
    ],
  },
  organizer: {
    label: 'Organizador',
    name: 'Lucas Almeida',
    initials: 'LA',
    tagline: 'Produtor de eventos',
    menu: [
      { id: 'home', label: 'Visão geral', icon: 'home' },
      { id: 'events', label: 'Meus eventos', icon: 'calendar' },
      { id: 'new', label: 'Criar evento', icon: 'plus' },
      { id: 'proposals', label: 'Propostas recebidas', icon: 'file' },
      { id: 'network', label: 'Fornecedores', icon: 'users' },
    ],
  },
}
