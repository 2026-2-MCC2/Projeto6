// Planejamento do evento (FLX-02): itens de custo e outros custos.
// Tudo aqui e so do organizador dono do evento.
//   GET    /api/eventos/:id/planejamento
//   POST   /api/eventos/:id/itens          PUT/DELETE /api/eventos/:id/itens/:idItem
//   POST   /api/eventos/:id/custos         PUT/DELETE /api/eventos/:id/custos/:idCusto
const express = require('express');
const pool = require('../config/bd');
const { autenticar, permitir } = require('../middleware/auth');
const { eventoDoOrganizador, podeMexer } = require('../lib/eventos');
const { texto } = require('../lib/validacao');

const router = express.Router();
const soDono = [autenticar, permitir('organizador')];

const CATEGORIAS_ITEM = ['iluminacao', 'comida', 'bebida', 'seguranca', 'estrutura', 'outros'];
const TIPOS_CUSTO = ['fiscal', 'operacional', 'variavel', 'outro'];

const dinheiro = (v) => Number(Number(v || 0).toFixed(2));

// tudo o que a tela do evento precisa, numa chamada so
router.get('/:id/planejamento', soDono, async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento) return;

  const [[local], [itens], [custos]] = await Promise.all([
    pool.query(
      `select l.nome, l.cidade, l.estado, l.endereco, c.nome as categoria
         from local_evento l, categoria c
        where l.id_local = ? and c.id_categoria = ?`,
      [evento.id_local, evento.id_categoria],
    ),
    pool.query(
      `select i.*,
              (select count(*) from proposta p
                where p.id_item = i.id_item and p.situacao <> 'cancelada') as total_propostas
         from item_custo i where i.id_evento = ? order by i.id_item`,
      [evento.id_evento],
    ),
    pool.query('select * from custo_evento where id_evento = ? order by id_custo', [evento.id_evento]),
  ]);

  const somar = (lista, campo) => dinheiro(lista.reduce((s, x) => s + Number(x[campo]), 0));
  const porTipo = Object.fromEntries(
    TIPOS_CUSTO.map((t) => [t, somar(custos.filter((c) => c.tipo === t), 'valor')]),
  );

  res.json({
    ...evento,
    local: local[0],
    itens,
    custos,
    totais: {
      itens_estimado: somar(itens, 'custo_estimado'),
      custos: somar(custos, 'valor'),
      custos_por_tipo: porTipo,
    },
  });
});

// --- itens de custo --------------------------------------------------------

function validarItem(corpo) {
  const d = {
    categoria: corpo.categoria,
    descricao: texto(corpo.descricao),
    quantidade: Number(corpo.quantidade),
    custo_estimado: Number(corpo.custo_estimado),
  };
  if (!CATEGORIAS_ITEM.includes(d.categoria)) {
    return { erro: `categoria precisa ser uma de: ${CATEGORIAS_ITEM.join(', ')}` };
  }
  if (!d.descricao) return { erro: 'descreva o item' };
  if (!Number.isInteger(d.quantidade) || d.quantidade <= 0) {
    return { erro: 'a quantidade precisa ser um numero inteiro maior que zero' };
  }
  if (corpo.custo_estimado === undefined || corpo.custo_estimado === '' || !(d.custo_estimado >= 0)) {
    return { erro: 'o custo estimado precisa ser um valor maior ou igual a zero' };
  }
  d.custo_estimado = dinheiro(d.custo_estimado);
  return { dados: d };
}

// busca a linha filha (item ou custo) garantindo que e deste evento
async function filhoDoEvento(tabela, chave, id, evento, res) {
  const [linhas] = await pool.query(`select * from ${tabela} where ${chave} = ? and id_evento = ?`, [
    id,
    evento.id_evento,
  ]);
  if (!linhas[0]) res.status(404).json({ erro: 'registro nao encontrado neste evento' });
  return linhas[0] || null;
}

