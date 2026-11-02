// Credenciamento de organizadores e fornecedores (RF01 a RF03).
// A conta funciona logo depois do cadastro; com o credenciamento aprovado
// pelo adm, a pessoa passa a operar de verdade na plataforma.
const express = require('express');
const credenciamento = require('../repositorios/credenciamento');
const { emTransacao, ehDuplicado } = require('../repositorios/transacao');
const { validarCredenciamento } = require('../regras/credenciamento');
const { autenticar, permitir } = require('../middleware/auth');

const router = express.Router();

router.use(autenticar, permitir('organizador', 'fornecedor'));

// o que o pop-up precisa: situacao, dados ja enviados e motivo da recusa
router.get('/meu', async (req, res) => {
  const tipo = req.usuario.tipo;
  const linha = await credenciamento.buscarPerfil(req.usuario);
  if (!linha) {
    return res.json({ perfil: tipo, situacao: 'nao_solicitado', motivo_recusa: null, dados: null });
  }

  const { id } = credenciamento.PERFIL[tipo];
  const ultimo = (await credenciamento.ultimoPedido(tipo, linha[id])) || {};

  const dados = { ...linha, categorias: await credenciamento.categoriasDe(tipo, linha) };
  delete dados.id_usuario;
  delete dados.situacao;
  delete dados.criado_em;

  res.json({
    perfil: tipo,
    situacao: linha.situacao,
    motivo_recusa: linha.situacao === 'recusado' ? ultimo.observacao || null : null,
    enviado_em: ultimo.solicitado_em || null,
    revisado_em: ultimo.revisado_em || null,
    dados,
  });
});

// envia (ou reenvia, depois de recusado) o credenciamento
router.post('/', async (req, res) => {
  const tipo = req.usuario.tipo;

  const atual = await credenciamento.buscarPerfil(req.usuario);
  if (atual?.situacao === 'em_analise') {
    return res.status(409).json({ erro: 'seu credenciamento ja esta em analise' });
  }
  if (atual?.situacao === 'credenciado') {
    return res.status(409).json({ erro: 'sua conta ja esta credenciada' });
  }

  const { erros, dados, categorias } = await validarCredenciamento(tipo, req.body, credenciamento.contarCategorias);
  if (Object.keys(erros).length) {
    return res.status(400).json({ erro: 'confira os campos destacados', campos: erros });
  }

  try {
    const idPedido = await emTransacao((conexao) =>
      credenciamento.enviar({ tipo, idUsuario: req.usuario.id, atual, dados, categorias }, conexao));
    res.status(201).json({ id_credenciamento: idPedido, situacao: 'em_analise' });
  } catch (e) {
    if (ehDuplicado(e)) {
      return res.status(409).json({
        erro: 'ja existe um cadastro com esse CNPJ',
        campos: { cnpj: 'ja existe um cadastro com esse CNPJ' },
      });
    }
    throw e;
  }
});

module.exports = router;
