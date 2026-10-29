// O app Express em si, sem o listen. Quem sobe o servidor e o server.js
// (no computador) ou a funcao da Vercel (api/index.js na raiz do repo).
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// O segredo que assina os logins (JWT) nunca fica escrito no codigo.
// - Na Vercel ele e obrigatorio e vem das Environment Variables.
// - No computador, sem .env, e sorteado na primeira vez e guardado em
//   backend/.banco-local (pasta que nao vai pro Git). Assim cada maquina tem
//   o seu e o login nao cai toda vez que o nodemon reinicia o servidor.
if (!process.env.JWT_SECRET) {
  if (process.env.VERCEL) {
    throw new Error('JWT_SECRET nao configurado na Vercel (Settings > Environment Variables).');
  }
  process.env.JWT_SECRET = segredoLocal();
}

function segredoLocal() {
  const fs = require('fs');
  const path = require('path');
  const crypto = require('crypto');
  const pasta = path.join(__dirname, '.banco-local');
  const arquivo = path.join(pasta, 'jwt-segredo');

  try {
    return fs.readFileSync(arquivo, 'utf8').trim();
  } catch {
    const segredo = crypto.randomBytes(32).toString('hex');
    fs.mkdirSync(pasta, { recursive: true });
    fs.writeFileSync(arquivo, segredo);
    return segredo;
  }
}

const pool = require('./config/bd'); // pool seria para nos utilizarmos o banco sem ter que ficar chamando ele toda hora

const app = express();

// O site chama a API pelo mesmo endereco (/api), entao CORS so e preciso
// se alguem hospedar o front em outro dominio.
if (process.env.CORS_ORIGIN) {
  app.use(cors({ origin: process.env.CORS_ORIGIN }));
}
app.use(express.json());

const api = express.Router();

api.get('/', (req, res) => {
  res.send('Olá do backend da ticketudo,welcome kkk!'); //teste simples
});

api.get('/health', async (req, res) => { //teste conexão com o banco
  await pool.query('select 1');
  res.json({ ok: true });
});

api.use('/auth', require('./routes/auth'));
api.use('/', require('./routes/catalogo'));
api.use('/eventos', require('./routes/eventos'));
api.use('/eventos', require('./routes/planejamento'));
api.use('/', require('./routes/cotacoes'));
api.use('/', require('./routes/selecao'));
api.use('/credenciamento', require('./routes/credenciamento'));
api.use('/fornecedores', require('./routes/fornecedores'));
api.use('/solicitacoes', require('./routes/solicitacoes'));
api.use('/ingressos', require('./routes/ingressos'));
api.use('/pedidos', require('./routes/pedidos'));
api.use('/chats', require('./routes/chat'));
api.use('/admin', require('./routes/admin'));

// todas as rotas ficam em /api/... (ex.: /api/auth/login)
app.use('/api', api);

app.use((req, res) => {
  res.status(404).json({ erro: 'rota nao encontrada' });
});

// o express 5 manda os erros das rotas async pra ca sozinho
app.use((erro, req, res, next) => {
  console.error(erro);
  res.status(500).json({ erro: 'erro interno no servidor' });
});

module.exports = app;