router.post('/:id/itens', soDono, async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento || !podeMexer(evento, 'itens', res)) return;
  const { erro, dados } = validarItem(req.body);
  if (erro) return res.status(400).json({ erro });

  const [r] = await pool.query(
    'insert into item_custo (id_evento, categoria, descricao, quantidade, custo_estimado) values (?, ?, ?, ?, ?)',
    [evento.id_evento, dados.categoria, dados.descricao, dados.quantidade, dados.custo_estimado],
  );
  res.status(201).json({ id_item: r.insertId, id_evento: evento.id_evento, ...dados });
});

router.put('/:id/itens/:idItem', soDono, async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento || !podeMexer(evento, 'itens', res)) return;
  const item = await filhoDoEvento('item_custo', 'id_item', req.params.idItem, evento, res);
  if (!item) return;
  const { erro, dados } = validarItem(req.body);
  if (erro) return res.status(400).json({ erro });

  await pool.query(
    'update item_custo set categoria = ?, descricao = ?, quantidade = ?, custo_estimado = ? where id_item = ?',
    [dados.categoria, dados.descricao, dados.quantidade, dados.custo_estimado, item.id_item],
  );
  res.json({ id_item: item.id_item, id_evento: evento.id_evento, ...dados });
});

router.delete('/:id/itens/:idItem', soDono, async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento || !podeMexer(evento, 'itens', res)) return;
  const item = await filhoDoEvento('item_custo', 'id_item', req.params.idItem, evento, res);
  if (!item) return;
  await pool.query('delete from item_custo where id_item = ?', [item.id_item]);
  res.json({ id_item: item.id_item, excluido: true });
});

// --- outros custos (fiscais, operacionais, variaveis) ----------------------

function validarCusto(corpo) {
  const d = { tipo: corpo.tipo, descricao: texto(corpo.descricao), valor: Number(corpo.valor) };
  if (!TIPOS_CUSTO.includes(d.tipo)) return { erro: `tipo precisa ser um de: ${TIPOS_CUSTO.join(', ')}` };
  if (!d.descricao) return { erro: 'descreva o custo' };
  if (corpo.valor === undefined || corpo.valor === '' || !(d.valor >= 0)) {
    return { erro: 'o valor precisa ser maior ou igual a zero' };
  }
  d.valor = dinheiro(d.valor);
  return { dados: d };
}

router.post('/:id/custos', soDono, async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento || !podeMexer(evento, 'custos', res)) return;
  const { erro, dados } = validarCusto(req.body);
  if (erro) return res.status(400).json({ erro });

  const [r] = await pool.query(
    'insert into custo_evento (id_evento, tipo, descricao, valor) values (?, ?, ?, ?)',
    [evento.id_evento, dados.tipo, dados.descricao, dados.valor],
  );
  res.status(201).json({ id_custo: r.insertId, id_evento: evento.id_evento, ...dados });
});

router.put('/:id/custos/:idCusto', soDono, async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento || !podeMexer(evento, 'custos', res)) return;
  const custo = await filhoDoEvento('custo_evento', 'id_custo', req.params.idCusto, evento, res);
  if (!custo) return;
  const { erro, dados } = validarCusto(req.body);
  if (erro) return res.status(400).json({ erro });

  await pool.query('update custo_evento set tipo = ?, descricao = ?, valor = ? where id_custo = ?', [
    dados.tipo, dados.descricao, dados.valor, custo.id_custo,
  ]);
  res.json({ id_custo: custo.id_custo, id_evento: evento.id_evento, ...dados });
});

router.delete('/:id/custos/:idCusto', soDono, async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento || !podeMexer(evento, 'custos', res)) return;
  const custo = await filhoDoEvento('custo_evento', 'id_custo', req.params.idCusto, evento, res);
  if (!custo) return;
  await pool.query('delete from custo_evento where id_custo = ?', [custo.id_custo]);
  res.json({ id_custo: custo.id_custo, excluido: true });
});

module.exports = router;
