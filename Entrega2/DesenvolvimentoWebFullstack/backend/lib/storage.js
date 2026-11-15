const EXTENSAO_POR_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function configurado() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function salvarFotoPerfil(idUsuario, foto) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(foto);
  if (!match) {
    const erro = new Error('foto invalida');
    erro.status = 400;
    throw erro;
  }
  if (!configurado()) {
    const erro = new Error('armazenamento de fotos nao configurado');
    erro.status = 503;
    throw erro;
  }

  const [, mime, conteudo] = match;
  const bytes = Buffer.from(conteudo, 'base64');
  if (bytes.length > 2 * 1024 * 1024) {
    const erro = new Error('foto maior que 2 MB');
    erro.status = 400;
    throw erro;
  }

  const base = process.env.SUPABASE_URL.replace(/\/$/, '');
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'avatars';
  const caminho = `perfis/${idUsuario}.${EXTENSAO_POR_MIME[mime]}`;
  const resposta = await fetch(`${base}/storage/v1/object/${bucket}/${caminho}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': mime,
      'x-upsert': 'true',
    },
    body: bytes,
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text();
    const erro = new Error(`nao foi possivel salvar a foto (${resposta.status})`);
    erro.detalhe = detalhe;
    erro.status = 502;
    throw erro;
  }

  return `${base}/storage/v1/object/public/${bucket}/${caminho}`;
}

module.exports = { salvarFotoPerfil };
