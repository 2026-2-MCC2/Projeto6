// Textos FIXOS da página inicial (pages/Home.jsx).
// Não vêm do banco de dados nem da API: para mudar o que aparece na Home,
// edite este arquivo. Os dados dinâmicos do site são buscados na API.
//
// Regra desta página: cada frase precisa ser verdade sobre o que o sistema
// faz hoje. Se uma função ainda não existe no código, ela não entra aqui.

// as quatro regras da plataforma (cada uma confere com uma rota do backend).
// O carimbo é o selo que aparece em cima de cada regra.
export const guarantees = [
  {
    id: 'reg-cadastro',
    title: 'Cadastro aprovado por um administrador',
    detail:
      'Organizadores e fornecedores enviam o credenciamento, e o administrador aprova ou recusa. A recusa sempre vem com o motivo.',
    carimbo: 'Aprovado',
  },
  {
    id: 'reg-cotacao',
    title: 'Só fornecedor aprovado vê as cotações',
    detail:
      'Os eventos em cotação e os itens para propor só aparecem para quem já passou pelo credenciamento.',
    carimbo: 'Só credenciado',
  },
  {
    id: 'reg-proposta',
    title: 'Proposta por item, com validade',
    detail:
      'Cada fornecedor manda uma proposta por item, com valor e validade. Proposta vencida não pode ser escolhida.',
    carimbo: 'Com validade',
  },
  {
    id: 'reg-ticket',
    title: 'Preço calculado na sua frente',
    detail:
      'O ticket de equilíbrio e o ticket-alvo saem do orçamento, do público e da margem, e a fórmula aparece na tela.',
    carimbo: 'Fórmula aberta',
  },
]

// texto do letreiro: corre na pagina inicial e nas telas de carregamento
export const letreiro = 'planeje · cote · compare · precifique · aprove ·'
