const express = require('express');
const pool = require('../config/bd');
const { autenticar, permitir } = require('../middleware/auth');

const router = express.Router();

router.get('/categorias', async (req, res) => {
  const [linhas] = await pool.query('select * from categoria order by nome');
  res.json(linhas);
});

router.post('/categorias', autenticar, permitir('adm'), async (req, res) => {
  const { nome } = req.body;
  if (!nome) return res.status(400).json({ erro: 'nome e obrigatorio' });

  const [r] = await pool.query('insert into categoria (nome) values (?)', [nome]);
  res.status(201).json({ id_categoria: r.insertId, nome });
});

router.get('/locais', async (req, res) => {
  const [linhas] = await pool.query('select * from local_evento order by nome');
  res.json(linhas);
});

router.post('/locais', autenticar, permitir('organizador', 'adm'), async (req, res) => {
  const { nome, cidade, estado, endereco } = req.body;
  if (!nome || !cidade || !estado || !endereco) {
    return res.status(400).json({ erro: 'nome, cidade, estado e endereco sao obrigatorios' });
  }

  const [r] = await pool.query(
    'insert into local_evento (nome, cidade, estado, endereco) values (?, ?, ?, ?)',
    [nome, cidade, estado.toUpperCase(), endereco],
  );
  res.status(201).json({ id_local: r.insertId, nome, cidade, estado, endereco });
});

module.exports = router;
