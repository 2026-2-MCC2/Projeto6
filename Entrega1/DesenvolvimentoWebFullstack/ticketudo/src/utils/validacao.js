// As mesmas regras do backend (backend/lib/validacao.js), para avisar o
// erro antes de enviar. Quem decide no fim e sempre a API.

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

export const soDigitos = (valor) => String(valor || '').replace(/\D/g, '')

// 14 digitos e os 2 ultimos batendo com a conta da Receita
export function cnpjValido(valor) {
  const cnpj = soDigitos(valor)
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false

  const digito = (base) => {
    let soma = 0
    let peso = base.length - 7
    for (const n of base) {
      soma += Number(n) * peso
      peso = peso === 2 ? 9 : peso - 1
    }
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }

  const d1 = digito(cnpj.slice(0, 12))
  const d2 = digito(cnpj.slice(0, 12) + d1)
  return cnpj.endsWith(`${d1}${d2}`)
}

export const telefoneValido = (valor) => [10, 11].includes(soDigitos(valor).length)
