// Cria (ou recria) os dados de demonstracao: tabelas_bd/seed_demo.sql.
// Uso: npm run db:demo   (com o npm run dev parado; depois do npm run db:reset)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bd = require('../config/bd');

async function main() {
  const arquivo = path.join(__dirname, '..', '..', '..', 'tabelas_bd', 'seed_demo.sql');
  const cliente = await bd.conectar();
  try {
    await cliente.query(fs.readFileSync(arquivo, 'utf8'));
    console.log('demonstracao pronta. Contas (senha demo1234):');
    console.log('  organizador.demo@demo.trocaticket.com.br');
    console.log('  som.demo@demo.trocaticket.com.br');
    console.log('  palco.demo@demo.trocaticket.com.br');
  } finally {
    cliente.release();
    await bd.end();
  }
}

main().catch((e) => {
  console.error('nao deu para criar a demonstracao:', e.message || e.code || e);
  process.exit(1);
});
