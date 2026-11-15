// SQL dos eventos e do que pendura neles (lotes, fornecedores externos,
// pedidos de servico).
const pool = require('../config/bd');

async function buscar(id, conexao = pool) {
  const [linhas] = await conexao.query('select * from evento where id_evento = ?', [id]);
  return linhas[0] || null;
}

// vitrine publica: so os aprovados que ainda nao terminaram
async function listarPublicos() {
  const [linhas] = await pool.query(
    `select e.id_evento, e.nome, e.descricao, e.data_inicio, e.data_fim,
            c.nome as categoria, l.nome as local, l.cidade, l.estado,
            min(lo.preco) as menor_preco
       from evento e
       join categoria c on c.id_categoria = e.id_categoria
       join local_evento l on l.id_local = e.id_local
       left join lote lo on lo.id_evento = e.id_evento and now() <= lo.data_fim
      where e.status = 'aprovado' and e.data_fim >= now()
      group by e.id_evento, c.nome, l.nome, l.cidade, l.estado
      order by e.data_inicio`,
  );
  return linhas;
}

async function doOrganizador(idUsuario) {
  const [linhas] = await pool.query(
    `select e.*, l.nome as local, l.cidade, l.estado, c.nome as categoria,
            (select count(*) from item_custo where id_evento = e.id_evento) as total_itens
       from evento e
       join local_evento l on l.id_local = e.id_local
       join categoria c on c.id_categoria = e.id_categoria
      where e.id_organizador = ? order by e.criado_em desc`,
    [idUsuario],
  );
  return linhas;
}

// os lotes, se cada um esta aberto agora e quantos ingressos sobram
async function lotesComDisponiveis(idEvento) {
  const [linhas] = await pool.query(
    `select lo.*,
            (now() between lo.data_inicio and lo.data_fim)::int as aberto,
            (select count(*) from ingresso
              where id_lote = lo.id_lote and status = 'disponivel') as disponiveis
       from lote lo where lo.id_evento = ? order by lo.setor, lo.data_inicio`,
    [idEvento],
  );
  return linhas;
}

async function fornecedoresExternos(idEvento) {
  const [linhas] = await pool.query('select * from fornecedor_externo where id_evento = ?', [idEvento]);
  return linhas;
}

async function servicosSolicitados(idEvento) {
  const [linhas] = await pool.query(
    `select ss.id_solicitacao, ss.status, ss.valor_proposto,
            s.nome as servico, f.nome_empresa
       from solicitacao_servico ss
       join servico s on s.id_servico = ss.id_servico
       join fornecedor f on f.id_fornecedor = s.id_fornecedor
      where ss.id_evento = ?`,
    [idEvento],
  );
  return linhas;
}

async function categoriaExiste(idCategoria) {
  const [linhas] = await pool.query('select 1 from categoria where id_categoria = ?', [idCategoria]);
  return linhas.length > 0;
}

// o organizador digita o local. Se outro evento ja aconteceu no mesmo
// lugar, reaproveita a linha em vez de duplicar.
async function acharOuCriarLocal({ nome, cidade, estado, endereco }) {
  const [existe] = await pool.query(
    'select id_local from local_evento where nome = ? and cidade = ? and estado = ?',
    [nome, cidade, estado],
  );
  if (existe.length) return existe[0].id_local;

  const [r] = await pool.query(
    'insert into local_evento (nome, cidade, estado, endereco) values (?, ?, ?, ?)',
    [nome, cidade, estado, endereco],
  );
  return r.insertId;
}

// dados: as colunas ja validadas por regras/eventos.js
async function criar(idOrganizador, idLocal, dados) {
  const colunas = Object.keys(dados);
  const [r] = await pool.query(
    `insert into evento (id_organizador, id_local, ${colunas.join(', ')})
     values (?, ?, ${colunas.map(() => '?').join(', ')})`,
    [idOrganizador, idLocal, ...Object.values(dados)],
  );
  return r.insertId;
}

