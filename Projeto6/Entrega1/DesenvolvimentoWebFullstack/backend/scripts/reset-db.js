// Apaga e recria o banco inteiro: roda o trocaticket.sql e depois o seed.sql.
// Uso: npm run db:reset
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bd = require('../config/bd');

const pasta = path.join(__dirname, '..', '..', '..', 'tabelas_bd');
const arquivos = ['trocaticket.sql', 'seed.sql'];

async function main() {
  const cliente = await bd.conectar();
  try {
    await cliente.query('begin');
    for (const nome of arquivos) {
      console.log(`rodando ${nome}...`);
      await cliente.query(fs.readFileSync(path.join(pasta, nome), 'utf8'));
    }
    await cliente.query('commit');
    console.log('banco pronto. login do adm: admin@trocaticket.com.br / admin123');
  } catch (e) {
    await cliente.query('rollback');
    throw e;
  } finally {
    cliente.release();
    await bd.end();
  }
}

main().catch((e) => {
  // erro de conexao as vezes vem sem mensagem, so com codigo
  const erros = e.errors || [e];
  console.error('falhou:');
  for (const erro of erros) {
    console.error(' ', erro.code || '', erro.message || String(erro));
  }
  process.exit(1);
});
