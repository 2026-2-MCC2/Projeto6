const JANELA_MS = 15 * 60 * 1000;
const MAX_TENTATIVAS = 5;
const tentativas = new Map();

function chave(req) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  return `${req.ip}:${email}`;
}

function limiteLogin(req, res, next) {
  const registro = tentativas.get(chave(req));
  if (registro && registro.expiraEm > Date.now() && registro.quantidade >= MAX_TENTATIVAS) {
    const espera = Math.ceil((registro.expiraEm - Date.now()) / 1000);
    res.set('Retry-After', String(espera));
    return res.status(429).json({ erro: 'muitas tentativas de login; tente novamente em alguns minutos' });
  }
  return next();
}

function registrarFalha(req) {
  const id = chave(req);
  const atual = tentativas.get(id);
  if (!atual || atual.expiraEm <= Date.now()) {
    tentativas.set(id, { quantidade: 1, expiraEm: Date.now() + JANELA_MS });
    return;
  }
  atual.quantidade += 1;
}

function limparFalhas(req) {
  tentativas.delete(chave(req));
}

module.exports = { limiteLogin, registrarFalha, limparFalhas };
