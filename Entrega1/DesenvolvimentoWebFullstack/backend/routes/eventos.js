const express = require('express');
const pool = require('../config/bd');
const { autenticar, permitir } = require('../middleware/auth');
const { situacaoDe, exigirCredenciamento, abrirChatDaSolicitacao } = require('../lib/credenciamento');
const { buscarEvento, eventoDoOrganizador, podeMexer } = require('../lib/eventos');
const { ufValida, texto } = require('../lib/validacao');

const router = express.Router();

// organizador sem credenciamento pedido nao cria evento; para mandar o
// evento ao adm, o credenciamento precisa estar aprovado
const credenciamentoPedido = exigirCredenciamento(['em_analise', 'credenciado'], 'criar eventos');
const credenciado = exigirCredenciamento(['credenciado'], 'enviar o evento para analise');

// so os aprovados aparecem pro publico
router.get('/', async (req, res) => {
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
  res.json(linhas);
});

router.get('/meus', autenticar, permitir('organizador'), async (req, res) => {
  const [linhas] = await pool.query(
    `select e.*, l.nome as local, l.cidade, l.estado, c.nome as categoria,
            (select count(*) from item_custo where id_evento = e.id_evento) as total_itens
       from evento e
       join local_evento l on l.id_local = e.id_local
       join categoria c on c.id_categoria = e.id_categoria
      where e.id_organizador = ? order by e.criado_em desc`,
    [req.usuario.id],
  );
  res.json(linhas);
});

router.get('/:id', async (req, res) => {
  const evento = await buscarEvento(req.params.id);
  if (!evento) return res.status(404).json({ erro: 'evento nao encontrado' });

  const [[lotes], [externos], [servicos]] = await Promise.all([
    pool.query(
      `select lo.*,
              (now() between lo.data_inicio and lo.data_fim)::int as aberto,
              (select count(*) from ingresso
                where id_lote = lo.id_lote and status = 'disponivel') as disponiveis
         from lote lo where lo.id_evento = ? order by lo.setor, lo.data_inicio`,
      [evento.id_evento],
    ),
    pool.query('select * from fornecedor_externo where id_evento = ?', [evento.id_evento]),
    pool.query(
      `select ss.id_solicitacao, ss.status, ss.valor_proposto,
              s.nome as servico, f.nome_empresa
         from solicitacao_servico ss
         join servico s on s.id_servico = ss.id_servico
         join fornecedor f on f.id_fornecedor = s.id_fornecedor
        where ss.id_evento = ?`,
      [evento.id_evento],
    ),
  ]);

  res.json({ ...evento, lotes, fornecedores_externos: externos, servicos_solicitados: servicos });
});

