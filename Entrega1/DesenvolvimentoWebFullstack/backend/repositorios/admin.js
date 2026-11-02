// SQL do painel do administrador: eventos para analisar, credenciamentos,
// relatorios (FLX-07) e o historico de decisoes.
const pool = require('../config/bd');
const { SQL_CUSTO_CONSOLIDADO } = require('./orcamento');

// ---- eventos ----

// eventos com custo consolidado e andamento da cotacao. status null = todos.
async function eventosComResumo(status) {
  const [linhas] = await pool.query(
    `select e.*, u.nome as organizador, o.nome_organizacao,
            l.nome as local, l.cidade, l.estado, c.nome as categoria,
            (select count(*) from lote where id_evento = e.id_evento) as total_lotes,
            (select count(*) from item_custo where id_evento = e.id_evento) as total_itens,
            (select count(*) from proposta p join item_custo i on i.id_item = p.id_item
              where i.id_evento = e.id_evento and p.situacao <> 'cancelada') as propostas_recebidas,
            (select count(*) from proposta p join item_custo i on i.id_item = p.id_item
              where i.id_evento = e.id_evento and p.situacao = 'selecionada') as propostas_selecionadas,
            ${SQL_CUSTO_CONSOLIDADO} as custo_consolidado,
            (select coalesce(sum(valor), 0) from fornecedor_externo where id_evento = e.id_evento)
              as custo_fornecedores_externos,
            (select coalesce(sum(ss.valor_proposto), 0) from solicitacao_servico ss
              where ss.id_evento = e.id_evento and ss.status = 'aceita')
              as custo_fornecedores_plataforma
       from evento e
       join usuario u on u.id_usuario = e.id_organizador
       left join organizador o on o.id_usuario = e.id_organizador
       join local_evento l on l.id_local = e.id_local
       join categoria c on c.id_categoria = e.id_categoria
      where ${status ? 'e.status = ?' : 'true'}
      order by e.criado_em`,
    status ? [status] : [],
  );
  return linhas;
}

// o evento com organizador, local, categoria e quem revisou
async function eventoCompleto(idEvento) {
  const [linhas] = await pool.query(
    `select e.*, u.nome as organizador, u.email, o.nome_organizacao,
            l.nome as local, l.cidade, l.estado, l.endereco, c.nome as categoria,
            adm.nome as revisado_por
       from evento e
       join usuario u on u.id_usuario = e.id_organizador
       left join organizador o on o.id_usuario = e.id_organizador
       join local_evento l on l.id_local = e.id_local
       join categoria c on c.id_categoria = e.id_categoria
       left join usuario adm on adm.id_usuario = e.id_adm_revisor
      where e.id_evento = ?`,
    [idEvento],
  );
  return linhas[0] || null;
}

// por item: quantas propostas validas chegaram e a de menor valor
async function resumoDePropostasPorItem(idEvento) {
  const [linhas] = await pool.query(
    `select i.id_item, count(p.id_proposta) as recebidas, min(p.valor) as menor_valor
       from item_custo i
       left join proposta p on p.id_item = i.id_item and p.situacao <> 'cancelada'
      where i.id_evento = ? group by i.id_item`,
    [idEvento],
  );
  return linhas;
}

async function lotes(idEvento, conexao = pool) {
  const [linhas] = await conexao.query('select * from lote where id_evento = ? order by setor, data_inicio', [idEvento]);
  return linhas;
}

// aprova o evento registrando quem e quando. Rodar dentro de uma transacao.
async function aprovarEvento(idEvento, idAdm, conexao) {
  await conexao.query(
    `update evento set status = 'aprovado', id_adm_revisor = ?, revisado_em = now(),
            motivo_recusa = null
      where id_evento = ?`,
    [idAdm, idEvento],
  );
}

// grava os ingressos em blocos de 1000, pra nao disparar milhares de inserts
async function inserirIngressos(linhas, conexao) {
  for (let i = 0; i < linhas.length; i += 1000) {
    await conexao.query(
      'insert into ingresso (id_evento, id_lote, id_vendedor, setor, tipo, codigo, preco) values ?',
      [linhas.slice(i, i + 1000)],
    );
  }
}

