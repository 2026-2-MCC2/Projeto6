const express = require('express');
const catalogo = require('../repositorios/catalogo');
const { autenticar, permitir } = require('../middleware/auth');

const router = express.Router();

router.get('/categorias', async (req, res) => {
  res.json(await catalogo.listarCategorias());
});

router.post('/categorias', autenticar, permitir('adm'), async (req, res) => {
  const { nome } = req.body;
  if (!nome) return res.status(400).json({ erro: 'nome e obrigatorio' });

  const id = await catalogo.criarCategoria(nome);
  res.status(201).json({ id_categoria: id, nome });
});

router.get('/locais', async (req, res) => {
  res.json(await catalogo.listarLocais());
});

router.post('/locais', autenticar, permitir('organizador', 'adm'), async (req, res) => {
  const { nome, cidade, estado, endereco } = req.body;
  if (!nome || !cidade || !estado || !endereco) {
    return res.status(400).json({ erro: 'nome, cidade, estado e endereco sao obrigatorios' });
  }

  const id = await catalogo.criarLocal({ nome, cidade, estado: estado.toUpperCase(), endereco });
  res.status(201).json({ id_local: id, nome, cidade, estado, endereco });
});

module.exports = router;
