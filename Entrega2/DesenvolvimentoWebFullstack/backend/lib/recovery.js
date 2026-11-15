const crypto = require('crypto');

function gerarCodigo() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashCodigo(codigo, segredo) {
  return crypto.createHash('sha256').update(`${codigo}:${segredo}`).digest('hex');
}

function codigoConfere(codigo, hash, segredo) {
  const recebido = Buffer.from(hashCodigo(codigo, segredo), 'utf8');
  const esperado = Buffer.from(hash || '', 'utf8');
  return recebido.length === esperado.length && crypto.timingSafeEqual(recebido, esperado);
}

function codigoExpirado(expiraEm, agora = Date.now()) {
  return new Date(expiraEm).getTime() <= agora;
}

module.exports = { gerarCodigo, hashCodigo, codigoConfere, codigoExpirado };
