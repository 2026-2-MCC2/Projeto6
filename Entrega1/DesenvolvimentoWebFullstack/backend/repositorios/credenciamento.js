// SQL do credenciamento: perfil de organizador/fornecedor, categorias
// declaradas e os pedidos analisados pelo administrador.
const pool = require('../config/bd');
const chat = require('./chat');

// cada perfil tem a sua tabela. Os nomes vem desta lista fixa, nunca do usuario.
const PERFIL = {
  organizador: { tabela: 'organizador', id: 'id_organizador' },
  fornecedor: { tabela: 'fornecedor', id: 'id_fornecedor' },
};

// a linha de organizador/fornecedor da conta (null se ainda nao pediu)
async function buscarPerfil(usuario, conexao = pool) {
  const perfil = PERFIL[usuario.tipo];
  if (!perfil) return null;
  const [linhas] = await conexao.query(`select * from ${perfil.tabela} where id_usuario = ?`, [usuario.id]);
  return linhas[0] || null;
}

// situacao do credenciamento da conta logada. Sem linha na tabela do perfil,
// a pessoa ainda nao pediu: "nao_solicitado".
async function situacaoDe(usuario, conexao = pool) {
  const perfil = PERFIL[usuario.tipo];
  if (!perfil) return null;
  const [linhas] = await conexao.query(`select situacao from ${perfil.tabela} where id_usuario = ?`, [
    usuario.id,
  ]);
  return linhas[0]?.situacao || 'nao_solicitado';
}

// organizador: ids das categorias de evento; fornecedor: areas de atuacao
async function categoriasDe(tipo, linha) {
  if (tipo === 'organizador') {
    const [cats] = await pool.query(
      'select id_categoria from organizador_categoria where id_organizador = ? order by id_categoria',
      [linha.id_organizador],
    );
    return cats.map((c) => c.id_categoria);
  }
  const [areas] = await pool.query(
    'select categoria from fornecedor_atuacao where id_fornecedor = ? order by categoria',
    [linha.id_fornecedor],
  );
  return areas.map((a) => a.categoria);
}

// o pedido de credenciamento mais recente do perfil
async function ultimoPedido(tipo, idPerfil) {
  const { id } = PERFIL[tipo];
  const [linhas] = await pool.query(
    `select status, observacao, solicitado_em, revisado_em from credenciamento
      where ${id} = ? order by id_credenciamento desc limit 1`,
    [idPerfil],
  );
  return linhas[0] || null;
}

async function contarCategorias(ids) {
  const [linhas] = await pool.query('select count(*) as total from categoria where id_categoria in (?)', [ids]);
  return linhas[0].total;
}

// grava o perfil (cria ou atualiza), troca as categorias e abre um pedido
// "em_analise". Rodar dentro de uma transacao. Devolve o id do pedido.
async function enviar({ tipo, idUsuario, atual, dados, categorias }, conexao) {
  const { tabela, id } = PERFIL[tipo];
  const colunas = Object.keys(dados);

  let idPerfil;
  if (atual) {
    await conexao.query(
      `update ${tabela} set ${colunas.map((c) => `${c} = ?`).join(', ')}, situacao = 'em_analise'
        where ${id} = ?`,
      [...Object.values(dados), atual[id]],
    );
    idPerfil = atual[id];
  } else {
    const [r] = await conexao.query(
      `insert into ${tabela} (id_usuario, ${colunas.join(', ')}, situacao)
       values (?, ${colunas.map(() => '?').join(', ')}, 'em_analise')`,
      [idUsuario, ...Object.values(dados)],
    );
    idPerfil = r.insertId;
  }

  // categorias: apaga as antigas e grava as novas
  if (tipo === 'organizador') {
    await conexao.query('delete from organizador_categoria where id_organizador = ?', [idPerfil]);
    await conexao.query('insert into organizador_categoria (id_organizador, id_categoria) values ?', [
      categorias.map((c) => [idPerfil, Number(c)]),
    ]);
  } else {
    await conexao.query('delete from fornecedor_atuacao where id_fornecedor = ?', [idPerfil]);
    await conexao.query('insert into fornecedor_atuacao (id_fornecedor, categoria) values ?', [
      categorias.map((c) => [idPerfil, c]),
    ]);
  }

  const [pedido] = await conexao.query(`insert into credenciamento (${id}) values (?)`, [idPerfil]);
  return pedido.insertId;
}

// quando o organizador e aprovado, os pedidos de servico que estavam retidos
// chegam ao fornecedor: viram "em_analise" e ganham o chat.
// Rodar dentro da transacao de quem chamou.
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
    await chat.abrirDaSolicitacao(conexao, { ...sol, id_organizador: idUsuarioOrganizador });
  }
  return retidas.length;
}

module.exports = {
  PERFIL,
  buscarPerfil,
  situacaoDe,
  categoriasDe,
  ultimoPedido,
  contarCategorias,
  enviar,
  liberarSolicitacoesRetidas,
};
