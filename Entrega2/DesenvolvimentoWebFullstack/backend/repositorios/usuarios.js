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

async function criarCodigoRedefinicao({ idUsuario, codigoHash, expiraEm }) {
  await pool.query(
    'insert into password_reset_code (id_usuario, codigo_hash, expira_em) values (?, ?, ?)',
    [idUsuario, codigoHash, expiraEm],
  );
}

async function buscarCodigoRedefinicao(email) {
  const [linhas] = await pool.query(
    `select r.id_codigo, r.id_usuario, r.codigo_hash, r.expira_em, r.tentativas,
            u.email
       from password_reset_code r
       join usuario u on u.id_usuario = r.id_usuario
      where u.email = ? and r.usado_em is null
      order by r.criado_em desc
      limit 1`,
    [email],
  );
  return linhas[0] || null;
}

async function marcarCodigoUsado(idCodigo) {
  await pool.query('update password_reset_code set usado_em = current_timestamp where id_codigo = ?', [idCodigo]);
}

async function aumentarTentativasCodigo(idCodigo) {
  await pool.query('update password_reset_code set tentativas = tentativas + 1 where id_codigo = ?', [idCodigo]);
}

async function atualizarSenha(idUsuario, senhaHash) {
  await pool.query('update usuario set senha_hash = ? where id_usuario = ?', [senhaHash, idUsuario]);
}

module.exports = {
  criar,
  buscarParaLogin,
  buscarPerfil,
  atualizarPerfil,
  criarCodigoRedefinicao,
  buscarCodigoRedefinicao,
  marcarCodigoUsado,
  aumentarTentativasCodigo,
  atualizarSenha,
};
