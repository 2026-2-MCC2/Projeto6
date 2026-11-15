// Sobe o backend no computador. Na Vercel quem usa o app e o api/index.js.
const app = require('./app');

const port = process.env.PORT || 3000; // rodar na porta 3000
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port} (rotas em /api)`);
});
