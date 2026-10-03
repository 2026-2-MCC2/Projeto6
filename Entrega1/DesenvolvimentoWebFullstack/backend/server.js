const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Olá do backend com Node.js!');
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
console.log('Servidor iniciado com sucesso!');