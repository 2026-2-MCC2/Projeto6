const express = require('express');
const chat = require('../repositorios/chat');
const { emTransacao } = require('../repositorios/transacao');
const { autenticar, permitir } = require('../middleware/auth');

const router = express.Router();

router.get('/', autenticar, async (req, res) => {
  res.json(await chat.doUsuario(req.usuario.id));
});

// quem o administrador pode chamar no chat
router.get('/usuarios', autenticar, permitir('adm'), async (req, res) => {
  res.json(await chat.buscarUsuarios(req.usuario.id, (req.query.busca || '').trim()));
});

// conversa direta: so o administrador abre
router.post('/', autenticar, permitir('adm'), async (req, res) => {
  const { id_usuario, assunto, mensagem } = req.body;
  if (!id_usuario) return res.status(400).json({ erro: 'escolha com quem falar' });

  const alvo = await chat.buscarUsuario(id_usuario);
  if (!alvo) return res.status(404).json({ erro: 'usuario nao encontrado' });

  // se ja existe uma conversa direta entre os dois, reaproveita
  const existe = await chat.conversaDiretaEntre(req.usuario.id, id_usuario);

  const idChat = await emTransacao(async (conexao) => {
    const id = existe || await chat.criarConversaDireta(
      { assunto: assunto || `Conversa com ${alvo.nome}`, idA: req.usuario.id, idB: id_usuario },
      conexao,
    );
    if (mensagem && mensagem.trim()) {
      await chat.enviarMensagem({ idChat: id, idRemetente: req.usuario.id, texto: mensagem.trim() }, conexao);
    }
    return id;
  });
  res.status(201).json({ id_chat: idChat });
});

router.get('/:id/mensagens', autenticar, async (req, res) => {
  if (!(await chat.participa(req.params.id, req.usuario.id))) {
    return res.status(403).json({ erro: 'voce nao participa desse chat' });
  }
  res.json(await chat.mensagens(req.params.id));
});

router.post('/:id/mensagens', autenticar, async (req, res) => {
  const { texto } = req.body;
  if (!texto || !texto.trim()) return res.status(400).json({ erro: 'mensagem vazia' });

  if (!(await chat.participa(req.params.id, req.usuario.id))) {
    return res.status(403).json({ erro: 'voce nao participa desse chat' });
  }

  const id = await chat.enviarMensagem({ idChat: req.params.id, idRemetente: req.usuario.id, texto: texto.trim() });
  res.status(201).json({ id_mensagem: id, texto_mensagem: texto.trim() });
});

module.exports = router;
