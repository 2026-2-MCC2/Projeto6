// Textos do credenciamento usados em mais de uma tela.

// areas em que o fornecedor atua (as mesmas que o backend aceita)
export const AREAS_FORNECEDOR = [
  { id: 'iluminacao', label: 'Iluminação' },
  { id: 'comida', label: 'Comida' },
  { id: 'bebida', label: 'Bebida' },
  { id: 'seguranca', label: 'Segurança' },
  { id: 'estrutura', label: 'Estrutura' },
  { id: 'outros', label: 'Outros' },
]

export function nomeDaArea(id) {
  return AREAS_FORNECEDOR.find((a) => a.id === id)?.label ?? id
}

export const DECLARACAO =
  'Declaro que as informações são verdadeiras e autorizo o uso desses dados para a análise do credenciamento.'
