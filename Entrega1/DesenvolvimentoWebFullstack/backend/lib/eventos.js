// Funcoes de evento usadas por mais de uma rota.
const pool = require('../config/bd');

async function buscarEvento(id, conexao = pool) {
  const [linhas] = await conexao.query('select * from evento where id_evento = ?', [id]);
  return linhas[0] || null;
}

// garante que o evento existe e que quem chamou e o dono dele.
// Responde 404/403 sozinho e devolve null nesses casos.
async function eventoDoOrganizador(req, res, id = req.params.id) {
  const evento = await buscarEvento(id);
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

// Em que situacao do evento da pra mexer em cada parte do planejamento.
// Itens nao mudam durante a cotacao, porque os fornecedores cotam em cima deles.
const EDITAVEL = {
  dados: ['rascunho', 'recusado'],
  itens: ['rascunho', 'recusado'],
  custos: ['rascunho', 'recusado', 'em_cotacao', 'cotacao_encerrada'],
};

const NOME_STATUS = {
  rascunho: 'rascunho',
  em_cotacao: 'em cotacao',
  cotacao_encerrada: 'com a cotacao encerrada',
  em_analise: 'em analise',
  aprovado: 'aprovado',
  recusado: 'recusado',
};

// responde 409 se o evento nao esta numa situacao que permite a mudanca
function podeMexer(evento, parte, res) {
  if (EDITAVEL[parte].includes(evento.status)) return true;
  res.status(409).json({
    erro: `nao da pra mudar ${parte === 'dados' ? 'os dados do evento' : `os ${parte}`} com o evento ${NOME_STATUS[evento.status] || evento.status}`,
  });
  return false;
}

module.exports = { buscarEvento, eventoDoOrganizador, podeMexer, EDITAVEL };