// recusa so se o evento estiver em analise. Devolve false se nao estava.
async function recusarEvento(idEvento, idAdm, motivo) {
  const [r] = await pool.query(
    `update evento set status = 'recusado', motivo_recusa = ?, id_adm_revisor = ?, revisado_em = now()
      where id_evento = ? and status = 'em_analise'`,
    [motivo, idAdm, idEvento],
  );
  return r.affectedRows > 0;
}

// ---- credenciamento ----

// tudo o que a pessoa enviou, pro adm decidir
const CONSULTA_CREDENCIAMENTO = {
  organizador: `
    select c.id_credenciamento, c.status, c.observacao, c.solicitado_em, c.revisado_em,
           adm.nome as analisado_por,
           o.id_organizador, o.tipo_pessoa, o.nome_organizacao, o.razao_social, o.cnpj,
           o.cidade, o.estado, o.telefone, o.descricao, o.link, o.publico_medio,
           u.nome, u.email, u.cpf,
           array(select ca.nome from organizador_categoria oc
                   join categoria ca on ca.id_categoria = oc.id_categoria
                  where oc.id_organizador = o.id_organizador order by ca.nome) as categorias
      from credenciamento c
      join organizador o on o.id_organizador = c.id_organizador
      join usuario u on u.id_usuario = o.id_usuario
      left join usuario adm on adm.id_usuario = c.id_adm
     where c.status = ?
     order by c.solicitado_em`,
  fornecedor: `
    select c.id_credenciamento, c.status, c.observacao, c.solicitado_em, c.revisado_em,
           adm.nome as analisado_por,
           f.id_fornecedor, f.nome_empresa, f.razao_social, f.cnpj,
           f.cidade, f.estado, f.telefone, f.descricao, f.link,
           u.nome, u.email, u.cpf,
           array(select fa.categoria from fornecedor_atuacao fa
                  where fa.id_fornecedor = f.id_fornecedor order by fa.categoria) as categorias,
           (select count(*) from servico where id_fornecedor = f.id_fornecedor and ativo = true)
             as total_servicos
      from credenciamento c
      join fornecedor f on f.id_fornecedor = c.id_fornecedor
      join usuario u on u.id_usuario = f.id_usuario
      left join usuario adm on adm.id_usuario = c.id_adm
     where c.status = ?
     order by c.solicitado_em`,
};

const PERFIS_CREDENCIAMENTO = Object.keys(CONSULTA_CREDENCIAMENTO);

async function credenciamentos(perfil, status) {
  const [linhas] = await pool.query(CONSULTA_CREDENCIAMENTO[perfil], [status]);
  return linhas;
}

async function pedidoDeCredenciamento(id) {
  const [linhas] = await pool.query('select * from credenciamento where id_credenciamento = ?', [id]);
  return linhas[0] || null;
}

// fica gravado quem analisou e quando (rastreabilidade). Rodar em transacao.
async function registrarDecisao({ idPedido, status, observacao, idAdm }, conexao) {
  await conexao.query(
    'update credenciamento set status = ?, observacao = ?, id_adm = ?, revisado_em = now() where id_credenciamento = ?',
    [status, observacao, idAdm, idPedido],
  );
}

async function mudarSituacaoOrganizador(idOrganizador, situacao, conexao) {
  await conexao.query('update organizador set situacao = ? where id_organizador = ?', [situacao, idOrganizador]);
}

async function mudarSituacaoFornecedor(idFornecedor, situacao, conexao) {
  await conexao.query('update fornecedor set situacao = ? where id_fornecedor = ?', [situacao, idFornecedor]);
}

async function usuarioDoOrganizador(idOrganizador, conexao) {
  const [linhas] = await conexao.query('select id_usuario from organizador where id_organizador = ?', [idOrganizador]);
  return linhas[0].id_usuario;
}

// ---- relatorios (FLX-07) ----

