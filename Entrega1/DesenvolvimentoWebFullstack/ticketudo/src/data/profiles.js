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
    pitch: 'Cadastre seus serviços, peça credenciamento e aceite ou recuse os pedidos dos organizadores.',
    icon: 'briefcase',
    theme: 'role-supplier',
    menu: [
      { id: 'home', label: 'Visão geral', icon: 'home' },
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
      { id: 'events', label: 'Eventos para análise', icon: 'calendar' },
      { id: 'requests', label: 'Credenciamentos', icon: 'check' },
    ],
  },
}

// o administrador nao sai do cadastro aberto, entao a tela de login so
// oferece os dois papeis que a API aceita criar
export const roleOrder = ['organizer', 'supplier']
export const todosOsPapeis = ['organizer', 'supplier', 'admin']
