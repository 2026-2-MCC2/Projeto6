const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/bd');
const { autenticar } = require('../middleware/auth');

const router = express.Router();
// conta de adm nao sai por cadastro aberto, so pelo seed ou direto no banco
const TIPOS = ['comprador', 'organizador', 'fornecedor'];

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id_usuario, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  );
}

router.post('/cadastro', async (req, res) => {
  const { nome, email, cpf, senha, telefone, tipo } = req.body;

  if (!nome || !email || !cpf || !senha) {
    return res.status(400).json({ erro: 'nome, email, cpf e senha sao obrigatorios' });
  }
  if (senha.length < 6) {
    return res.status(400).json({ erro: 'a senha precisa de pelo menos 6 caracteres' });
  }
  if (tipo && !TIPOS.includes(tipo)) {
    return res.status(400).json({ erro: `tipo invalido, use um de: ${TIPOS.join(', ')}` });
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  try {
    const [resultado] = await pool.query(
      'insert into usuario (nome, email, cpf, senha_hash, telefone, tipo) values (?, ?, ?, ?, ?, ?)',
      [nome, email, cpf.replace(/\D/g, ''), senhaHash, telefone || null, tipo || 'comprador'],
    );
    const usuario = {
      id_usuario: resultado.insertId,
      nome,
      email,
      tipo: tipo || 'comprador',
    };
    return res.status(201).json({ usuario, token: gerarToken(usuario) });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      const campo = e.message.includes('email') ? 'email' : 'cpf';
      return res.status(409).json({ erro: `ja existe uma conta com esse ${campo}` });
    }
    throw e;
  }
});

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'email e senha sao obrigatorios' });
  }

  const [linhas] = await pool.query(
    'select id_usuario, nome, email, senha_hash, tipo from usuario where email = ?',
    [email],
  );
  const usuario = linhas[0];

  // mesma resposta pros dois casos, pra nao dizer se o email existe ou nao
  if (!usuario || !(await bcrypt.compare(senha, usuario.senha_hash))) {
    return res.status(401).json({ erro: 'email ou senha incorretos' });
  }

  delete usuario.senha_hash;
  return res.json({ usuario, token: gerarToken(usuario) });
});

router.get('/eu', autenticar, async (req, res) => {
  const [linhas] = await pool.query(
    'select id_usuario, nome, email, cpf, telefone, tipo, criado_em from usuario where id_usuario = ?',
    [req.usuario.id],
  );
  if (!linhas.length) {
    return res.status(404).json({ erro: 'usuario nao encontrado' });
  }
  return res.json(linhas[0]);
});

module.exports = router;
