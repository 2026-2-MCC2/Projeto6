const express = require('express');
const pedidos = require('../repositorios/pedidos');
const { emTransacao } = require('../repositorios/transacao');
const { autenticar } = require('../middleware/auth');

const router = express.Router();
const METODOS = ['pix', 'cartao', 'boleto'];

// fecha o pedido (itens, ingressos e pagamento) e devolve o resumo
async function fecharPedido(conexao, idComprador, ingressos, metodo) {
  const total = ingressos.reduce((soma, i) => soma + Number(i.preco), 0);
  const idPedido = await pedidos.fechar({ idComprador, ingressos, metodo, total }, conexao);
  return { id_pedido: idPedido, valor_total: total };
}

// compra direto do lote (venda original do organizador).
// As saidas antecipadas (lote fechado, sem ingresso) acontecem antes de
// qualquer gravacao, entao a transacao termina sem mudar nada.
router.post('/', autenticar, async (req, res) => {
  const { id_lote, quantidade, metodo } = req.body;
  const qtd = Number(quantidade || 1);

  if (!id_lote) return res.status(400).json({ erro: 'id_lote e obrigatorio' });
  if (!METODOS.includes(metodo)) {
    return res.status(400).json({ erro: `metodo precisa ser um de: ${METODOS.join(', ')}` });
  }
  if (!Number.isInteger(qtd) || qtd < 1 || qtd > 6) {
    return res.status(400).json({ erro: 'quantidade precisa ser um numero inteiro de 1 a 6' });
  }

  const resposta = await emTransacao(async (conexao) => {
    const lote = await pedidos.loteComEvento(id_lote, conexao);
    if (!lote || lote.status_evento !== 'aprovado') {
      return [404, { erro: 'lote nao encontrado ou evento ainda nao aprovado' }];
    }

    const agora = new Date();
    if (agora < new Date(lote.data_inicio)) {
      return [409, { erro: `o lote "${lote.nome}" ainda nao abriu`, abre_em: lote.data_inicio }];
    }
    if (agora > new Date(lote.data_fim)) {
      return [409, { erro: `o lote "${lote.nome}" ja encerrou`, fechou_em: lote.data_fim }];
    }

    const ingressos = await pedidos.reservarDisponiveis(id_lote, qtd, conexao);
    if (ingressos.length < qtd) {
      return [409, { erro: 'nao ha ingressos suficientes nesse lote', disponiveis: ingressos.length }];
    }

    const resultado = await fecharPedido(conexao, req.usuario.id, ingressos, metodo);
    return [201, { ...resultado, status: 'pago', ingressos: ingressos.length }];
  });
  res.status(resposta[0]).json(resposta[1]);
});

// compra de um ingresso que outro usuario colocou a venda
router.post('/revenda', autenticar, async (req, res) => {
  const { id_ingresso, metodo } = req.body;

  if (!id_ingresso) return res.status(400).json({ erro: 'id_ingresso e obrigatorio' });
  if (!METODOS.includes(metodo)) {
    return res.status(400).json({ erro: `metodo precisa ser um de: ${METODOS.join(', ')}` });
  }

  const resposta = await emTransacao(async (conexao) => {
    const ingresso = await pedidos.reservarAnunciado(id_ingresso, conexao);
    if (!ingresso) {
      return [409, { erro: 'esse ingresso nao esta a venda' }];
    }
    if (ingresso.id_vendedor === req.usuario.id) {
      return [409, { erro: 'voce nao pode comprar o seu proprio ingresso' }];
    }

    const resultado = await fecharPedido(conexao, req.usuario.id, [ingresso], metodo);
    return [201, { ...resultado, status: 'pago', revenda: true }];
  });
  res.status(resposta[0]).json(resposta[1]);
});

router.get('/meus', autenticar, async (req, res) => {
  const lista = await pedidos.doComprador(req.usuario.id);
  if (!lista.length) return res.json([]);

  const itens = await pedidos.itensDosPedidos(lista.map((p) => p.id_pedido));
  res.json(lista.map((p) => ({ ...p, itens: itens.filter((i) => i.id_pedido === p.id_pedido) })));
});

module.exports = router;
