const express = require('express');
const pool = require('./config/bd'); //pool seria para nos utilizarmos o banco sem ter que ficar chamando ele toda hora
const cors = require('cors');
cosnt ('dotenv').config(); //arquivo com os negocios do banco
const app = express();

app.use(cors({origin: 'http://localhost:5173'})); //porta do front em vite 
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Olá do backend da ticketudo,welcome kkk!'); //teste simples
});

//teste para banco --testar segunda
app.get('/health', async (req, res) =>{ //teste conexão com o banco
  await pool.query("select 1")
  res.json({ok:true});
})

const port = process.env.PORT || 3000; // rodar na porta 3000
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
