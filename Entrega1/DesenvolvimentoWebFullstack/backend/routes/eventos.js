const express = require('express');
const pool = require('../config/bd');
const { autenticar, permitir } = require('../middleware/auth');

const router = express.Router();

async function buscarEvento(id) {
  const [linhas] = await pool.query('select * from evento where id_evento = ?', [id]);
  return linhas[0] || null;
}

// garante que o evento existe e que quem chamou e o dono dele
async function eventoDoOrganizador(req, res) {
  const evento = await buscarEvento(req.params.id);
  if (!evento) {
    res.status(404).json({ erro: 'evento nao encontrado' });
    return null;
  }
  if (evento.id_organizador !== req.usuario.id) {
    res.status(403).json({ erro: 'esse evento e de outro organizador' });
    return null;
  }
  return evento;
}

// so os aprovados aparecem pro publico
router.get('/', async (req, res) => {
  const [linhas] = await pool.query(
    `select e.id_evento, e.nome, e.descricao, e.data_hora,
            c.nome as categoria, l.nome as local, l.cidade, l.estado,
            min(lo.preco) as menor_preco
       from evento e
       join categoria c on c.id_categoria = e.id_categoria
       join local_evento l on l.id_local = e.id_local
       left join lote lo on lo.id_evento = e.id_evento and now() <= lo.data_fim
      where e.status = 'aprovado' and e.data_hora >= now()
      group by e.id_evento
      order by e.data_hora`,
  );
  res.json(linhas);
});

router.get('/meus', autenticar, permitir('organizador'), async (req, res) => {
  const [linhas] = await pool.query(
    'select * from evento where id_organizador = ? order by criado_em desc',
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
              (now() between lo.data_inicio and lo.data_fim) as aberto,
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

router.post('/', autenticar, permitir('organizador'), async (req, res) => {
  const { nome, descricao, data_hora, id_categoria, local } = req.body;

  if (!nome || !data_hora || !id_categoria) {
    return res.status(400).json({ erro: 'nome, data_hora e id_categoria sao obrigatorios' });
  }
  if (!local || !local.nome || !local.cidade || !local.estado) {
    return res.status(400).json({ erro: 'informe o local: nome, cidade e estado' });
  }
  if (String(local.estado).trim().length !== 2) {
    return res.status(400).json({ erro: 'o estado precisa ter 2 letras, como SP' });
  }
  if (new Date(data_hora) <= new Date()) {
    return res.status(400).json({ erro: 'a data do evento precisa ser no futuro' });
  }

  const idLocal = await acharOuCriarLocal(local);

  const [r] = await pool.query(
    `insert into evento (id_organizador, id_local, id_categoria, nome, descricao, data_hora)
     values (?, ?, ?, ?, ?, ?)`,
    [req.usuario.id, idLocal, id_categoria, nome, descricao || null, data_hora],
  );
  res.status(201).json({ id_evento: r.insertId, nome, status: 'rascunho' });
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
  if (fim > new Date(evento.data_hora)) {
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
    if (e.code === 'ER_DUP_ENTRY') {
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

// requisita um servico de fornecedor credenciado e ja abre o chat entre os dois
router.post('/:id/solicitacoes', autenticar, permitir('organizador'), async (req, res) => {
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

  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();

    const [sol] = await conexao.query(
      'insert into solicitacao_servico (id_evento, id_servico, mensagem, valor_proposto) values (?, ?, ?, ?)',
      [evento.id_evento, id_servico, mensagem || null, valor_proposto ?? servico.preco],
    );
    const [chat] = await conexao.query('insert into chat (id_solicitacao) values (?)', [sol.insertId]);
    await conexao.query(
      'insert into chat_participante (id_chat, id_usuario) values (?, ?), (?, ?)',
      [chat.insertId, req.usuario.id, chat.insertId, servico.id_usuario],
    );
    if (mensagem) {
      await conexao.query(
        'insert into mensagem (id_chat, id_remetente, texto_mensagem) values (?, ?, ?)',
        [chat.insertId, req.usuario.id, mensagem],
      );
    }

    await conexao.commit();
    res.status(201).json({ id_solicitacao: sol.insertId, id_chat: chat.insertId, status: 'em_analise' });
  } catch (e) {
    await conexao.rollback();
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ erro: 'esse servico ja foi solicitado para esse evento' });
    }
    throw e;
  } finally {
    conexao.release();
  }
});

// manda o evento pro adm analisar
router.post('/:id/enviar-analise', autenticar, permitir('organizador'), async (req, res) => {
  const evento = await eventoDoOrganizador(req, res);
  if (!evento) return;

  if (evento.status === 'em_analise') {
    return res.status(409).json({ erro: 'esse evento ja esta em analise' });
  }
  if (evento.status === 'aprovado') {
    return res.status(409).json({ erro: 'esse evento ja foi aprovado' });
  }

  const [lotes] = await pool.query('select count(*) as total from lote where id_evento = ?', [
    evento.id_evento,
  ]);
  if (!lotes[0].total) {
    return res.status(400).json({ erro: 'cadastre pelo menos um lote antes de enviar para analise' });
  }

  await pool.query(
    "update evento set status = 'em_analise', motivo_recusa = null where id_evento = ?",
    [evento.id_evento],
  );
  res.json({ id_evento: evento.id_evento, status: 'em_analise' });
});

module.exports = router;