// o organizador digita o local. se outro evento ja aconteceu no mesmo
// lugar, reaproveita a linha em vez de duplicar.
async function acharOuCriarLocal(local) {
  const nome = (local.nome || '').trim();
  const cidade = (local.cidade || '').trim();
  const estado = (local.estado || '').trim().toUpperCase();
  const endereco = (local.endereco || '').trim();

  if (!nome || !cidade || !estado) return null;

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

// confere os dados do evento (criar e editar usam a mesma regra).
// Devolve { erro } ou { dados } ja limpos.
async function validarEvento(corpo) {
  const nome = texto(corpo.nome);
  const local = corpo.local || {};
  const { data_inicio, data_fim, id_categoria } = corpo;

  if (!nome || !data_inicio || !data_fim || !id_categoria) {
    return { erro: 'nome, data_inicio, data_fim e id_categoria sao obrigatorios' };
  }
  if (!texto(local.nome) || !texto(local.cidade) || !texto(local.estado)) {
    return { erro: 'informe o local: nome, cidade e estado' };
  }
  if (texto(local.estado).length !== 2) {
    return { erro: 'o estado precisa ter 2 letras, como SP' };
  }
  if (!ufValida(local.estado)) return { erro: 'UF invalida' };

  const inicio = new Date(data_inicio);
  const fim = new Date(data_fim);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
    return { erro: 'data_inicio e data_fim precisam ser datas validas' };
  }
  if (inicio <= new Date()) return { erro: 'o evento precisa comecar no futuro' };
  if (fim < inicio) return { erro: 'o evento nao pode terminar antes de comecar' };

  const inteiro = (v) => (v === undefined || v === null || v === '' ? null : Number(v));
  const publicoMinimo = inteiro(corpo.publico_minimo);
  const publicoMaximo = inteiro(corpo.publico_maximo);
  const publicoEsperado = inteiro(corpo.publico_esperado);
  const margem = corpo.margem_lucro === undefined || corpo.margem_lucro === '' ? 0 : Number(corpo.margem_lucro);

  if (!Number.isInteger(publicoMinimo) || publicoMinimo <= 0) {
    return { erro: 'o publico minimo precisa ser um numero inteiro maior que zero' };
  }
  if (!Number.isInteger(publicoMaximo) || publicoMaximo < publicoMinimo) {
    return { erro: 'o publico maximo precisa ser maior ou igual ao minimo' };
  }
  if (publicoEsperado !== null
      && (!Number.isInteger(publicoEsperado) || publicoEsperado < publicoMinimo || publicoEsperado > publicoMaximo)) {
    return { erro: 'o publico esperado precisa ficar entre o minimo e o maximo' };
  }
  if (!Number.isFinite(margem) || margem < 0 || margem >= 100) {
    return { erro: 'a margem de lucro precisa ser de 0 a 99,99%' };
  }

  const [cat] = await pool.query('select 1 from categoria where id_categoria = ?', [Number(id_categoria) || 0]);
  if (!cat.length) return { erro: 'categoria nao encontrada' };

  return {
    dados: {
      nome,
      descricao: texto(corpo.descricao) || null,
      data_inicio,
      data_fim,
      id_categoria: Number(id_categoria),
      publico_minimo: publicoMinimo,
      publico_maximo: publicoMaximo,
      publico_esperado: publicoEsperado,
      margem_lucro: margem,
    },
    local,
  };
}

router.post('/', autenticar, permitir('organizador'), credenciamentoPedido, async (req, res) => {
  const { erro, dados, local } = await validarEvento(req.body);
  if (erro) return res.status(400).json({ erro });

  const idLocal = await acharOuCriarLocal(local);
  const colunas = Object.keys(dados);
  const [r] = await pool.query(
    `insert into evento (id_organizador, id_local, ${colunas.join(', ')})
     values (?, ?, ${colunas.map(() => '?').join(', ')})`,
    [req.usuario.id, idLocal, ...Object.values(dados)],
  );
  res.status(201).json({ id_evento: r.insertId, nome: dados.nome, status: 'rascunho' });
});

// editar (WEB-05): so o dono, e so em rascunho ou depois de recusado
router.put('/:id', autenticar, permitir('organizador'), async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento || !podeMexer(evento, 'dados', res)) return;

  const { erro, dados, local } = await validarEvento(req.body);
  if (erro) return res.status(400).json({ erro });

  const idLocal = await acharOuCriarLocal(local);
  await pool.query(
    `update evento set id_local = ?, ${Object.keys(dados).map((c) => `${c} = ?`).join(', ')}
      where id_evento = ?`,
    [idLocal, ...Object.values(dados), evento.id_evento],
  );
  res.json({ id_evento: evento.id_evento, ...dados, status: evento.status });
});

// excluir (WEB-05). Regra: so enquanto o evento nao foi para o adm (em analise
// ou aprovado) e nao tem proposta selecionada. Itens, custos e propostas saem
// junto (CASCADE).
router.delete('/:id', autenticar, permitir('organizador'), async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento) return;
  if (['em_analise', 'aprovado'].includes(evento.status)) {
    return res.status(409).json({ erro: 'evento em analise ou aprovado nao pode ser excluido' });
  }
  const [selecionadas] = await pool.query(
    `select count(*) as total from proposta p join item_custo i on i.id_item = p.id_item
      where i.id_evento = ? and p.situacao = 'selecionada'`,
    [evento.id_evento],
  );
  if (selecionadas[0].total) {
    return res.status(409).json({ erro: 'esse evento tem proposta selecionada; desmarque antes de excluir' });
  }
  await pool.query('delete from evento where id_evento = ?', [evento.id_evento]);
  res.json({ id_evento: evento.id_evento, excluido: true });
});