// contagem por chave, ex.: { organizador: 3, fornecedor: 5 }
async function contarPor(tabela, coluna) {
  const [linhas] = await pool.query(`select ${coluna} as chave, count(*) as total from ${tabela} group by ${coluna}`);
  return Object.fromEntries(linhas.map((l) => [l.chave, Number(l.total)]));
}

const contagens = () => Promise.all([
  contarPor('usuario', 'tipo'),
  contarPor('organizador', 'situacao'),
  contarPor('fornecedor', 'situacao'),
  contarPor('evento', 'status'),
  contarPor('proposta', 'situacao'),
]);

// contas de organizador/fornecedor que nunca pediram credenciamento
async function semCredenciamento() {
  const [linhas] = await pool.query(
    `select
       (select count(*) from usuario u where u.tipo = 'organizador'
          and not exists (select 1 from organizador o where o.id_usuario = u.id_usuario)) as organizadores,
       (select count(*) from usuario u where u.tipo = 'fornecedor'
          and not exists (select 1 from fornecedor f where f.id_usuario = u.id_usuario)) as fornecedores`,
  );
  return linhas[0];
}

async function valoresDosEventos() {
  const [linhas] = await pool.query(
    `select count(*) as eventos,
            coalesce(sum(${SQL_CUSTO_CONSOLIDADO}), 0) as custo_total,
            coalesce(avg(${SQL_CUSTO_CONSOLIDADO}), 0) as custo_medio,
            coalesce(sum(case when e.status = 'aprovado' then ${SQL_CUSTO_CONSOLIDADO} end), 0) as custo_aprovados
       from evento e`,
  );
  return linhas[0];
}

async function valoresDasPropostas() {
  const [linhas] = await pool.query(
    `select coalesce(sum(valor), 0) as selecionadas, coalesce(avg(valor), 0) as media
       from proposta where situacao = 'selecionada'`,
  );
  return linhas[0];
}

// historico das decisoes do adm: credenciamentos e eventos analisados,
// com quem decidiu, quando e o motivo (rastreabilidade, 5.3)
async function historicoDeDecisoes() {
  const [linhas] = await pool.query(
    `select 'credenciamento' as tipo, c.id_credenciamento as id,
            case when c.id_organizador is not null then 'organizador' else 'fornecedor' end as perfil,
            coalesce(o.nome_organizacao, f.nome_empresa) as nome,
            u.nome as responsavel, c.status as decisao, c.observacao as motivo,
            adm.nome as decidido_por, c.revisado_em as decidido_em
       from credenciamento c
       left join organizador o on o.id_organizador = c.id_organizador
       left join fornecedor f on f.id_fornecedor = c.id_fornecedor
       join usuario u on u.id_usuario = coalesce(o.id_usuario, f.id_usuario)
       left join usuario adm on adm.id_usuario = c.id_adm
      where c.status <> 'em_analise'
     union all
     select 'evento' as tipo, e.id_evento as id, 'evento' as perfil, e.nome as nome,
            u.nome as responsavel, e.status as decisao, e.motivo_recusa as motivo,
            adm.nome as decidido_por, e.revisado_em as decidido_em
       from evento e
       join usuario u on u.id_usuario = e.id_organizador
       left join usuario adm on adm.id_usuario = e.id_adm_revisor
      where e.status in ('aprovado', 'recusado') and e.revisado_em is not null
      order by decidido_em desc`,
  );
  return linhas;
}

module.exports = {
  eventosComResumo,
  eventoCompleto,
  resumoDePropostasPorItem,
  lotes,
  aprovarEvento,
  inserirIngressos,
  recusarEvento,
  PERFIS_CREDENCIAMENTO,
  credenciamentos,
  pedidoDeCredenciamento,
  registrarDecisao,
  mudarSituacaoOrganizador,
  mudarSituacaoFornecedor,
  usuarioDoOrganizador,
  contagens,
  semCredenciamento,
  valoresDosEventos,
  valoresDasPropostas,
  historicoDeDecisoes,
};
