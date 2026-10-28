// Regras do credenciamento que mais de uma rota usa.
const pool = require('../config/bd');

const TABELA = { organizador: 'organizador', fornecedor: 'fornecedor' };

// situacao do credenciamento da conta logada. Sem linha na tabela do perfil,
// a pessoa ainda nao pediu: "nao_solicitado".
async function situacaoDe(usuario, conexao = pool) {
  const tabela = TABELA[usuario.tipo];
  if (!tabela) return null;
  const [linhas] = await conexao.query(`select situacao from ${tabela} where id_usuario = ?`, [
    usuario.id,
  ]);
  return linhas[0]?.situacao || 'nao_solicitado';
}

// usar depois do autenticar/permitir. Se a situacao nao estiver na lista,
// responde 403 com codigo "credenciamento_necessario" (o front abre o pop-up).
//   exigirCredenciamento(['em_analise', 'credenciado'], 'criar eventos')
function exigirCredenciamento(aceitas, acao) {
  return async (req, res, next) => {
    const situacao = await situacaoDe(req.usuario);
    if (aceitas.includes(situacao)) return next();

    const erro = situacao === 'em_analise'
      ? `seu credenciamento ainda esta em analise. Depois de aprovado, voce pode ${acao}`
      : `para ${acao}, faca o credenciamento`;
    res.status(403).json({ erro, codigo: 'credenciamento_necessario', situacao });
  };
}

// cria o chat da solicitacao com o organizador e o fornecedor dentro.
// Precisa rodar dentro da transacao de quem chamou.
async function abrirChatDaSolicitacao(conexao, { id_solicitacao, id_organizador, id_usuario_fornecedor, mensagem }) {
  const [chat] = await conexao.query('insert into chat (id_solicitacao) values (?)', [id_solicitacao]);
  await conexao.query('insert into chat_participante (id_chat, id_usuario) values (?, ?), (?, ?)', [
    chat.insertId, id_organizador, chat.insertId, id_usuario_fornecedor,
  ]);
  if (mensagem) {
    await conexao.query('insert into mensagem (id_chat, id_remetente, texto_mensagem) values (?, ?, ?)', [
      chat.insertId, id_organizador, mensagem,
    ]);
  }
  return chat.insertId;
}

// quando o organizador e aprovado, os pedidos de servico que estavam retidos
// chegam ao fornecedor: viram "em_analise" e ganham o chat.
async function liberarSolicitacoesRetidas(conexao, idUsuarioOrganizador) {
  const [retidas] = await conexao.query(
    `select ss.id_solicitacao, ss.mensagem, f.id_usuario as id_usuario_fornecedor
       from solicitacao_servico ss
       join evento e on e.id_evento = ss.id_evento
       join servico s on s.id_servico = ss.id_servico
       join fornecedor f on f.id_fornecedor = s.id_fornecedor
      where e.id_organizador = ? and ss.status = 'aguardando_organizador'`,
    [idUsuarioOrganizador],
  );

  for (const sol of retidas) {
    await conexao.query(
      "update solicitacao_servico set status = 'em_analise' where id_solicitacao = ?",
      [sol.id_solicitacao],
    );
    await abrirChatDaSolicitacao(conexao, { ...sol, id_organizador: idUsuarioOrganizador });
  }
  return retidas.length;
}

module.exports = { situacaoDe, exigirCredenciamento, abrirChatDaSolicitacao, liberarSolicitacoesRetidas };
