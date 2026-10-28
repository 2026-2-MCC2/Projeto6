const express = require('express');
const pool = require('../config/bd');
const { autenticar, permitir } = require('../middleware/auth');
const { exigirCredenciamento } = require('../lib/credenciamento');

const router = express.Router();

// busca o fornecedor dono da conta logada
async function meuFornecedor(idUsuario) {
  const [linhas] = await pool.query('select * from fornecedor where id_usuario = ?', [idUsuario]);
  return linhas[0] || null;
}

// vitrine: so quem ja passou pelo credenciamento aparece
router.get('/', async (req, res) => {
  const [linhas] = await pool.query(
    `select f.id_fornecedor, f.nome_empresa, f.descricao, f.cidade, f.estado, f.link,
            u.email, coalesce(f.telefone, u.telefone) as telefone,
            count(s.id_servico) as total_servicos
       from fornecedor f
       join usuario u on u.id_usuario = f.id_usuario
       left join servico s on s.id_fornecedor = f.id_fornecedor and s.ativo = true
      where f.situacao = 'credenciado'
      group by f.id_fornecedor, u.email, u.telefone
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

// o perfil (empresa) nasce no credenciamento: POST /api/credenciamento
router.get('/perfil', autenticar, permitir('fornecedor'), async (req, res) => {
  const fornecedor = await meuFornecedor(req.usuario.id);
  if (!fornecedor) return res.status(404).json({ erro: 'faca o credenciamento primeiro' });
  res.json(fornecedor);
});

// so depois de pedir o credenciamento. Em analise pode cadastrar, mas os
// servicos so aparecem na vitrine quando o adm aprovar.
const credenciamentoPedido = exigirCredenciamento(['em_analise', 'credenciado'], 'cadastrar seus servicos');

router.post('/servicos', autenticar, permitir('fornecedor'), credenciamentoPedido, async (req, res) => {
  const { nome, descricao, preco } = req.body;
  if (!nome || preco == null) {
    return res.status(400).json({ erro: 'nome e preco sao obrigatorios' });
  }

  const fornecedor = await meuFornecedor(req.usuario.id);
  const [r] = await pool.query(
    'insert into servico (id_fornecedor, nome, descricao, preco) values (?, ?, ?, ?)',
    [fornecedor.id_fornecedor, nome, descricao || null, preco],
  );
  res.status(201).json({ id_servico: r.insertId, nome, preco });
});

router.get('/meus-servicos', autenticar, permitir('fornecedor'), async (req, res) => {
  const fornecedor = await meuFornecedor(req.usuario.id);
  if (!fornecedor) return res.json([]);

  const [linhas] = await pool.query('select * from servico where id_fornecedor = ?', [
    fornecedor.id_fornecedor,
  ]);
  res.json(linhas);
});

module.exports = router;
