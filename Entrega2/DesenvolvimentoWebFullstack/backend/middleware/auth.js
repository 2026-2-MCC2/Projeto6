const jwt = require('jsonwebtoken');

// le o "Authorization: Bearer <token>" e poe os dados do usuario em req.usuario
function autenticar(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ erro: 'token nao enviado' });
  }

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ erro: 'token invalido ou expirado' });
  }
}

// usar depois do autenticar: permitir('organizador', 'adm')
function permitir(...tipos) {
  return (req, res, next) => {
    if (!tipos.includes(req.usuario.tipo)) {
      return res.status(403).json({ erro: `rota liberada so para: ${tipos.join(', ')}` });
    }
    next();
  };
}

module.exports = { autenticar, permitir };
