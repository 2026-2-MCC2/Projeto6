// Regras do formulario de credenciamento (RF01 a RF03).
const { cnpjValido, ufValida, telefoneValido, soDigitos, texto } = require('./validacao');

// areas em que o fornecedor pode atuar (as mesmas dos itens de custo do evento)
const AREAS_FORNECEDOR = ['iluminacao', 'comida', 'bebida', 'seguranca', 'estrutura', 'outros'];

// Confere os campos. Devolve { erros, dados, categorias } com os dados ja limpos.
// contarCategorias(ids) diz quantas dessas categorias de evento existem no
// banco: vem de fora para esta regra nao depender do SQL.
async function validarCredenciamento(tipo, corpo, contarCategorias) {
  const erros = {};
  const obrigatorio = (campo, valor, msg) => {
    if (!valor) erros[campo] = msg;
    return valor;
  };

  const d = {
    cidade: obrigatorio('cidade', texto(corpo.cidade), 'informe a cidade'),
    estado: texto(corpo.estado).toUpperCase(),
    telefone: soDigitos(corpo.telefone),
    descricao: texto(corpo.descricao),
    link: texto(corpo.link) || null,
  };
  if (!ufValida(d.estado)) erros.estado = 'UF invalida (use a sigla, como SP)';
  if (!telefoneValido(d.telefone)) erros.telefone = 'telefone com DDD, so numeros (10 ou 11 digitos)';
  if (d.link && d.link.length > 200) erros.link = 'link muito longo (ate 200 caracteres)';

  const categorias = Array.isArray(corpo.categorias) ? [...new Set(corpo.categorias)] : [];

  if (tipo === 'fornecedor') {
    d.nome_empresa = obrigatorio('nome_empresa', texto(corpo.nome_empresa), 'informe o nome da empresa');
    d.razao_social = obrigatorio('razao_social', texto(corpo.razao_social), 'informe a razao social');
    d.cnpj = soDigitos(corpo.cnpj);
    if (!cnpjValido(d.cnpj)) erros.cnpj = 'CNPJ invalido';
    if (!d.descricao) erros.descricao = 'conte quais servicos voce oferece';
    if (!categorias.length || categorias.some((c) => !AREAS_FORNECEDOR.includes(c))) {
      erros.categorias = `escolha ao menos uma area: ${AREAS_FORNECEDOR.join(', ')}`;
    }
  } else {
    d.tipo_pessoa = corpo.tipo_pessoa;
    if (!['fisica', 'juridica'].includes(d.tipo_pessoa)) {
      erros.tipo_pessoa = 'escolha pessoa fisica ou juridica';
    }
    d.nome_organizacao = obrigatorio(
      'nome_organizacao', texto(corpo.nome_organizacao), 'informe o nome da produtora ou nome comercial');
    if (!d.descricao) erros.descricao = 'conte sua experiencia com eventos';

    if (d.tipo_pessoa === 'juridica') {
      d.razao_social = obrigatorio('razao_social', texto(corpo.razao_social), 'informe a razao social');
      d.cnpj = soDigitos(corpo.cnpj);
      if (!cnpjValido(d.cnpj)) erros.cnpj = 'CNPJ invalido';
    } else {
      // pessoa fisica usa o CPF da conta
      d.razao_social = null;
      d.cnpj = null;
    }

    d.publico_medio = corpo.publico_medio === undefined || corpo.publico_medio === '' || corpo.publico_medio === null
      ? null
      : Number(corpo.publico_medio);
    if (d.publico_medio !== null && !(Number.isInteger(d.publico_medio) && d.publico_medio > 0)) {
      erros.publico_medio = 'publico medio precisa ser um numero inteiro maior que zero';
    }

    const ids = categorias.map(Number);
    const existem = ids.length && ids.every(Number.isInteger) ? await contarCategorias(ids) : -1;
    if (!ids.length || existem !== ids.length) {
      erros.categorias = 'escolha ao menos um tipo de evento da lista';
    }
  }

  if (corpo.declaracao !== true) {
    erros.declaracao = 'confirme a declaracao para enviar';
  }

  return { erros, dados: d, categorias };
}

module.exports = { AREAS_FORNECEDOR, validarCredenciamento };