async function atualizar(idEvento, idLocal, dados) {
  await pool.query(
    `update evento set id_local = ?, ${Object.keys(dados).map((c) => `${c} = ?`).join(', ')}
      where id_evento = ?`,
    [idLocal, ...Object.values(dados), idEvento],
  );
}

async function contarPropostasSelecionadas(idEvento) {
  const [linhas] = await pool.query(
    `select count(*) as total from proposta p join item_custo i on i.id_item = p.id_item
      where i.id_evento = ? and p.situacao = 'selecionada'`,
    [idEvento],
  );
  return linhas[0].total;
}

// itens, custos e propostas saem junto (on delete cascade)
async function excluir(idEvento) {
  await pool.query('delete from evento where id_evento = ?', [idEvento]);
}

async function contarItens(idEvento) {
  const [linhas] = await pool.query('select count(*) as total from item_custo where id_evento = ?', [idEvento]);
  return linhas[0].total;
}

async function criarLote(idEvento, { setor, nome, preco, quantidade, margem_revenda, data_inicio, data_fim }) {
  const [r] = await pool.query(
    `insert into lote (id_evento, setor, nome, preco, quantidade, margem_revenda, data_inicio, data_fim)
     values (?, ?, ?, ?, ?, ?, ?, ?)`,
    [idEvento, setor, nome, preco, quantidade, margem_revenda, data_inicio, data_fim],
  );
  return r.insertId;
}

async function criarFornecedorExterno(idEvento, { nome, servico, valor, contato }) {
  const [r] = await pool.query(
    'insert into fornecedor_externo (id_evento, nome, servico, valor, contato) values (?, ?, ?, ?, ?)',
    [idEvento, nome, servico, valor, contato],
  );
  return r.insertId;
}

// o servico ativo com a situacao e a conta do fornecedor dono dele
async function servicoComFornecedor(idServico) {
  const [linhas] = await pool.query(
    `select s.id_servico, s.preco, f.situacao, f.id_usuario
       from servico s
       join fornecedor f on f.id_fornecedor = s.id_fornecedor
      where s.id_servico = ? and s.ativo = true`,
    [idServico],
  );
  return linhas[0] || null;
}

async function criarSolicitacao({ idEvento, idServico, mensagem, valorProposto, status }, conexao) {
  const [r] = await conexao.query(
    `insert into solicitacao_servico (id_evento, id_servico, mensagem, valor_proposto, status)
     values (?, ?, ?, ?, ?)`,
    [idEvento, idServico, mensagem, valorProposto, status],
  );
  return r.insertId;
}

async function mudarStatus(idEvento, status, conexao = pool) {
  await conexao.query('update evento set status = ? where id_evento = ?', [status, idEvento]);
}

// manda pro adm: limpa o motivo de uma recusa anterior
async function enviarParaAnalise(idEvento) {
  await pool.query("update evento set status = 'em_analise', motivo_recusa = null where id_evento = ?", [idEvento]);
}

// reabrir a cotacao desfaz as escolhas: as propostas voltam a "enviada"
async function desfazerEscolhas(idEvento, conexao = pool) {
  await conexao.query(
    `update proposta set situacao = 'enviada', atualizado_em = now()
      where situacao in ('selecionada', 'nao_selecionada')
        and id_item in (select id_item from item_custo where id_evento = ?)`,
    [idEvento],
  );
}

module.exports = {
  buscar,
  listarPublicos,
  doOrganizador,
  lotesComDisponiveis,
  fornecedoresExternos,
  servicosSolicitados,
  categoriaExiste,
  acharOuCriarLocal,
  criar,
  atualizar,
  contarPropostasSelecionadas,
  excluir,
  contarItens,
  criarLote,
  criarFornecedorExterno,
  servicoComFornecedor,
  criarSolicitacao,
  mudarStatus,
  enviarParaAnalise,
  desfazerEscolhas,
};
