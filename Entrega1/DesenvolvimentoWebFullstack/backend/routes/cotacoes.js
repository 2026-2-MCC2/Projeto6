// Cotacao e propostas (FLX-03 e FLX-04), do lado do fornecedor.
//   GET  /api/cotacoes                 eventos em cotacao
//   GET  /api/cotacoes/:idEvento       um evento, com os itens e a minha proposta de cada item
//   POST /api/itens/:id/propostas      envia proposta para um item
//   PUT  /api/propostas/:id            edita a minha proposta
//   POST /api/propostas/:id/cancelar   cancela a minha proposta
//   GET  /api/propostas/minhas         historico das minhas propostas
// So fornecedor credenciado (FLX-01). Os outros recebem 403.
const express = require('express');
const pool = require('../config/bd');
const { autenticar, permitir } = require('../middleware/auth');
const { exigirCredenciamento } = require('../lib/credenciamento');
const { texto } = require('../lib/validacao');

const router = express.Router();
const soFornecedorCredenciado = [
  autenticar,
  permitir('fornecedor'),
  exigirCredenciamento(['credenciado'], 'ver eventos em cotacao e enviar propostas'),
];

async function meuFornecedor(idUsuario) {
  const [linhas] = await pool.query('select id_fornecedor from fornecedor where id_usuario = ?', [idUsuario]);
  return linhas[0].id_fornecedor;
}

const CAMPOS_EVENTO = `e.id_evento, e.nome, e.descricao, e.data_inicio, e.data_fim, e.status,
  e.publico_minimo, e.publico_maximo, e.publico_esperado,
  l.nome as local, l.cidade, l.estado, c.nome as categoria, u.nome as organizador`;

router.get('/cotacoes', soFornecedorCredenciado, async (req, res) => {
  const idFornecedor = await meuFornecedor(req.usuario.id);
  const [linhas] = await pool.query(
    `select ${CAMPOS_EVENTO},
            (select count(*) from item_custo i where i.id_evento = e.id_evento) as total_itens,
            (select count(*) from proposta p join item_custo i on i.id_item = p.id_item
              where i.id_evento = e.id_evento and p.id_fornecedor = ? and p.situacao <> 'cancelada')
              as minhas_propostas
       from evento e
       join local_evento l on l.id_local = e.id_local
       join categoria c on c.id_categoria = e.id_categoria
       join usuario u on u.id_usuario = e.id_organizador
      where e.status = 'em_cotacao'
      order by e.data_inicio`,
    [idFornecedor],
  );
  res.json(linhas);
});

router.get('/cotacoes/:idEvento', soFornecedorCredenciado, async (req, res) => {
  const idFornecedor = await meuFornecedor(req.usuario.id);
  const [eventos] = await pool.query(
    `select ${CAMPOS_EVENTO}
       from evento e
       join local_evento l on l.id_local = e.id_local
       join categoria c on c.id_categoria = e.id_categoria
       join usuario u on u.id_usuario = e.id_organizador
      where e.id_evento = ? and e.status = 'em_cotacao'`,
    [req.params.idEvento],
  );
  if (!eventos[0]) return res.status(404).json({ erro: 'evento nao encontrado ou fora de cotacao' });

  // o fornecedor ve o item, mas nao o custo estimado do organizador
  const [itens] = await pool.query(
    `select i.id_item, i.categoria, i.descricao, i.quantidade,
            p.id_proposta, p.valor, p.descricao as proposta_descricao,
            -- data como texto (AAAA-MM-DD) pra nao mudar de dia com o fuso
            p.validade::text as validade,
            p.observacoes, p.situacao
       from item_custo i
       left join proposta p on p.id_item = i.id_item and p.id_fornecedor = ?
      where i.id_evento = ?
      order by i.id_item`,
    [idFornecedor, eventos[0].id_evento],
  );
  res.json({ ...eventos[0], itens });
});

// data de hoje no fuso do servidor (o processo roda no horario de Brasilia)
function hoje() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function validarProposta(corpo) {
  const d = {
    valor: Number(corpo.valor),
    descricao: texto(corpo.descricao),
    validade: texto(corpo.validade).slice(0, 10),
    observacoes: texto(corpo.observacoes) || null,
  };
  if (!(d.valor > 0)) return { erro: 'o valor precisa ser maior que zero' };
  d.valor = Number(d.valor.toFixed(2));
  if (!d.descricao) return { erro: 'descreva o que a proposta inclui' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.validade) || Number.isNaN(new Date(d.validade).getTime())) {
    return { erro: 'informe a validade da proposta (data)' };
  }
  if (d.validade < hoje()) return { erro: 'a validade nao pode ser anterior a hoje' };
  return { dados: d };
}

