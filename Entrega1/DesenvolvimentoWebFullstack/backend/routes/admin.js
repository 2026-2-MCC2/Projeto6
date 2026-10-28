const express = require('express');
const pool = require('../config/bd');
const { autenticar, permitir } = require('../middleware/auth');
const { liberarSolicitacoesRetidas } = require('../lib/credenciamento');

const router = express.Router();

router.use(autenticar, permitir('adm'));

// --- eventos ---------------------------------------------------------------

router.get('/eventos', async (req, res) => {
  const status = req.query.status || 'em_analise';
  const [linhas] = await pool.query(
    `select e.*, u.nome as organizador, l.nome as local, l.cidade, c.nome as categoria,
            (select count(*) from lote where id_evento = e.id_evento) as total_lotes,
            (select coalesce(sum(valor), 0) from fornecedor_externo where id_evento = e.id_evento)
              as custo_fornecedores_externos,
            (select coalesce(sum(ss.valor_proposto), 0) from solicitacao_servico ss
              where ss.id_evento = e.id_evento and ss.status = 'aceita')
              as custo_fornecedores_plataforma
       from evento e
       join usuario u on u.id_usuario = e.id_organizador
       join local_evento l on l.id_local = e.id_local
       join categoria c on c.id_categoria = e.id_categoria
      where e.status = ?
      order by e.criado_em`,
    [status],
  );
  res.json(linhas);
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

module.exports = router;
