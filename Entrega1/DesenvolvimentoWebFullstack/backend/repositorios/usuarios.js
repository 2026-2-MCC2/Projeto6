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
    'select id_usuario, nome, email, senha_hash, tipo from usuario where email = ?',
    [email],
  );
  return linhas[0] || null;
}

async function buscarPerfil(id) {
  const [linhas] = await pool.query(
    'select id_usuario, nome, email, cpf, telefone, tipo, criado_em from usuario where id_usuario = ?',
    [id],
  );
  return linhas[0] || null;
}

module.exports = { criar, buscarParaLogin, buscarPerfil };
