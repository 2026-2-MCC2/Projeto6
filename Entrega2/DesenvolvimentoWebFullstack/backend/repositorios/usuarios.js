// SQL das contas (tabela usuario).
const pool = require('../config/bd');

async function criar({ nome, email, cpf, senhaHash, telefone, tipo }) {
  const [r] = await pool.query(
    'insert into usuario (nome, email, cpf, senha_hash, telefone, tipo) values (?, ?, ?, ?, ?, ?)',
    [nome, email, cpf, senhaHash, telefone, tipo],
  );
  return r.insertId;
}

// para o login: traz o hash da senha junto
async function buscarParaLogin(email) {
  const [linhas] = await pool.query(
    'select id_usuario, nome, email, senha_hash, foto_perfil, tipo from usuario where email = ?',
    [email],
  );
  return linhas[0] || null;
}

async function buscarPerfil(id) {
  const [linhas] = await pool.query(
    'select id_usuario, nome, email, cpf, telefone, foto_perfil, tipo, criado_em from usuario where id_usuario = ?',
    [id],
  );
  return linhas[0] || null;
}

async function atualizarPerfil(id, { nome, telefone, fotoPerfil }) {
  const [r] = await pool.query(
    'update usuario set nome = ?, telefone = ?, foto_perfil = ? where id_usuario = ?',
    [nome, telefone || null, fotoPerfil || null, id],
  );
  return r.affectedRows > 0;
}

module.exports = { criar, buscarParaLogin, buscarPerfil, atualizarPerfil };
