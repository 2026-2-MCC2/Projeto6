// Teste de conexao com o banco (rota /api/health).
const pool = require('../config/bd');

async function bancoResponde() {
  await pool.query('select 1');
  return true;
}

module.exports = { bancoResponde };
