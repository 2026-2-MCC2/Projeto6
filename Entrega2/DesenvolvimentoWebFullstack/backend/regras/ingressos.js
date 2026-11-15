// Regra da revenda de ingressos (extensao do projeto).

// teto de revenda do lote: preco original + a margem que o organizador liberou
function tetoRevenda(lote) {
  return Number((Number(lote.preco) * (1 + Number(lote.margem_revenda) / 100)).toFixed(2));
}

// um ingresso por unidade do lote, no formato TT-evento-lote-numero.
// Cada linha ja vem na ordem das colunas do insert de ingresso.
function ingressosDoLote(evento, lote) {
  const linhas = [];
  for (let i = 1; i <= lote.quantidade; i += 1) {
    linhas.push([
      evento.id_evento,
      lote.id_lote,
      evento.id_organizador,
      lote.setor,
      'inteira',
      `TT-${evento.id_evento}-${lote.id_lote}-${String(i).padStart(5, '0')}`,
      lote.preco,
    ]);
  }
  return linhas;
}

module.exports = { tetoRevenda, ingressosDoLote };
