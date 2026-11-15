const express = require('express');
const fornecedores = require('../repositorios/fornecedores');
const { autenticar, permitir } = require('../middleware/auth');
const { exigirCredenciamento } = require('../lib/credenciamento');

const router = express.Router();

// vitrine: so quem ja passou pelo credenciamento aparece
router.get('/', async (req, res) => {
  res.json(await fornecedores.listarCredenciados());
});

router.get('/:id/servicos', async (req, res) => {
  res.json(await fornecedores.servicosAtivosDeCredenciado(req.params.id));
});

// o perfil (empresa) nasce no credenciamento: POST /api/credenciamento
router.get('/perfil', autenticar, permitir('fornecedor'), async (req, res) => {
  const fornecedor = await fornecedores.doUsuario(req.usuario.id);
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

  const fornecedor = await fornecedores.doUsuario(req.usuario.id);
  const id = await fornecedores.criarServico({
    idFornecedor: fornecedor.id_fornecedor,
    nome,
    descricao: descricao || null,
    preco,
  });
  res.status(201).json({ id_servico: id, nome, preco });
});

router.get('/meus-servicos', autenticar, permitir('fornecedor'), async (req, res) => {
  const fornecedor = await fornecedores.doUsuario(req.usuario.id);
  if (!fornecedor) return res.json([]);
  res.json(await fornecedores.servicosDoFornecedor(fornecedor.id_fornecedor));
});

module.exports = router;