router.post('/itens/:id/propostas', soFornecedorCredenciado, async (req, res) => {
  const idFornecedor = await meuFornecedor(req.usuario.id);
  const [itens] = await pool.query(
    `select i.id_item, e.status from item_custo i join evento e on e.id_evento = i.id_evento
      where i.id_item = ?`,
    [req.params.id],
  );
  const item = itens[0];
  if (!item) return res.status(404).json({ erro: 'item nao encontrado' });
  if (item.status !== 'em_cotacao') {
    return res.status(409).json({ erro: 'esse evento nao esta recebendo propostas' });
  }
  const { erro, dados } = validarProposta(req.body);
  if (erro) return res.status(400).json({ erro });

  // proposta cancelada pode ser enviada de novo: reaproveita a linha
  const [existe] = await pool.query('select * from proposta where id_item = ? and id_fornecedor = ?', [
    item.id_item,
    idFornecedor,
  ]);
  if (existe[0] && existe[0].situacao !== 'cancelada') {
    return res.status(409).json({ erro: 'voce ja mandou proposta para esse item; edite a que existe' });
  }
  if (existe[0]) {
    await pool.query(
      `update proposta set valor = ?, descricao = ?, validade = ?, observacoes = ?,
              situacao = 'enviada', atualizado_em = now() where id_proposta = ?`,
      [dados.valor, dados.descricao, dados.validade, dados.observacoes, existe[0].id_proposta],
    );
    return res.status(201).json({ id_proposta: existe[0].id_proposta, ...dados, situacao: 'enviada' });
  }
  const [r] = await pool.query(
    `insert into proposta (id_item, id_fornecedor, valor, descricao, validade, observacoes)
     values (?, ?, ?, ?, ?, ?)`,
    [item.id_item, idFornecedor, dados.valor, dados.descricao, dados.validade, dados.observacoes],
  );
  res.status(201).json({ id_proposta: r.insertId, ...dados, situacao: 'enviada' });
});

// a minha proposta, com a situacao do evento. Responde 404/409 sozinho.
async function minhaPropostaEditavel(req, res) {
  const idFornecedor = await meuFornecedor(req.usuario.id);
  const [linhas] = await pool.query(
    `select p.*, e.status as status_evento
       from proposta p
       join item_custo i on i.id_item = p.id_item
       join evento e on e.id_evento = i.id_evento
      where p.id_proposta = ? and p.id_fornecedor = ?`,
    [req.params.id, idFornecedor],
  );
  const proposta = linhas[0];
  if (!proposta) {
    res.status(404).json({ erro: 'proposta nao encontrada' });
    return null;
  }
  if (proposta.situacao !== 'enviada' || proposta.status_evento !== 'em_cotacao') {
    res.status(409).json({ erro: 'so da pra mudar proposta enviada com a cotacao aberta' });
    return null;
  }
  return proposta;
}

router.put('/propostas/:id', soFornecedorCredenciado, async (req, res) => {
  const proposta = await minhaPropostaEditavel(req, res);
  if (!proposta) return;
  const { erro, dados } = validarProposta(req.body);
  if (erro) return res.status(400).json({ erro });
  await pool.query(
    `update proposta set valor = ?, descricao = ?, validade = ?, observacoes = ?, atualizado_em = now()
      where id_proposta = ?`,
    [dados.valor, dados.descricao, dados.validade, dados.observacoes, proposta.id_proposta],
  );
  res.json({ id_proposta: proposta.id_proposta, ...dados, situacao: 'enviada' });
});

router.post('/propostas/:id/cancelar', soFornecedorCredenciado, async (req, res) => {
  const proposta = await minhaPropostaEditavel(req, res);
  if (!proposta) return;
  await pool.query("update proposta set situacao = 'cancelada', atualizado_em = now() where id_proposta = ?", [
    proposta.id_proposta,
  ]);
  res.json({ id_proposta: proposta.id_proposta, situacao: 'cancelada' });
});

router.get('/propostas/minhas', soFornecedorCredenciado, async (req, res) => {
  const idFornecedor = await meuFornecedor(req.usuario.id);
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
  res.json(linhas);
});

module.exports = router;
