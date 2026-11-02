// Textos FIXOS da página inicial (pages/Home.jsx).
// Não vêm do banco de dados nem da API: para mudar o que aparece na Home,
// edite este arquivo. Os dados dinâmicos do site são buscados na API.
//
// Regra desta página: cada frase precisa ser verdade sobre o que o sistema
// faz hoje. Se uma função ainda não existe no código, ela não entra aqui.

// os três destaques do topo (valor numérico anima no Contador; texto aparece como está)
export const destaques = [
  { id: 'perfis', rotulo: 'Perfis', valor: 3, texto: 'administrador, organizador e fornecedor' },
  { id: 'etapas', rotulo: 'Etapas', valor: 5, texto: 'do cadastro à aprovação do evento' },
  { id: 'cenarios', rotulo: 'Cenários', valor: 2, texto: 'de público no cálculo do ticket' },
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
    id: 'reg-cotacao',
    title: 'Só fornecedor aprovado vê as cotações',
    detail:
      'Os eventos em cotação e os itens para propor só aparecem para quem já passou pelo credenciamento.',
    icon: 'users',
  },
  {
    id: 'reg-proposta',
    title: 'Proposta por item, com validade',
    detail:
      'Cada fornecedor manda uma proposta por item, com valor e validade. Proposta vencida não pode ser escolhida.',
    icon: 'file',
  },
  {
    id: 'reg-ticket',
    title: 'Preço calculado com fórmula aberta',
    detail:
      'O ticket de equilíbrio e o ticket-alvo saem do orçamento, do público e da margem, e a fórmula aparece na tela.',
    icon: 'trend',
  },
]
