const express = require('express');
const pool = require('../config/bd');
const { autenticar, permitir } = require('../middleware/auth');

const router = express.Router();

// busca o fornecedor dono da conta logada
async function meuFornecedor(idUsuario) {
  const [linhas] = await pool.query('select * from fornecedor where id_usuario = ?', [idUsuario]);
  return linhas[0] || null;
}

// vitrine: so quem ja passou pelo credenciamento aparece
router.get('/', async (req, res) => {
  const [linhas] = await pool.query(
    `select f.id_fornecedor, f.nome_empresa, f.descricao, u.email, u.telefone,
            count(s.id_servico) as total_servicos
       from fornecedor f
       join usuario u on u.id_usuario = f.id_usuario
       left join servico s on s.id_fornecedor = f.id_fornecedor and s.ativo = true
      where f.situacao = 'credenciado'
      group by f.id_fornecedor
      order by f.nome_empresa`,
  );
  res.json(linhas);
});

router.get('/:id/servicos', async (req, res) => {
  const [linhas] = await pool.query(
    `select s.* from servico s
       join fornecedor f on f.id_fornecedor = s.id_fornecedor
      where s.id_fornecedor = ? and s.ativo = true and f.situacao = 'credenciado'`,
    [req.params.id],
  );
  res.json(linhas);
});

// cria o perfil de empresa da conta fornecedor
router.post('/perfil', autenticar, permitir('fornecedor'), async (req, res) => {
  const { nome_empresa, cnpj, descricao } = req.body;
  if (!nome_empresa || !cnpj) {
    return res.status(400).json({ erro: 'nome_empresa e cnpj sao obrigatorios' });
  }
  if (await meuFornecedor(req.usuario.id)) {
    return res.status(409).json({ erro: 'essa conta ja tem perfil de fornecedor' });
  }

  try {
    const [r] = await pool.query(
      'insert into fornecedor (id_usuario, nome_empresa, cnpj, descricao) values (?, ?, ?, ?)',
      [req.usuario.id, nome_empresa, cnpj.replace(/\D/g, ''), descricao || null],
    );
    res.status(201).json({ id_fornecedor: r.insertId, nome_empresa, situacao: 'nao_solicitado' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ erro: 'ja existe um fornecedor com esse cnpj' });
    }
    throw e;
  }
});

router.get('/perfil', autenticar, permitir('fornecedor'), async (req, res) => {
  const fornecedor = await meuFornecedor(req.usuario.id);
  if (!fornecedor) return res.status(404).json({ erro: 'cadastre o perfil de fornecedor primeiro' });
  res.json(fornecedor);
});

router.post('/servicos', autenticar, permitir('fornecedor'), async (req, res) => {
  const { nome, descricao, preco } = req.body;
  if (!nome || preco == null) {
    return res.status(400).json({ erro: 'nome e preco sao obrigatorios' });
  }

  const fornecedor = await meuFornecedor(req.usuario.id);
  if (!fornecedor) return res.status(404).json({ erro: 'cadastre o perfil de fornecedor primeiro' });

  const [r] = await pool.query(
    'insert into servico (id_fornecedor, nome, descricao, preco) values (?, ?, ?, ?)',
    [fornecedor.id_fornecedor, nome, descricao || null, preco],
  );
  res.status(201).json({ id_servico: r.insertId, nome, preco });
});

router.get('/meus-servicos', autenticar, permitir('fornecedor'), async (req, res) => {
  const fornecedor = await meuFornecedor(req.usuario.id);
  if (!fornecedor) return res.status(404).json({ erro: 'cadastre o perfil de fornecedor primeiro' });

  const [linhas] = await pool.query('select * from servico where id_fornecedor = ?', [
    fornecedor.id_fornecedor,
  ]);
  res.json(linhas);
});

// pede credenciamento. so vale se tiver pelo menos um servico cadastrado.
router.post('/credenciamento', autenticar, permitir('fornecedor'), async (req, res) => {
  const fornecedor = await meuFornecedor(req.usuario.id);
  if (!fornecedor) return res.status(404).json({ erro: 'cadastre o perfil de fornecedor primeiro' });

  if (fornecedor.situacao === 'em_analise') {
    return res.status(409).json({ erro: 'ja existe uma solicitacao em analise' });
  }
  if (fornecedor.situacao === 'credenciado') {
    return res.status(409).json({ erro: 'esse fornecedor ja esta credenciado' });
  }

  const [servicos] = await pool.query(
    'select count(*) as total from servico where id_fornecedor = ? and ativo = true',
    [fornecedor.id_fornecedor],
  );
  if (!servicos[0].total) {
    return res.status(400).json({ erro: 'cadastre pelo menos um servico antes de pedir credenciamento' });
  }

  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();
    const [r] = await conexao.query(
      'insert into credenciamento (id_fornecedor) values (?)',
      [fornecedor.id_fornecedor],
    );
    await conexao.query("update fornecedor set situacao = 'em_analise' where id_fornecedor = ?", [
      fornecedor.id_fornecedor,
    ]);
    await conexao.commit();
    res.status(201).json({ id_credenciamento: r.insertId, status: 'em_analise' });
  } catch (e) {
    await conexao.rollback();
    throw e;
  } finally {
    conexao.release();
  }
});

module.exports = router;
