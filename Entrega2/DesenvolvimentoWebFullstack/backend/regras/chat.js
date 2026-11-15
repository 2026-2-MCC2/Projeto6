// Regras do chat: quem pode conversar com quem e o que conta como mensagem
// valida. Sem banco aqui: as rotas buscam os dados e perguntam para estas
// funcoes.

const TAMANHO_MAXIMO = 2000;

// Conversa direta (fora de uma solicitacao de servico):
// - o administrador fala com qualquer pessoa;
// - qualquer pessoa fala com o administrador (suporte da TrocaTicket);
// - organizador e fornecedor conversam entre si quando os dois estao
//   credenciados, como acontece na cotacao.
// "eu" e "outro" sao { id_usuario, tipo, situacao }.
// Devolve null se pode, ou a mensagem explicando por que nao.
function motivoParaNaoConversar(eu, outro) {
  if (!outro) return 'pessoa nao encontrada';
  if (eu.id_usuario === outro.id_usuario) return 'escolha outra pessoa para conversar';
  if (eu.tipo === 'adm' || outro.tipo === 'adm') return null;

  const par = [eu.tipo, outro.tipo].sort().join('+');
  if (par !== 'fornecedor+organizador') {
    return 'essa conversa nao esta disponivel. Fale com a equipe TrocaTicket';
  }
  if (eu.situacao !== 'credenciado') {
    return 'conversas com organizadores e fornecedores ficam liberadas depois do credenciamento';
  }
  if (outro.situacao !== 'credenciado') return 'essa pessoa ainda nao foi credenciada';
  return null;
}

// texto da mensagem: sem espacos sobrando, nao vazio e com tamanho maximo
function validarTexto(texto) {
  const limpo = String(texto ?? '').trim();
  if (!limpo) return { erro: 'escreva a mensagem' };
  if (limpo.length > TAMANHO_MAXIMO) {
    return { erro: `a mensagem passou de ${TAMANHO_MAXIMO} caracteres` };
  }
  return { texto: limpo };
}

// numero inteiro positivo vindo da URL ou do corpo (ex.: ?depois=12)
function idOuZero(valor) {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

module.exports = { TAMANHO_MAXIMO, motivoParaNaoConversar, validarTexto, idOuZero };
