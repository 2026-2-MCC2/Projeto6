// SQL dos pedidos de servico (solicitacao_servico) vistos pelo fornecedor.
const pool = require('../config/bd');

// o que chegou pro fornecedor. Pedido retido (organizador ainda nao
// credenciado) fica de fora ate o adm aprovar o organizador.
async function recebidasPeloFornecedor(idUsuario) {
  const [linhas] = await pool.query(
    `select ss.*, s.nome as servico, e.nome as evento, e.data_inicio,
            u.nome as organizador, ch.id_chat
       from solicitacao_servico ss
       join servico s on s.id_servico = ss.id_servico
       join fornecedor f on f.id_fornecedor = s.id_fornecedor
       join evento e on e.id_evento = ss.id_evento
       join usuario u on u.id_usuario = e.id_organizador
       left join chat ch on ch.id_solicitacao = ss.id_solicitacao
      where f.id_usuario = ? and ss.status <> 'aguardando_organizador'
      order by ss.criado_em desc`,
    [idUsuario],
  );
  return linhas;
}

async function buscarDoFornecedor(idSolicitacao, idUsuario) {
  const [linhas] = await pool.query(
    `select ss.* from solicitacao_servico ss
       join servico s on s.id_servico = ss.id_servico
       join fornecedor f on f.id_fornecedor = s.id_fornecedor
      where ss.id_solicitacao = ? and f.id_usuario = ? and ss.status <> 'aguardando_organizador'`,
    [idSolicitacao, idUsuario],
  );
  return linhas[0] || null;
}

async function responder(idSolicitacao, status) {
  await pool.query(
    'update solicitacao_servico set status = ?, respondido_em = now() where id_solicitacao = ?',
    [status, idSolicitacao],
  );
}

module.exports = { recebidasPeloFornecedor, buscarDoFornecedor, responder };
