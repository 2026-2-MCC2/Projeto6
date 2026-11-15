// SQL das categorias de evento e dos locais.
const pool = require('../config/bd');

async function listarCategorias() {
  const [linhas] = await pool.query('select * from categoria order by nome');
  return linhas;
}

async function criarCategoria(nome) {
  const [r] = await pool.query('insert into categoria (nome) values (?)', [nome]);
  return r.insertId;
}

async function listarLocais() {
  const [linhas] = await pool.query('select * from local_evento order by nome');
  return linhas;
}

async function criarLocal({ nome, cidade, estado, endereco }, conexao = pool) {
  const [r] = await conexao.query(
    'insert into local_evento (nome, cidade, estado, endereco) values (?, ?, ?, ?)',
    [nome, cidade, estado, endereco],
  );
  return r.insertId;
}

module.exports = { listarCategorias, criarCategoria, listarLocais, criarLocal };
