const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usuarios = require('../repositorios/usuarios');
const { ehDuplicado } = require('../repositorios/transacao');
const { autenticar } = require('../middleware/auth');

const router = express.Router();
// conta de adm nao sai por cadastro aberto, so pelo seed ou direto no banco
const TIPOS = ['comprador', 'organizador', 'fornecedor'];

// e-mail e sempre gravado e comparado sem espacos nas pontas e em minusculas,
// para Caio@x.com e caio@x.com serem a mesma conta
function normalizarEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id_usuario, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  );
}

router.post('/cadastro', async (req, res) => {
  const { nome, cpf, senha, telefone, tipo } = req.body;
  const email = normalizarEmail(req.body.email);

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
    const id = await usuarios.criar({
      nome,
      email,
      cpf: cpf.replace(/\D/g, ''),
      senhaHash,
      telefone: telefone || null,
      tipo: tipo || 'comprador',
    });
    const usuario = {
      id_usuario: id,
      nome,
      email,
      tipo: tipo || 'comprador',
    };
    return res.status(201).json({ usuario, token: gerarToken(usuario) });
  } catch (e) {
    if (ehDuplicado(e)) {
      const campo = e.message.includes('email') ? 'email' : 'cpf';
      return res.status(409).json({ erro: `ja existe uma conta com esse ${campo}` });
    }
    throw e;
  }
});

router.post('/login', async (req, res) => {
  const { senha } = req.body;
  const email = normalizarEmail(req.body.email);
  if (!email || !senha) {
    return res.status(400).json({ erro: 'email e senha sao obrigatorios' });
  }

  const usuario = await usuarios.buscarParaLogin(email);

  // mesma resposta pros dois casos, pra nao dizer se o email existe ou nao
  if (!usuario || !(await bcrypt.compare(senha, usuario.senha_hash))) {
    return res.status(401).json({ erro: 'email ou senha incorretos' });
  }

  delete usuario.senha_hash;
  return res.json({ usuario, token: gerarToken(usuario) });
});

router.get('/eu', autenticar, async (req, res) => {
  const usuario = await usuarios.buscarPerfil(req.usuario.id);
  if (!usuario) {
    return res.status(404).json({ erro: 'usuario nao encontrado' });
  }
  return res.json(usuario);
});

module.exports = router;
