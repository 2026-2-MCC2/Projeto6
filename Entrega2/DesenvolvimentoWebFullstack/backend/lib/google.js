function normalizarEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function validarCredencialGoogle(credential, clientId, buscar = fetch) {
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID nao configurado');
  const resposta = await buscar(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
  );
  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok || dados?.aud !== clientId || dados?.email_verified !== 'true' || !dados.email) {
    return null;
  }
  return {
    nome: String(dados.name || dados.email.split('@')[0]).slice(0, 120),
    email: normalizarEmail(dados.email),
  };
}

module.exports = { validarCredencialGoogle };
