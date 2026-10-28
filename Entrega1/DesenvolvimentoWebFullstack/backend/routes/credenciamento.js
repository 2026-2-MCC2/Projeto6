// Credenciamento de organizadores e fornecedores (RF01 a RF03).
// A conta funciona logo depois do cadastro; com o credenciamento aprovado
// pelo adm, a pessoa passa a operar de verdade na plataforma.
const express = require('express');
const pool = require('../config/bd');
const { autenticar, permitir } = require('../middleware/auth');
const { cnpjValido, ufValida, telefoneValido, soDigitos, texto } = require('../lib/validacao');

const router = express.Router();

router.use(autenticar, permitir('organizador', 'fornecedor'));

// areas em que o fornecedor pode atuar (as mesmas dos itens de custo do evento)
const AREAS_FORNECEDOR = ['iluminacao', 'comida', 'bebida', 'seguranca', 'estrutura', 'outros'];

const PERFIL = {
  organizador: { tabela: 'organizador', id: 'id_organizador' },
  fornecedor: { tabela: 'fornecedor', id: 'id_fornecedor' },
};

async function buscarPerfil(usuario, conexao = pool) {
  const { tabela } = PERFIL[usuario.tipo];
  const [linhas] = await conexao.query(`select * from ${tabela} where id_usuario = ?`, [usuario.id]);
  return linhas[0] || null;
}

async function categoriasDe(tipo, linha) {
  if (tipo === 'organizador') {
    const [cats] = await pool.query(
      'select id_categoria from organizador_categoria where id_organizador = ? order by id_categoria',
      [linha.id_organizador],
    );
    return cats.map((c) => c.id_categoria);
  }
  const [areas] = await pool.query(
    'select categoria from fornecedor_atuacao where id_fornecedor = ? order by categoria',
    [linha.id_fornecedor],
  );
  return areas.map((a) => a.categoria);
}

// o que o pop-up precisa: situacao, dados ja enviados e motivo da recusa
router.get('/meu', async (req, res) => {
  const tipo = req.usuario.tipo;
  const linha = await buscarPerfil(req.usuario);
  if (!linha) {
    return res.json({ perfil: tipo, situacao: 'nao_solicitado', motivo_recusa: null, dados: null });
  }

  const { id } = PERFIL[tipo];
  const [pedidos] = await pool.query(
    `select status, observacao, solicitado_em, revisado_em from credenciamento
      where ${id} = ? order by id_credenciamento desc limit 1`,
    [linha[id]],
  );
  const ultimo = pedidos[0] || {};

  const dados = { ...linha, categorias: await categoriasDe(tipo, linha) };
  delete dados.id_usuario;
  delete dados.situacao;
  delete dados.criado_em;

  res.json({
    perfil: tipo,
    situacao: linha.situacao,
    motivo_recusa: linha.situacao === 'recusado' ? ultimo.observacao || null : null,
    enviado_em: ultimo.solicitado_em || null,
    revisado_em: ultimo.revisado_em || null,
    dados,
  });
});

// confere os campos. Devolve { erros, dados } com os dados ja limpos.
async function validar(tipo, corpo) {
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
    const [existem] = ids.length && ids.every(Number.isInteger)
      ? await pool.query('select count(*) as total from categoria where id_categoria in (?)', [ids])
      : [[{ total: -1 }]];
    if (!ids.length || existem[0].total !== ids.length) {
      erros.categorias = 'escolha ao menos um tipo de evento da lista';
    }
  }

  if (corpo.declaracao !== true) {
    erros.declaracao = 'confirme a declaracao para enviar';
  }

  return { erros, dados: d, categorias };
}

// envia (ou reenvia, depois de recusado) o credenciamento
router.post('/', async (req, res) => {
  const tipo = req.usuario.tipo;
  const { tabela, id } = PERFIL[tipo];

  const atual = await buscarPerfil(req.usuario);
  if (atual?.situacao === 'em_analise') {
    return res.status(409).json({ erro: 'seu credenciamento ja esta em analise' });
  }
  if (atual?.situacao === 'credenciado') {
    return res.status(409).json({ erro: 'sua conta ja esta credenciada' });
  }

  const { erros, dados, categorias } = await validar(tipo, req.body);
  if (Object.keys(erros).length) {
    return res.status(400).json({ erro: 'confira os campos destacados', campos: erros });
  }

  const colunas = Object.keys(dados);
  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();

    let idPerfil;
    if (atual) {
      await conexao.query(
        `update ${tabela} set ${colunas.map((c) => `${c} = ?`).join(', ')}, situacao = 'em_analise'
          where ${id} = ?`,
        [...Object.values(dados), atual[id]],
      );
      idPerfil = atual[id];
    } else {
      const [r] = await conexao.query(
        `insert into ${tabela} (id_usuario, ${colunas.join(', ')}, situacao)
         values (?, ${colunas.map(() => '?').join(', ')}, 'em_analise')`,
        [req.usuario.id, ...Object.values(dados)],
      );
      idPerfil = r.insertId;
    }

    // categorias: apaga as antigas e grava as novas
    if (tipo === 'organizador') {
      await conexao.query('delete from organizador_categoria where id_organizador = ?', [idPerfil]);
      await conexao.query('insert into organizador_categoria (id_organizador, id_categoria) values ?', [
        categorias.map((c) => [idPerfil, Number(c)]),
      ]);
    } else {
      await conexao.query('delete from fornecedor_atuacao where id_fornecedor = ?', [idPerfil]);
      await conexao.query('insert into fornecedor_atuacao (id_fornecedor, categoria) values ?', [
        categorias.map((c) => [idPerfil, c]),
      ]);
    }

    const [pedido] = await conexao.query(`insert into credenciamento (${id}) values (?)`, [idPerfil]);
    await conexao.commit();
    res.status(201).json({ id_credenciamento: pedido.insertId, situacao: 'em_analise' });
  } catch (e) {
    await conexao.rollback();
    if (e.code === pool.DUPLICADO) {
      return res.status(409).json({
        erro: 'ja existe um cadastro com esse CNPJ',
        campos: { cnpj: 'ja existe um cadastro com esse CNPJ' },
      });
    }
    throw e;
  } finally {
    conexao.release();
  }
});

module.exports = router;
