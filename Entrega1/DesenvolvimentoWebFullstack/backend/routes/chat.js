// Chat entre os perfis (conversas diretas e as que nascem de uma
// solicitacao de servico).
//
//   GET    /api/chats                  minhas conversas, com nao lidas
//   GET    /api/chats/nao-lidas        total de nao lidas (o numero no menu)
//   GET    /api/chats/contatos?busca=  com quem posso comecar uma conversa
//   POST   /api/chats                  abre (ou reaproveita) conversa direta
//   GET    /api/chats/:id?depois=      cabecalho + mensagens (so as novas com "depois")
//   GET    /api/chats/:id/mensagens    so as mensagens
//   POST   /api/chats/:id/mensagens    envia mensagem
//   POST   /api/chats/:id/lida         marca como lida ate a mensagem "ate"
const express = require('express');
const chat = require('../repositorios/chat');
const { emTransacao } = require('../repositorios/transacao');
const { motivoParaNaoConversar, validarTexto, idOuZero } = require('../regras/chat');
const { autenticar } = require('../middleware/auth');

const router = express.Router();

router.use(autenticar);

// responde 403 e devolve false se a pessoa nao esta na conversa
async function soParticipante(req, res) {
  const idChat = idOuZero(req.params.id);
  if (!idChat) {
    res.status(404).json({ erro: 'conversa nao encontrada' });
    return null;
  }
  if (!(await chat.participa(idChat, req.usuario.id))) {
    res.status(403).json({ erro: 'voce nao participa desse chat' });
    return null;
  }
  return idChat;
}

router.get('/', async (req, res) => {
  res.json(await chat.doUsuario(req.usuario.id));
});

router.get('/nao-lidas', async (req, res) => {
  res.json(await chat.naoLidas(req.usuario.id));
});

// /usuarios e o nome antigo da mesma busca (mantido para a collection do Postman)
router.get(['/contatos', '/usuarios'], async (req, res) => {
  const eu = await chat.pessoa(req.usuario.id);
  res.json(await chat.contatos(eu, String(req.query.busca || '').trim()));
});

// conversa direta. Se ja existe uma entre as duas pessoas, reaproveita.
router.post('/', async (req, res) => {
  const idOutro = idOuZero(req.body.id_usuario);
  if (!idOutro) return res.status(400).json({ erro: 'escolha com quem falar' });

  const [eu, outro] = await Promise.all([chat.pessoa(req.usuario.id), chat.pessoa(idOutro)]);
  if (!outro) return res.status(404).json({ erro: 'usuario nao encontrado' });

  const motivo = motivoParaNaoConversar(eu, outro);
  if (motivo) return res.status(403).json({ erro: motivo });

  let primeira = null;
  if (req.body.mensagem !== undefined && String(req.body.mensagem).trim()) {
    const { erro, texto } = validarTexto(req.body.mensagem);
    if (erro) return res.status(400).json({ erro });
    primeira = texto;
  }

  const existe = await chat.conversaDiretaEntre(eu.id_usuario, outro.id_usuario);
  const assunto = String(req.body.assunto || '').trim().slice(0, 140) || null;

  const idChat = await emTransacao(async (conexao) => {
    const id = existe || await chat.criarConversaDireta(
      { assunto, idA: eu.id_usuario, idB: outro.id_usuario },
      conexao,
    );
    if (primeira) {
      await chat.enviarMensagem({ idChat: id, idRemetente: eu.id_usuario, texto: primeira }, conexao);
    }
    return id;
  });
  res.status(existe ? 200 : 201).json({ id_chat: idChat, nova: !existe });
});

router.get('/:id', async (req, res) => {
  const idChat = await soParticipante(req, res);
  if (!idChat) return;
  const [conversa, mensagens] = await Promise.all([
    chat.detalhe(idChat),
    chat.mensagens(idChat, idOuZero(req.query.depois)),
  ]);
  res.json({ ...conversa, mensagens });
});

router.get('/:id/mensagens', async (req, res) => {
  const idChat = await soParticipante(req, res);
  if (!idChat) return;
  res.json(await chat.mensagens(idChat, idOuZero(req.query.depois)));
});

router.post('/:id/mensagens', async (req, res) => {
  const { erro, texto } = validarTexto(req.body.texto);
  if (erro) return res.status(400).json({ erro });

  const idChat = await soParticipante(req, res);
  if (!idChat) return;

  const nova = await chat.enviarMensagem({ idChat, idRemetente: req.usuario.id, texto });
  res.status(201).json({
    ...nova,
    remetente: req.usuario.nome,
    tipo_remetente: req.usuario.tipo,
  });
});

router.post('/:id/lida', async (req, res) => {
  const idChat = await soParticipante(req, res);
  if (!idChat) return;
  const ate = idOuZero(req.body?.ate);
  if (!ate) return res.status(400).json({ erro: 'informe ate qual mensagem foi lida' });
  await chat.marcarLida(idChat, req.usuario.id, ate);
  res.json({ id_chat: idChat, ate });
});

module.exports = router;
