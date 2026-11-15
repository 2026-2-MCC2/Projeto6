// Transacao: varios comandos que entram juntos ou nenhum entra.
// Uso nas rotas:
//   const id = await emTransacao(async (conexao) => {
//     await eventosRepo.criar(dados, conexao);
//     ...
//   });
// Se a funcao der erro, desfaz tudo (rollback) e repassa o erro.
const pool = require('../config/bd');

async function emTransacao(fn) {
  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();
    const resultado = await fn(conexao);
    await conexao.commit();
    return resultado;
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
}

// o erro do banco e de valor repetido numa coluna unica (ex.: e-mail)?
const ehDuplicado = (erro) => erro?.code === pool.DUPLICADO;

module.exports = { emTransacao, ehDuplicado };
