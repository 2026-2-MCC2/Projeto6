// SQL das conversas (chat), participantes e mensagens.
//
// Lido / nao lido: cada participante guarda em ultima_lida o id da ultima
// mensagem que ja viu na conversa. Nao lidas = mensagens dos outros com id
// maior que esse numero.
const pool = require('../config/bd');

// nome da empresa ou da organizacao da pessoa, quando ela tem credenciamento
const EMPRESA = 'coalesce(fo.nome_empresa, og.nome_organizacao)';
const JUNTA_EMPRESA = `left join fornecedor fo on fo.id_usuario = u.id_usuario
       left join organizador og on og.id_usuario = u.id_usuario`;

// so quem esta na tabela de participantes enxerga o chat
async function participa(idChat, idUsuario) {
  const [linhas] = await pool.query(
    'select 1 from chat_participante where id_chat = ? and id_usuario = ?',
    [idChat, idUsuario],
  );
  return linhas.length > 0;
}

// as conversas da pessoa, da mais recente para a mais antiga (pela ultima
// mensagem). O left join cobre os dois tipos de chat: o que nasceu de uma
// solicitacao e a conversa direta.
async function doUsuario(idUsuario) {
  const [linhas] = await pool.query(
    `select ch.id_chat, ch.criado_em, ch.assunto, e.nome as evento,
            s.nome as servico, ss.status,
            um.texto_mensagem as ultima_mensagem, um.criado_em as ultima_em,
            um.id_remetente as ultimo_remetente,
            (select count(*)::int from mensagem m
              where m.id_chat = ch.id_chat and m.id_remetente <> ?
                and m.id_mensagem > coalesce(cp.ultima_lida, 0)) as nao_lidas,
            o.id_usuario as com_id, o.nome as com_quem, o.tipo as com_tipo, o.empresa as com_empresa
       from chat ch
       join chat_participante cp on cp.id_chat = ch.id_chat and cp.id_usuario = ?
       left join lateral (
             select texto_mensagem, criado_em, id_remetente from mensagem
              where id_chat = ch.id_chat order by id_mensagem desc limit 1) um on true
       left join lateral (
             select u.id_usuario, u.nome, u.tipo, ${EMPRESA} as empresa
               from chat_participante p
               join usuario u on u.id_usuario = p.id_usuario
               ${JUNTA_EMPRESA}
              where p.id_chat = ch.id_chat and p.id_usuario <> ?
              order by u.id_usuario limit 1) o on true
       left join solicitacao_servico ss on ss.id_solicitacao = ch.id_solicitacao
       left join servico s on s.id_servico = ss.id_servico
       left join evento e on e.id_evento = ss.id_evento
      order by coalesce(um.criado_em, ch.criado_em) desc, ch.id_chat desc`,
    [idUsuario, idUsuario, idUsuario],
  );
  return linhas;
}

// total de mensagens nao lidas da pessoa, somando todas as conversas
async function naoLidas(idUsuario) {
  const [linhas] = await pool.query(
    `select count(*)::int as total, count(distinct m.id_chat)::int as conversas
       from chat_participante cp
       join mensagem m on m.id_chat = cp.id_chat
      where cp.id_usuario = ? and m.id_remetente <> ?
        and m.id_mensagem > coalesce(cp.ultima_lida, 0)`,
    [idUsuario, idUsuario],
  );
  return linhas[0];
}

// dados da conversa para o cabecalho: assunto, contexto e participantes
// (com ate onde cada um ja leu, para mostrar "visto")
async function detalhe(idChat) {
  const [conversa] = await pool.query(
    `select ch.id_chat, ch.assunto, ch.criado_em, ch.id_solicitacao,
            e.nome as evento, s.nome as servico, ss.status
       from chat ch
       left join solicitacao_servico ss on ss.id_solicitacao = ch.id_solicitacao
       left join servico s on s.id_servico = ss.id_servico
       left join evento e on e.id_evento = ss.id_evento
      where ch.id_chat = ?`,
    [idChat],
  );
  if (!conversa[0]) return null;

  const [participantes] = await pool.query(
    `select u.id_usuario, u.nome, u.tipo, ${EMPRESA} as empresa,
            coalesce(p.ultima_lida, 0) as ultima_lida
       from chat_participante p
       join usuario u on u.id_usuario = p.id_usuario
       ${JUNTA_EMPRESA}
      where p.id_chat = ?
      order by u.nome`,
    [idChat],
  );
  return { ...conversa[0], participantes };
}

