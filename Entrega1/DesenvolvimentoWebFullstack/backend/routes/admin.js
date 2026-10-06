const express = require('express');
const pool = require('../config/bd');
const { autenticar, permitir } = require('../middleware/auth');

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

router.get('/credenciamentos', async (req, res) => {
  const status = req.query.status || 'em_analise';
  const [linhas] = await pool.query(
    `select c.*, f.nome_empresa, f.cnpj, f.descricao, u.nome, u.email,
            (select count(*) from servico where id_fornecedor = f.id_fornecedor and ativo = true)
              as total_servicos
       from credenciamento c
       join fornecedor f on f.id_fornecedor = c.id_fornecedor
       join usuario u on u.id_usuario = f.id_usuario
      where c.status = ?
      order by c.solicitado_em`,
    [status],
  );
  res.json(linhas);
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
  if (!aprovado && !req.body.observacao) {
    return res.status(400).json({ erro: 'escreva o motivo da recusa em "observacao"' });
  }

  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();
    await conexao.query(
      'update credenciamento set status = ?, observacao = ?, id_adm = ?, revisado_em = now() where id_credenciamento = ?',
      [aprovado ? 'aprovado' : 'recusado', req.body.observacao || null, req.usuario.id, pedido.id_credenciamento],
    );
    await conexao.query('update fornecedor set situacao = ? where id_fornecedor = ?', [
      aprovado ? 'credenciado' : 'recusado',
      pedido.id_fornecedor,
    ]);
    await conexao.commit();
    res.json({
      id_credenciamento: pedido.id_credenciamento,
      status: aprovado ? 'aprovado' : 'recusado',
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
