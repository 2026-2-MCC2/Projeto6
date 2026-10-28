// Validacoes usadas no credenciamento.

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

const soDigitos = (valor) => String(valor || '').replace(/\D/g, '');

// CNPJ: 14 digitos e os 2 ultimos (digitos verificadores) batem com a conta
// oficial da Receita. Pega CNPJ inventado tipo 11.111.111/1111-11.
function cnpjValido(valor) {
  const cnpj = soDigitos(valor);
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

  const digito = (base) => {
    let soma = 0;
    let peso = base.length - 7; // comeca em 5 (12 digitos) ou 6 (13 digitos)
    for (const n of base) {
      soma += Number(n) * peso;
      peso = peso === 2 ? 9 : peso - 1;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const d1 = digito(cnpj.slice(0, 12));
  const d2 = digito(cnpj.slice(0, 12) + d1);
  return cnpj.endsWith(`${d1}${d2}`);
}

const ufValida = (valor) => UFS.includes(String(valor || '').trim().toUpperCase());

// fixo com DDD (10) ou celular com DDD (11)
const telefoneValido = (valor) => [10, 11].includes(soDigitos(valor).length);

const texto = (valor) => String(valor ?? '').trim();

module.exports = { cnpjValido, ufValida, telefoneValido, soDigitos, texto };
