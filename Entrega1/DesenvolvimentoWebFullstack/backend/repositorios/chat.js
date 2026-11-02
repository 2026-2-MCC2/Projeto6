// SQL das conversas (chat), participantes e mensagens.
const pool = require('../config/bd');

// so quem esta na tabela de participantes enxerga o chat
async function participa(idChat, idUsuario) {
  const [linhas] = await pool.query(
    'select 1 from chat_participante where id_chat = ? and id_usuario = ?',
    [idChat, idUsuario],
  );
  return linhas.length > 0;
}

// as conversas da pessoa. O left join cobre os dois tipos de chat: o que
// nasceu de uma solicitacao e o que o administrador abriu direto.
async function doUsuario(idUsuario) {
  const [linhas] = await pool.query(
    `select ch.id_chat, ch.criado_em, ch.assunto, e.nome as evento,
            s.nome as servico, ss.status,
            (select texto_mensagem from mensagem where id_chat = ch.id_chat
              order by criado_em desc limit 1) as ultima_mensagem,
            (select string_agg(u.nome, ', ') from chat_participante p
               join usuario u on u.id_usuario = p.id_usuario
              where p.id_chat = ch.id_chat and p.id_usuario <> ?) as com_quem
       from chat ch
       join chat_participante cp on cp.id_chat = ch.id_chat
       left join solicitacao_servico ss on ss.id_solicitacao = ch.id_solicitacao
       left join servico s on s.id_servico = ss.id_servico
       left join evento e on e.id_evento = ss.id_evento
      where cp.id_usuario = ?
      order by ch.criado_em desc`,
    [idUsuario, idUsuario],
  );
  return linhas;
}

// quem o administrador pode chamar no chat (busca por nome ou e-mail)
async function buscarUsuarios(idAdm, termo) {
  const busca = `%${termo}%`;
  const [linhas] = await pool.query(
    `select id_usuario, nome, email, tipo from usuario
      where id_usuario <> ? and (nome ilike ? or email ilike ?)
      order by nome limit 30`,
    [idAdm, busca, busca],
  );
  return linhas;
}

async function buscarUsuario(idUsuario) {
  const [linhas] = await pool.query('select id_usuario, nome from usuario where id_usuario = ?', [idUsuario]);
  return linhas[0] || null;
}

// conversa direta (sem solicitacao) que ja exista entre as duas pessoas
async function conversaDiretaEntre(idA, idB) {
  const [linhas] = await pool.query(
    `select ch.id_chat from chat ch
       join chat_participante a on a.id_chat = ch.id_chat and a.id_usuario = ?
       join chat_participante b on b.id_chat = ch.id_chat and b.id_usuario = ?
      where ch.id_solicitacao is null limit 1`,
    [idA, idB],
  );
  return linhas[0]?.id_chat || null;
}

async function criarConversaDireta({ assunto, idA, idB }, conexao) {
  const [novo] = await conexao.query('insert into chat (assunto) values (?)', [assunto]);
  await conexao.query('insert into chat_participante (id_chat, id_usuario) values (?, ?), (?, ?)', [
    novo.insertId, idA, novo.insertId, idB,
  ]);
  return novo.insertId;
}

// cria o chat de uma solicitacao de servico, com o organizador e o
// fornecedor dentro. Rodar dentro da transacao de quem chamou.
async function abrirDaSolicitacao(conexao, { id_solicitacao, id_organizador, id_usuario_fornecedor, mensagem }) {
  const [chat] = await conexao.query('insert into chat (id_solicitacao) values (?)', [id_solicitacao]);
  await conexao.query('insert into chat_participante (id_chat, id_usuario) values (?, ?), (?, ?)', [
    chat.insertId, id_organizador, chat.insertId, id_usuario_fornecedor,
  ]);
  if (mensagem) {
    await enviarMensagem({ idChat: chat.insertId, idRemetente: id_organizador, texto: mensagem }, conexao);
  }
  return chat.insertId;
}

async function mensagens(idChat) {
  const [linhas] = await pool.query(
    `select m.id_mensagem, m.texto_mensagem, m.criado_em,
            m.id_remetente, u.nome as remetente, u.tipo as tipo_remetente
       from mensagem m join usuario u on u.id_usuario = m.id_remetente
      where m.id_chat = ? order by m.criado_em`,
    [idChat],
  );
  return linhas;
}

async function enviarMensagem({ idChat, idRemetente, texto }, conexao = pool) {
  const [r] = await conexao.query(
    'insert into mensagem (id_chat, id_remetente, texto_mensagem) values (?, ?, ?)',
    [idChat, idRemetente, texto],
  );
  return r.insertId;
}

module.exports = {
  participa,
  doUsuario,
  buscarUsuarios,
  buscarUsuario,
  conversaDiretaEntre,
  criarConversaDireta,
  abrirDaSolicitacao,
  mensagens,
  enviarMensagem,
};
