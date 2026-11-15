// Middleware do credenciamento: barra quem ainda nao pode fazer a acao.
const { situacaoDe } = require('../repositorios/credenciamento');

// usar depois do autenticar/permitir. Se a situacao nao estiver na lista,
// responde 403 com codigo "credenciamento_necessario" (o front abre o pop-up).
//   exigirCredenciamento(['em_analise', 'credenciado'], 'criar eventos')
function exigirCredenciamento(aceitas, acao) {
  return async (req, res, next) => {
    const situacao = await situacaoDe(req.usuario);
    if (aceitas.includes(situacao)) return next();

    const erro = situacao === 'em_analise'
      ? `seu credenciamento ainda esta em analise. Depois de aprovado, voce pode ${acao}`
      : `para ${acao}, faca o credenciamento`;
    res.status(403).json({ erro, codigo: 'credenciamento_necessario', situacao });
  };
}

module.exports = { exigirCredenciamento };