router.post('/:id/lotes', autenticar, permitir('organizador'), async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento) return;

  if (evento.status !== 'rascunho') {
    return res.status(409).json({ erro: 'so da pra mexer nos lotes enquanto o evento esta em rascunho' });
  }

  const { setor, nome, preco, quantidade, margem_revenda, data_inicio, data_fim } = req.body;
  if (!setor || !nome || preco == null || !quantidade || !data_inicio || !data_fim) {
    return res.status(400).json({
      erro: 'setor, nome, preco, quantidade, data_inicio e data_fim sao obrigatorios',
    });
  }
  if (Number(preco) < 0 || Number(quantidade) <= 0) {
    return res.status(400).json({ erro: 'preco nao pode ser negativo e quantidade precisa ser maior que zero' });
  }
  const margem = margem_revenda == null ? 0 : Number(margem_revenda);
  if (margem < 0) {
    return res.status(400).json({ erro: 'a margem de revenda nao pode ser negativa' });
  }

  const inicio = new Date(data_inicio);
  const fim = new Date(data_fim);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
    return res.status(400).json({ erro: 'data_inicio e data_fim precisam ser datas validas' });
  }
  if (fim <= inicio) {
    return res.status(400).json({ erro: 'data_fim precisa ser depois de data_inicio' });
  }
  // nao adianta vender ingresso depois que o show comecou
  if (fim > new Date(evento.data_inicio)) {
    return res.status(400).json({ erro: 'a venda do lote nao pode terminar depois do evento' });
  }

  try {
    const [r] = await pool.query(
      `insert into lote (id_evento, setor, nome, preco, quantidade, margem_revenda, data_inicio, data_fim)
       values (?, ?, ?, ?, ?, ?, ?, ?)`,
      [evento.id_evento, setor, nome, preco, quantidade, margem, data_inicio, data_fim],
    );
    res.status(201).json({
      id_lote: r.insertId,
      setor,
      nome,
      preco: Number(preco),
      quantidade: Number(quantidade),
      data_inicio,
      data_fim,
      margem_revenda: margem,
      teto_revenda: Number((Number(preco) * (1 + margem / 100)).toFixed(2)),
    });
  } catch (e) {
    if (e.code === pool.DUPLICADO) {
      return res.status(409).json({ erro: `esse evento ja tem o lote "${nome}" no setor "${setor}"` });
    }
    throw e;
  }
});

// fornecedor particular do organizador, que nao tem conta no site
router.post('/:id/fornecedores-externos', autenticar, permitir('organizador'), async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento) return;

  const { nome, servico, valor, contato } = req.body;
  if (!nome || !servico || valor == null) {
    return res.status(400).json({ erro: 'nome, servico e valor sao obrigatorios' });
  }

  const [r] = await pool.query(
    'insert into fornecedor_externo (id_evento, nome, servico, valor, contato) values (?, ?, ?, ?, ?)',
    [evento.id_evento, nome, servico, valor, contato || null],
  );
  res.status(201).json({ id_fornecedor_externo: r.insertId, nome, servico, valor: Number(valor) });
});

