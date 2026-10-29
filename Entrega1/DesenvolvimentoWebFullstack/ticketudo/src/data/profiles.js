export const profiles = {
  organizer: {
    label: 'Organizador',
    tagline: 'Produtor de eventos',
    pitch: 'Cadastre seus eventos, contrate fornecedores credenciados e acompanhe o custo antes de enviar para análise.',
    icon: 'ticket',
    theme: 'role-organizer',
    menu: [
      { id: 'home', label: 'Visão geral', icon: 'home' },
      { id: 'events', label: 'Meus eventos', icon: 'calendar' },
      { id: 'new', label: 'Adicionar evento', icon: 'plus' },
      { id: 'network', label: 'Fornecedores credenciados', icon: 'users' },
    ],
  },
  supplier: {
    label: 'Fornecedor',
    tagline: 'Parceiro credenciado',
    pitch: 'Peça credenciamento, veja os eventos em cotação e mande propostas para os itens que você atende.',
    icon: 'briefcase',
    theme: 'role-supplier',
    menu: [
      { id: 'home', label: 'Visão geral', icon: 'home' },
      { id: 'cotacoes', label: 'Eventos em cotação', icon: 'calendar' },
      { id: 'propostas', label: 'Minhas propostas', icon: 'wallet' },
      { id: 'requests', label: 'Solicitações', icon: 'file' },
      { id: 'profile', label: 'Meu perfil', icon: 'user' },
    ],
  },
  admin: {
    label: 'Administrador',
    tagline: 'Gestão central',
    pitch: 'Aprove credenciamentos e eventos, confira o custo com fornecedores e converse com os usuários.',
    icon: 'shield',
    theme: 'role-admin',
    menu: [
      { id: 'home', label: 'Visão geral', icon: 'home' },
      { id: 'events', label: 'Eventos', icon: 'calendar' },
      { id: 'requests', label: 'Credenciamentos', icon: 'check' },
      { id: 'relatorios', label: 'Relatórios', icon: 'trend' },
      { id: 'aprovacoes', label: 'Histórico de aprovações', icon: 'file' },
    ],
  },
}

// o administrador nao sai do cadastro aberto, entao a tela de login so
// oferece os dois papeis que a API aceita criar
export const roleOrder = ['organizer', 'supplier']
export const todosOsPapeis = ['organizer', 'supplier', 'admin']
