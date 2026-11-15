// SQL das propostas dos fornecedores (FLX-04) e da escolha delas (FLX-05).
const pool = require('../config/bd');

// a proposta com o evento dela e se ja venceu
async function comEvento(idProposta) {
  const [linhas] = await pool.query(
    `select p.*, (p.validade < current_date) as vencida,
            e.id_evento, e.id_organizador, e.status as status_evento
       from proposta p
       join item_custo i on i.id_item = p.id_item
       join evento e on e.id_evento = i.id_evento
      where p.id_proposta = ?`,
    [idProposta],
  );
  return linhas[0] || null;
}

// escolhe a proposta: as outras validas do mesmo item viram "nao selecionada".
// Rodar dentro de uma transacao.
async function selecionar(proposta, conexao) {
  await conexao.query(
    `update proposta set situacao = 'nao_selecionada', atualizado_em = now()
      where id_item = ? and id_proposta <> ? and situacao in ('enviada', 'selecionada')`,
    [proposta.id_item, proposta.id_proposta],
  );
  await conexao.query(
    "update proposta set situacao = 'selecionada', atualizado_em = now() where id_proposta = ?",
    [proposta.id_proposta],
  );
}

// o item volta a nao ter escolha: todas as propostas validas voltam a "enviada"
async function desmarcarItem(idItem) {
  await pool.query(
    `update proposta set situacao = 'enviada', atualizado_em = now()
      where id_item = ? and situacao in ('selecionada', 'nao_selecionada')`,
    [idItem],
  );
}

// ---- lado do fornecedor (FLX-04) ----

// o item com a situacao do evento dele
async function itemComStatusEvento(idItem) {
  const [linhas] = await pool.query(
    `select i.id_item, e.status from item_custo i join evento e on e.id_evento = i.id_evento
      where i.id_item = ?`,
    [idItem],
  );
  return linhas[0] || null;
}

async function doFornecedorNoItem(idItem, idFornecedor) {
  const [linhas] = await pool.query('select * from proposta where id_item = ? and id_fornecedor = ?', [
    idItem,
    idFornecedor,
  ]);
  return linhas[0] || null;
}

async function criar({ idItem, idFornecedor, valor, descricao, validade, observacoes }) {
  const [r] = await pool.query(
    `insert into proposta (id_item, id_fornecedor, valor, descricao, validade, observacoes)
     values (?, ?, ?, ?, ?, ?)`,
    [idItem, idFornecedor, valor, descricao, validade, observacoes],
  );
  return r.insertId;
}

// troca valor, descricao, validade e observacoes. Com reenviar, a proposta
// (que estava cancelada) volta a "enviada".
async function atualizar(idProposta, { valor, descricao, validade, observacoes }, { reenviar = false } = {}) {
  await pool.query(
    `update proposta set valor = ?, descricao = ?, validade = ?, observacoes = ?,
            ${reenviar ? "situacao = 'enviada', " : ''}atualizado_em = now()
      where id_proposta = ?`,
    [valor, descricao, validade, observacoes, idProposta],
  );
}

// a proposta do fornecedor com a situacao do evento
async function doFornecedorComEvento(idProposta, idFornecedor) {
  const [linhas] = await pool.query(
    `select p.*, e.status as status_evento
       from proposta p
       join item_custo i on i.id_item = p.id_item
       join evento e on e.id_evento = i.id_evento
      where p.id_proposta = ? and p.id_fornecedor = ?`,
    [idProposta, idFornecedor],
  );
  return linhas[0] || null;
}

async function cancelar(idProposta) {
  await pool.query("update proposta set situacao = 'cancelada', atualizado_em = now() where id_proposta = ?", [
    idProposta,
  ]);
}

// historico das propostas do fornecedor, da mais recente para a mais antiga
async function historicoDoFornecedor(idFornecedor) {
  const [linhas] = await pool.query(
    `select p.*, p.validade::text as validade, i.descricao as item, i.categoria, i.quantidade,
            e.id_evento, e.nome as evento, e.status as status_evento, e.data_inicio,
            (p.validade < current_date) as vencida
       from proposta p
       join item_custo i on i.id_item = p.id_item
       join evento e on e.id_evento = i.id_evento
      where p.id_fornecedor = ?
      order by p.atualizado_em desc`,
    [idFornecedor],
  );
  return linhas;
}

module.exports = {
  comEvento,
  selecionar,
  desmarcarItem,
  itemComStatusEvento,
  doFornecedorNoItem,
  criar,
  atualizar,
  doFornecedorComEvento,
  cancelar,
  historicoDoFornecedor,
};