// requisita um servico de fornecedor credenciado e ja abre o chat entre os dois.
// Se o organizador ainda nao esta credenciado, o pedido fica retido
// (aguardando_organizador): sem chat e sem aparecer pro fornecedor. Ele e
// liberado quando o adm aprova o organizador (admin.js).
router.post('/:id/solicitacoes', autenticar, permitir('organizador'), credenciamentoPedido, async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento) return;

  const { id_servico, mensagem, valor_proposto } = req.body;
  if (!id_servico) return res.status(400).json({ erro: 'id_servico e obrigatorio' });

  const [servicos] = await pool.query(
    `select s.id_servico, s.preco, f.situacao, f.id_usuario
       from servico s
       join fornecedor f on f.id_fornecedor = s.id_fornecedor
      where s.id_servico = ? and s.ativo = true`,
    [id_servico],
  );
  const servico = servicos[0];
  if (!servico) return res.status(404).json({ erro: 'servico nao encontrado' });
  if (servico.situacao !== 'credenciado') {
    return res.status(409).json({ erro: 'esse fornecedor ainda nao esta credenciado' });
  }

  const retida = (await situacaoDe(req.usuario)) !== 'credenciado';

  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();

    const [sol] = await conexao.query(
      `insert into solicitacao_servico (id_evento, id_servico, mensagem, valor_proposto, status)
       values (?, ?, ?, ?, ?)`,
      [evento.id_evento, id_servico, mensagem || null, valor_proposto ?? servico.preco,
        retida ? 'aguardando_organizador' : 'em_analise'],
    );
    const idChat = retida ? null : await abrirChatDaSolicitacao(conexao, {
      id_solicitacao: sol.insertId,
      id_organizador: req.usuario.id,
      id_usuario_fornecedor: servico.id_usuario,
      mensagem,
    });

    await conexao.commit();
    res.status(201).json({
      id_solicitacao: sol.insertId,
      id_chat: idChat,
      status: retida ? 'aguardando_organizador' : 'em_analise',
    });
  } catch (e) {
    await conexao.rollback();
    if (e.code === pool.DUPLICADO) {
      return res.status(409).json({ erro: 'esse servico ja foi solicitado para esse evento' });
    }
    throw e;
  } finally {
    conexao.release();
  }
});

// manda o evento pro adm analisar
router.post('/:id/enviar-analise', autenticar, permitir('organizador'), credenciado, async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento) return;

  if (evento.status === 'em_analise') {
    return res.status(409).json({ erro: 'esse evento ja esta em analise' });
  }
  if (evento.status === 'aprovado') {
    return res.status(409).json({ erro: 'esse evento ja foi aprovado' });
  }
  if (evento.status === 'em_cotacao') {
    return res.status(409).json({ erro: 'encerre a cotacao antes de enviar o evento para analise' });
  }

  const [itens] = await pool.query('select count(*) as total from item_custo where id_evento = ?', [
    evento.id_evento,
  ]);
  if (!itens[0].total) {
    return res.status(400).json({ erro: 'cadastre pelo menos um item de custo antes de enviar para analise' });
  }

  await pool.query(
    "update evento set status = 'em_analise', motivo_recusa = null where id_evento = ?",
    [evento.id_evento],
  );
  res.json({ id_evento: evento.id_evento, status: 'em_analise' });
});

// --- cotacao (FLX-03) ---------------------------------------------------------
// Publicar o evento para cotacao: os fornecedores credenciados passam a ver o
// evento e os itens e mandam propostas. So o dono, credenciado, com 1 item ou mais.
const credenciadoParaCotar = exigirCredenciamento(['credenciado'], 'publicar o evento para cotacao');

router.post('/:id/abrir-cotacao', autenticar, permitir('organizador'), credenciadoParaCotar, async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento) return;
  if (!['rascunho', 'recusado', 'cotacao_encerrada'].includes(evento.status)) {
    return res.status(409).json({ erro: 'so da pra publicar para cotacao um evento em rascunho, recusado ou com a cotacao encerrada' });
  }
  const [itens] = await pool.query('select count(*) as total from item_custo where id_evento = ?', [evento.id_evento]);
  if (!itens[0].total) {
    return res.status(400).json({ erro: 'cadastre pelo menos um item de custo antes de publicar para cotacao' });
  }
  await pool.query("update evento set status = 'em_cotacao' where id_evento = ?", [evento.id_evento]);
  // reabrir desfaz as escolhas: as propostas voltam a "enviada" e podem mudar
  await pool.query(
    `update proposta set situacao = 'enviada', atualizado_em = now()
      where situacao in ('selecionada', 'nao_selecionada')
        and id_item in (select id_item from item_custo where id_evento = ?)`,
    [evento.id_evento],
  );
  res.json({ id_evento: evento.id_evento, status: 'em_cotacao' });
});

router.post('/:id/encerrar-cotacao', autenticar, permitir('organizador'), async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento) return;
  if (evento.status !== 'em_cotacao') {
    return res.status(409).json({ erro: 'esse evento nao esta em cotacao' });
  }
  await pool.query("update evento set status = 'cotacao_encerrada' where id_evento = ?", [evento.id_evento]);
  res.json({ id_evento: evento.id_evento, status: 'cotacao_encerrada' });
});

module.exports = router;