// a pessoa com o que importa para as regras do chat: tipo e credenciamento
async function pessoa(idUsuario) {
  const [linhas] = await pool.query(
    `select u.id_usuario, u.nome, u.tipo, ${EMPRESA} as empresa,
            coalesce(fo.situacao, og.situacao, 'nao_solicitado') as situacao
       from usuario u
       ${JUNTA_EMPRESA}
      where u.id_usuario = ?`,
    [idUsuario],
  );
  return linhas[0] || null;
}

// com quem a pessoa pode comecar uma conversa (busca por nome, e-mail ou
// empresa). Segue as mesmas regras de regras/chat.js:
// - administrador: todo mundo;
// - organizador/fornecedor: a equipe TrocaTicket e, se estiver credenciado,
//   os credenciados do outro lado (organizador <-> fornecedor).
// E-mail so aparece para o administrador.
async function contatos(eu, termo) {
  const busca = `%${termo}%`;
  const ehAdm = eu.tipo === 'adm';
  const outroLado = { organizador: 'fornecedor', fornecedor: 'organizador' }[eu.tipo] || null;
  const podeOutroLado = !ehAdm && outroLado && eu.situacao === 'credenciado';

  const [linhas] = await pool.query(
    `select u.id_usuario, u.nome, u.tipo, ${EMPRESA} as empresa,
            ${ehAdm ? 'u.email' : 'null'} as email
       from usuario u
       ${JUNTA_EMPRESA}
      where u.id_usuario <> ?
        and (u.nome ilike ? or u.email ilike ? or ${EMPRESA} ilike ?)
        and (? or u.tipo = 'adm'
             or (? and u.tipo = ? and coalesce(fo.situacao, og.situacao) = 'credenciado'))
      order by (u.tipo = 'adm') desc, u.nome
      limit 30`,
    [eu.id_usuario, busca, busca, busca, ehAdm, Boolean(podeOutroLado), outroLado || ''],
  );
  return linhas;
}

// conversa direta (sem solicitacao) que ja exista entre as duas pessoas
async function conversaDiretaEntre(idA, idB) {
  const [linhas] = await pool.query(
    `select ch.id_chat from chat ch
       join chat_participante a on a.id_chat = ch.id_chat and a.id_usuario = ?
       join chat_participante b on b.id_chat = ch.id_chat and b.id_usuario = ?
      where ch.id_solicitacao is null
      order by ch.id_chat limit 1`,
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

// mensagens da conversa em ordem. Com "depois", so as que chegaram depois
// daquele id (o painel aberto pede so o que e novo).
async function mensagens(idChat, depois = 0) {
  const [linhas] = await pool.query(
    `select m.id_mensagem, m.texto_mensagem, m.criado_em,
            m.id_remetente, u.nome as remetente, u.tipo as tipo_remetente
       from mensagem m join usuario u on u.id_usuario = m.id_remetente
      where m.id_chat = ? and m.id_mensagem > ?
      order by m.id_mensagem`,
    [idChat, depois],
  );
  return linhas;
}

// grava a mensagem e devolve ela completa. Quem enviou ja leu ate ela.
async function enviarMensagem({ idChat, idRemetente, texto }, conexao = pool) {
  const [r] = await conexao.query(
    'insert into mensagem (id_chat, id_remetente, texto_mensagem) values (?, ?, ?)',
    [idChat, idRemetente, texto],
  );
  await conexao.query(
    'update chat_participante set ultima_lida = ? where id_chat = ? and id_usuario = ?',
    [r.insertId, idChat, idRemetente],
  );
  return r.rows[0];
}

// marca como lido ate a mensagem "ate" (nunca volta para tras e nunca passa
// da ultima mensagem que existe na conversa)
async function marcarLida(idChat, idUsuario, ate) {
  await pool.query(
    `update chat_participante
        set ultima_lida = greatest(coalesce(ultima_lida, 0),
              least(?, (select coalesce(max(id_mensagem), 0) from mensagem where id_chat = ?)))
      where id_chat = ? and id_usuario = ?`,
    [ate, idChat, idChat, idUsuario],
  );
}

module.exports = {
  participa,
  doUsuario,
  naoLidas,
  detalhe,
  pessoa,
  contatos,
  conversaDiretaEntre,
  criarConversaDireta,
  abrirDaSolicitacao,
  mensagens,
  enviarMensagem,
  marcarLida,
};
