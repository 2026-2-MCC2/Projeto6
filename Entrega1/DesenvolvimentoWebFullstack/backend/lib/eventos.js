// Ajudantes das rotas de evento: buscam o evento e ja respondem o erro
// (404, 403, 409) quando a pessoa nao pode seguir.
const eventos = require('../repositorios/eventos');
const { bloqueioDeMudanca } = require('../regras/eventos');

// garante que o evento existe e que quem chamou e o dono dele.
// Responde 404/403 sozinho e devolve null nesses casos.
async function eventoDoOrganizador(req, res, id = req.params.id) {
  const evento = await eventos.buscar(id);
  if (!evento) {
    res.status(404).json({ erro: 'evento nao encontrado' });
    return null;
  }
  if (evento.id_organizador !== req.usuario.id) {
    res.status(403).json({ erro: 'esse evento e de outro organizador' });
    return null;
  }
  return evento;
}

// responde 409 se o evento nao esta numa situacao que permite a mudanca
function podeMexer(evento, parte, res) {
  const bloqueio = bloqueioDeMudanca(evento, parte);
  if (!bloqueio) return true;
  res.status(409).json({ erro: bloqueio });
  return false;
}

module.exports = { eventoDoOrganizador, podeMexer };
