require('dotenv').config(); //arquivo com os negocios do banco
const express = require('express');
const cors = require('cors');
const pool = require('./config/bd'); //pool seria para nos utilizarmos o banco sem ter que ficar chamando ele toda hora

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' })); //porta do front em vite
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Olá do backend da ticketudo,welcome kkk!'); //teste simples
});

app.get('/health', async (req, res) => { //teste conexão com o banco
  await pool.query('select 1');
  res.json({ ok: true });
});

app.use('/auth', require('./routes/auth'));
app.use('/', require('./routes/catalogo'));
app.use('/eventos', require('./routes/eventos'));
app.use('/fornecedores', require('./routes/fornecedores'));
app.use('/solicitacoes', require('./routes/solicitacoes'));
app.use('/ingressos', require('./routes/ingressos'));
app.use('/pedidos', require('./routes/pedidos'));
app.use('/chats', require('./routes/chat'));
app.use('/admin', require('./routes/admin'));

app.use((req, res) => {
  res.status(404).json({ erro: 'rota nao encontrada' });
});

// o express 5 manda os erros das rotas async pra ca sozinho
app.use((erro, req, res, next) => {
  console.error(erro);
  res.status(500).json({ erro: 'erro interno no servidor' });
});

const port = process.env.PORT || 3000; // rodar na porta 3000
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
