const express = require('express');
const pool = require('../config/bd');
const { autenticar, permitir } = require('../middleware/auth');
const { liberarSolicitacoesRetidas } = require('../lib/credenciamento');
const { orcamentoDoEvento, SQL_CUSTO_CONSOLIDADO } = require('../lib/orcamento');

const router = express.Router();

router.use(autenticar, permitir('adm'));

// --- eventos ---------------------------------------------------------------

// lista de eventos com custo consolidado e andamento da cotacao (FLX-07).
// ?status=em_analise (padrao), em_cotacao, aprovado... ou ?status=todos
router.get('/eventos', async (req, res) => {
  const status = req.query.status || 'em_analise';
  const todos = status === 'todos';
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
      where ${todos ? 'true' : 'e.status = ?'}
      order by e.criado_em`,
    todos ? [] : [status],
  );
  res.json(linhas);
});

// um evento por inteiro, para o adm decidir: itens, outros custos, orcamento
// consolidado e o andamento da cotacao
router.get('/eventos/:id', async (req, res) => {
  const [eventos] = await pool.query(
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
    [req.params.id],
  );
  const evento = eventos[0];
  if (!evento) return res.status(404).json({ erro: 'evento nao encontrado' });

  const [[custos], [propostas], [lotes], [externos]] = await Promise.all([
    pool.query('select * from custo_evento where id_evento = ? order by id_custo', [evento.id_evento]),
    pool.query(
      `select i.id_item, count(p.id_proposta) as recebidas, min(p.valor) as menor_valor
         from item_custo i
         left join proposta p on p.id_item = i.id_item and p.situacao <> 'cancelada'
        where i.id_evento = ? group by i.id_item`,
      [evento.id_evento],
    ),
    pool.query('select * from lote where id_evento = ? order by setor, data_inicio', [evento.id_evento]),
    pool.query('select * from fornecedor_externo where id_evento = ?', [evento.id_evento]),
  ]);

  const orcamento = await orcamentoDoEvento(evento.id_evento);
  const porItem = Object.fromEntries(propostas.map((p) => [p.id_item, p]));
  orcamento.itens = orcamento.itens.map((i) => ({
    ...i,
    propostas_recebidas: Number(porItem[i.id_item]?.recebidas || 0),
    menor_proposta: porItem[i.id_item]?.menor_valor ?? null,
  }));

  res.json({ ...evento, custos, orcamento, lotes, fornecedores_externos: externos });
});

// gera um ingresso por unidade de cada lote. codigo no formato TT-evento-lote-numero.
async function gerarIngressos(conexao, evento) {
  const [lotes] = await conexao.query('select * from lote where id_evento = ?', [evento.id_evento]);
  let total = 0;

  for (const lote of lotes) {
    const linhas = [];
    for (let i = 1; i <= lote.quantidade; i += 1) {
      linhas.push([
        evento.id_evento,
        lote.id_lote,
        evento.id_organizador,
        lote.setor,
        'inteira',
        `TT-${evento.id_evento}-${lote.id_lote}-${String(i).padStart(5, '0')}`,
        lote.preco,
      ]);
    }
    // em bloco pra nao disparar milhares de inserts separados
    for (let i = 0; i < linhas.length; i += 1000) {
      await conexao.query(
        'insert into ingresso (id_evento, id_lote, id_vendedor, setor, tipo, codigo, preco) values ?',
        [linhas.slice(i, i + 1000)],
      );
    }
    total += linhas.length;
  }
  return total;
}

router.post('/eventos/:id/aprovar', async (req, res) => {
  const [linhas] = await pool.query("select * from evento where id_evento = ?", [req.params.id]);
  const evento = linhas[0];

  if (!evento) return res.status(404).json({ erro: 'evento nao encontrado' });
  if (evento.status !== 'em_analise') {
    return res.status(409).json({ erro: `so da pra aprovar evento em analise (esse esta "${evento.status}")` });
  }

  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();
    await conexao.query(
      `update evento set status = 'aprovado', id_adm_revisor = ?, revisado_em = now(),
              motivo_recusa = null
        where id_evento = ?`,
      [req.usuario.id, evento.id_evento],
    );
    const ingressos = await gerarIngressos(conexao, evento);
    await conexao.commit();
    res.json({ id_evento: evento.id_evento, status: 'aprovado', ingressos_gerados: ingressos });
  } catch (e) {
    await conexao.rollback();
    throw e;
  } finally {
    conexao.release();
  }
});

router.post('/eventos/:id/recusar', async (req, res) => {
  const { motivo } = req.body;
  if (!motivo) return res.status(400).json({ erro: 'escreva o motivo da recusa' });

  const [r] = await pool.query(
    `update evento set status = 'recusado', motivo_recusa = ?, id_adm_revisor = ?, revisado_em = now()
      where id_evento = ? and status = 'em_analise'`,
    [motivo, req.usuario.id, req.params.id],
  );
  if (!r.affectedRows) {
    return res.status(409).json({ erro: 'evento nao encontrado ou nao esta em analise' });
  }
  res.json({ id_evento: Number(req.params.id), status: 'recusado', motivo });
});

// --- credenciamento --------------------------------------------------------

// tudo o que a pessoa enviou, pro adm decidir. ?perfil=organizador|fornecedor
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

router.get('/credenciamentos', async (req, res) => {
  const perfil = req.query.perfil || 'fornecedor';
  const status = req.query.status || 'em_analise';
  if (!CONSULTA_CREDENCIAMENTO[perfil]) {
    return res.status(400).json({ erro: 'perfil precisa ser organizador ou fornecedor' });
  }
  const [linhas] = await pool.query(CONSULTA_CREDENCIAMENTO[perfil], [status]);
  res.json(linhas.map((l) => ({ ...l, perfil })));
});

async function responderCredenciamento(req, res, aprovado) {
  const [linhas] = await pool.query('select * from credenciamento where id_credenciamento = ?', [
    req.params.id,
  ]);
  const pedido = linhas[0];

  if (!pedido) return res.status(404).json({ erro: 'solicitacao nao encontrada' });
  if (pedido.status !== 'em_analise') {
    return res.status(409).json({ erro: 'essa solicitacao ja foi analisada' });
  }
  const motivo = String(req.body.observacao || '').trim();
  if (!aprovado && !motivo) {
    return res.status(400).json({ erro: 'escreva o motivo da recusa em "observacao"' });
  }

  const perfil = pedido.id_organizador ? 'organizador' : 'fornecedor';
  const situacao = aprovado ? 'credenciado' : 'recusado';

  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();
    // fica gravado quem analisou e quando (rastreabilidade)
    await conexao.query(
      'update credenciamento set status = ?, observacao = ?, id_adm = ?, revisado_em = now() where id_credenciamento = ?',
      [aprovado ? 'aprovado' : 'recusado', motivo || null, req.usuario.id, pedido.id_credenciamento],
    );

    let liberadas = 0;
    if (perfil === 'organizador') {
      await conexao.query('update organizador set situacao = ? where id_organizador = ?', [
        situacao,
        pedido.id_organizador,
      ]);
      // aprovado: os pedidos de servico que estavam retidos chegam aos fornecedores
      if (aprovado) {
        const [[org]] = await conexao.query('select id_usuario from organizador where id_organizador = ?', [
          pedido.id_organizador,
        ]);
        liberadas = await liberarSolicitacoesRetidas(conexao, org.id_usuario);
      }
    } else {
      await conexao.query('update fornecedor set situacao = ? where id_fornecedor = ?', [
        situacao,
        pedido.id_fornecedor,
      ]);
    }

    await conexao.commit();
    res.json({
      id_credenciamento: pedido.id_credenciamento,
      perfil,
      status: aprovado ? 'aprovado' : 'recusado',
      solicitacoes_liberadas: liberadas,
    });
  } catch (e) {
    await conexao.rollback();
    throw e;
  } finally {
    conexao.release();
  }
}

router.post('/credenciamentos/:id/aprovar', (req, res) => responderCredenciamento(req, res, true));
router.post('/credenciamentos/:id/recusar', (req, res) => responderCredenciamento(req, res, false));

// --- relatorios (FLX-07) ----------------------------------------------------

// numeros gerais da plataforma. Com o banco vazio, tudo vem zero.
router.get('/relatorios', async (req, res) => {
  const contar = async (sql) => {
    const [linhas] = await pool.query(sql);
    return Object.fromEntries(linhas.map((l) => [l.chave, Number(l.total)]));
  };

  const [usuarios, organizadores, fornecedores, eventos, propostas] = await Promise.all([
    contar('select tipo as chave, count(*) as total from usuario group by tipo'),
    contar('select situacao as chave, count(*) as total from organizador group by situacao'),
    contar('select situacao as chave, count(*) as total from fornecedor group by situacao'),
    contar('select status as chave, count(*) as total from evento group by status'),
    contar('select situacao as chave, count(*) as total from proposta group by situacao'),
  ]);
  const [semCred] = await pool.query(
    `select
       (select count(*) from usuario u where u.tipo = 'organizador'
          and not exists (select 1 from organizador o where o.id_usuario = u.id_usuario)) as organizadores,
       (select count(*) from usuario u where u.tipo = 'fornecedor'
          and not exists (select 1 from fornecedor f where f.id_usuario = u.id_usuario)) as fornecedores`,
  );
  const [valores] = await pool.query(
    `select count(*) as eventos,
            coalesce(sum(${SQL_CUSTO_CONSOLIDADO}), 0) as custo_total,
            coalesce(avg(${SQL_CUSTO_CONSOLIDADO}), 0) as custo_medio,
            coalesce(sum(case when e.status = 'aprovado' then ${SQL_CUSTO_CONSOLIDADO} end), 0) as custo_aprovados
       from evento e`,
  );
  const [propostaValores] = await pool.query(
    `select coalesce(sum(valor), 0) as selecionadas, coalesce(avg(valor), 0) as media
       from proposta where situacao = 'selecionada'`,
  );

  // quem nunca pediu credenciamento nao tem linha na tabela do perfil
  if (semCred[0].organizadores) organizadores.nao_solicitado = Number(semCred[0].organizadores);
  if (semCred[0].fornecedores) fornecedores.nao_solicitado = Number(semCred[0].fornecedores);

  const dinheiro = (v) => Number(Number(v || 0).toFixed(2));
  res.json({
    usuarios,
    credenciamento: { organizador: organizadores, fornecedor: fornecedores },
    eventos,
    propostas,
    valores: {
      eventos: Number(valores[0].eventos),
      custo_consolidado_total: dinheiro(valores[0].custo_total),
      custo_consolidado_medio: dinheiro(valores[0].custo_medio),
      custo_consolidado_aprovados: dinheiro(valores[0].custo_aprovados),
      propostas_selecionadas_total: dinheiro(propostaValores[0].selecionadas),
      proposta_selecionada_media: dinheiro(propostaValores[0].media),
    },
  });
});

// historico das decisoes do adm: credenciamentos e eventos analisados,
// com quem decidiu, quando e o motivo (rastreabilidade, 5.3)
router.get('/aprovacoes', async (req, res) => {
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
  res.json(linhas);
});

module.exports = router;
