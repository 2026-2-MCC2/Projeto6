const express = require('express');
const pool = require('../config/bd');
const { autenticar, permitir } = require('../middleware/auth');

const router = express.Router();

// so quem esta na tabela de participantes enxerga o chat
async function participa(idChat, idUsuario) {
  const [linhas] = await pool.query(
    'select 1 from chat_participante where id_chat = ? and id_usuario = ?',
    [idChat, idUsuario],
  );
  return linhas.length > 0;
}

router.get('/', autenticar, async (req, res) => {
  // o left join cobre os dois tipos de chat: o que nasceu de uma
  // solicitacao e o que o administrador abriu direto
  const [linhas] = await pool.query(
    `select ch.id_chat, ch.criado_em, ch.assunto, e.nome as evento,
            s.nome as servico, ss.status,
            (select texto_mensagem from mensagem where id_chat = ch.id_chat
              order by criado_em desc limit 1) as ultima_mensagem,
            (select group_concat(u.nome separator ', ') from chat_participante p
               join usuario u on u.id_usuario = p.id_usuario
              where p.id_chat = ch.id_chat and p.id_usuario <> ?) as com_quem
       from chat ch
       join chat_participante cp on cp.id_chat = ch.id_chat
       left join solicitacao_servico ss on ss.id_solicitacao = ch.id_solicitacao
       left join servico s on s.id_servico = ss.id_servico
       left join evento e on e.id_evento = ss.id_evento
      where cp.id_usuario = ?
      order by ch.criado_em desc`,
    [req.usuario.id, req.usuario.id],
  );
  res.json(linhas);
});

// quem o administrador pode chamar no chat
router.get('/usuarios', autenticar, permitir('adm'), async (req, res) => {
  const busca = `%${(req.query.busca || '').trim()}%`;
  const [linhas] = await pool.query(
    `select id_usuario, nome, email, tipo from usuario
      where id_usuario <> ? and (nome like ? or email like ?)
      order by nome limit 30`,
    [req.usuario.id, busca, busca],
  );
  res.json(linhas);
});

// conversa direta: so o administrador abre
router.post('/', autenticar, permitir('adm'), async (req, res) => {
  const { id_usuario, assunto, mensagem } = req.body;
  if (!id_usuario) return res.status(400).json({ erro: 'escolha com quem falar' });

  const [alvo] = await pool.query('select id_usuario, nome from usuario where id_usuario = ?', [
    id_usuario,
  ]);
  if (!alvo.length) return res.status(404).json({ erro: 'usuario nao encontrado' });

  // se ja existe uma conversa direta entre os dois, reaproveita
  const [existe] = await pool.query(
    `select ch.id_chat from chat ch
       join chat_participante a on a.id_chat = ch.id_chat and a.id_usuario = ?
       join chat_participante b on b.id_chat = ch.id_chat and b.id_usuario = ?
      where ch.id_solicitacao is null limit 1`,
    [req.usuario.id, id_usuario],
  );

  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();
    let idChat = existe[0]?.id_chat;

    if (!idChat) {
      const [novo] = await conexao.query('insert into chat (assunto) values (?)', [
        assunto || `Conversa com ${alvo[0].nome}`,
      ]);
      idChat = novo.insertId;
      await conexao.query(
        'insert into chat_participante (id_chat, id_usuario) values (?, ?), (?, ?)',
        [idChat, req.usuario.id, idChat, id_usuario],
      );
    }

    if (mensagem && mensagem.trim()) {
      await conexao.query(
        'insert into mensagem (id_chat, id_remetente, texto_mensagem) values (?, ?, ?)',
        [idChat, req.usuario.id, mensagem.trim()],
      );
    }

    await conexao.commit();
    res.status(201).json({ id_chat: idChat });
  } catch (e) {
    await conexao.rollback();
    throw e;
  } finally {
    conexao.release();
  }
});

router.get('/:id/mensagens', autenticar, async (req, res) => {
  if (!(await participa(req.params.id, req.usuario.id))) {
    return res.status(403).json({ erro: 'voce nao participa desse chat' });
  }

  const [linhas] = await pool.query(
    `select m.id_mensagem, m.texto_mensagem, m.criado_em,
            m.id_remetente, u.nome as remetente, u.tipo as tipo_remetente
       from mensagem m join usuario u on u.id_usuario = m.id_remetente
      where m.id_chat = ? order by m.criado_em`,
    [req.params.id],
  );
  res.json(linhas);
});

router.post('/:id/mensagens', autenticar, async (req, res) => {
  const { texto } = req.body;
  if (!texto || !texto.trim()) return res.status(400).json({ erro: 'mensagem vazia' });

  if (!(await participa(req.params.id, req.usuario.id))) {
    return res.status(403).json({ erro: 'voce nao participa desse chat' });
  }

  const [r] = await pool.query(
    'insert into mensagem (id_chat, id_remetente, texto_mensagem) values (?, ?, ?)',
    [req.params.id, req.usuario.id, texto.trim()],
  );
  res.status(201).json({ id_mensagem: r.insertId, texto_mensagem: texto.trim() });
});

module.exports = router;
