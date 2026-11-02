// SQL do planejamento do evento (FLX-02): itens de custo e outros custos,
// e as propostas que o organizador compara (FLX-05).
const pool = require('../config/bd');

async function localECategoria(idLocal, idCategoria) {
  const [linhas] = await pool.query(
    `select l.nome, l.cidade, l.estado, l.endereco, c.nome as categoria
       from local_evento l, categoria c
      where l.id_local = ? and c.id_categoria = ?`,
    [idLocal, idCategoria],
  );
  return linhas[0];
}

// os itens com quantas propostas validas cada um recebeu
async function itensComTotalDePropostas(idEvento) {
  const [linhas] = await pool.query(
    `select i.*,
            (select count(*) from proposta p
              where p.id_item = i.id_item and p.situacao <> 'cancelada') as total_propostas
       from item_custo i where i.id_evento = ? order by i.id_item`,
    [idEvento],
  );
  return linhas;
}

async function custos(idEvento) {
  const [linhas] = await pool.query('select * from custo_evento where id_evento = ? order by id_custo', [idEvento]);
  return linhas;
}

async function itensResumidos(idEvento) {
  const [linhas] = await pool.query(
    'select id_item, categoria, descricao, quantidade, custo_estimado from item_custo where id_evento = ? order by id_item',
    [idEvento],
  );
  return linhas;
}

// propostas validas (nao canceladas e dentro da validade), da menor para a
// maior. A selecionada aparece mesmo que a validade tenha passado.
async function propostasParaComparar(idEvento) {
  const [linhas] = await pool.query(
    `select p.id_proposta, p.id_item, p.valor, p.descricao, p.validade::text as validade,
            p.observacoes, p.situacao, p.atualizado_em,
            f.id_fornecedor, f.nome_empresa as fornecedor, f.cidade, f.estado
       from proposta p
       join item_custo i on i.id_item = p.id_item
       join fornecedor f on f.id_fornecedor = p.id_fornecedor
      where i.id_evento = ? and p.situacao <> 'cancelada'
        and (p.validade >= current_date or p.situacao = 'selecionada')
      order by p.valor, p.atualizado_em`,
    [idEvento],
  );
  return linhas;
}

// ---- itens de custo ----

async function itemDoEvento(idItem, idEvento) {
  const [linhas] = await pool.query('select * from item_custo where id_item = ? and id_evento = ?', [idItem, idEvento]);
  return linhas[0] || null;
}

async function criarItem(idEvento, { categoria, descricao, quantidade, custo_estimado }) {
  const [r] = await pool.query(
    'insert into item_custo (id_evento, categoria, descricao, quantidade, custo_estimado) values (?, ?, ?, ?, ?)',
    [idEvento, categoria, descricao, quantidade, custo_estimado],
  );
  return r.insertId;
}

async function atualizarItem(idItem, { categoria, descricao, quantidade, custo_estimado }) {
  await pool.query(
    'update item_custo set categoria = ?, descricao = ?, quantidade = ?, custo_estimado = ? where id_item = ?',
    [categoria, descricao, quantidade, custo_estimado, idItem],
  );
}

async function excluirItem(idItem) {
  await pool.query('delete from item_custo where id_item = ?', [idItem]);
}

// ---- outros custos ----

async function custoDoEvento(idCusto, idEvento) {
  const [linhas] = await pool.query('select * from custo_evento where id_custo = ? and id_evento = ?', [idCusto, idEvento]);
  return linhas[0] || null;
}

async function criarCusto(idEvento, { tipo, descricao, valor }) {
  const [r] = await pool.query(
    'insert into custo_evento (id_evento, tipo, descricao, valor) values (?, ?, ?, ?)',
    [idEvento, tipo, descricao, valor],
  );
  return r.insertId;
}

async function atualizarCusto(idCusto, { tipo, descricao, valor }) {
  await pool.query('update custo_evento set tipo = ?, descricao = ?, valor = ? where id_custo = ?', [
    tipo, descricao, valor, idCusto,
  ]);
}

async function excluirCusto(idCusto) {
  await pool.query('delete from custo_evento where id_custo = ?', [idCusto]);
}

module.exports = {
  localECategoria,
  itensComTotalDePropostas,
  custos,
  itensResumidos,
  propostasParaComparar,
  itemDoEvento,
  criarItem,
  atualizarItem,
  excluirItem,
  custoDoEvento,
  criarCusto,
  atualizarCusto,
  excluirCusto,
};
