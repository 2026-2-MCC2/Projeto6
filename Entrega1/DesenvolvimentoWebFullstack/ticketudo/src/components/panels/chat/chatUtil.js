// Textos e datas do chat. Sem React aqui: so funcoes que recebem dados e
// devolvem o que a tela mostra.

// o mesmo limite da API (regras/chat.js)
export const LIMITE = 2000

const TIPOS = {
  adm: 'Equipe TrocaTicket',
  organizador: 'Organizador',
  fornecedor: 'Fornecedor',
  comprador: 'Comprador',
}

export function tipoPessoa(tipo) {
  return TIPOS[tipo] ?? tipo
}

// "Som & Luz Demo · Fornecedor" (ou so o tipo, se nao tem empresa)
export function sobrePessoa(pessoa) {
  if (!pessoa) return ''
  const tipo = tipoPessoa(pessoa.tipo)
  return pessoa.empresa && pessoa.tipo !== 'adm' ? `${pessoa.empresa} · ${tipo}` : tipo
}

// texto de quem pode conversar com quem, para a lista vazia
export function quemPodeConversar(tipo, situacao) {
  if (tipo === 'adm') return 'Você pode conversar com qualquer organizador, fornecedor ou comprador.'
  if (tipo === 'organizador' && situacao === 'credenciado') {
    return 'Fale com a equipe TrocaTicket ou com fornecedores credenciados sobre as suas cotações.'
  }
  if (tipo === 'fornecedor' && situacao === 'credenciado') {
    return 'Fale com a equipe TrocaTicket ou com os organizadores dos eventos em cotação.'
  }
  return 'Tire suas dúvidas com a equipe TrocaTicket. As conversas de pedidos de serviço também aparecem aqui.'
}

// assunto que vale mostrar (os antigos "Conversa com Fulano" nao dizem nada)
function assuntoUtil(assunto) {
  return assunto && !/^conversa com /i.test(assunto) ? assunto : null
}

// do que a conversa trata: o servico pedido ou o assunto da conversa direta
export function contexto(conversa) {
  if (conversa.servico) return [conversa.servico, conversa.evento].filter(Boolean).join(' · ')
  return assuntoUtil(conversa.assunto)
}

const DIA = 24 * 60 * 60 * 1000
const inicioDoDia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
const diasAtras = (data) => Math.round((inicioDoDia(new Date()) - inicioDoDia(data)) / DIA)

export function hora(valor) {
  return new Date(valor).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// na lista de conversas: "14:05" hoje, "Ontem", "seg." na semana, "02/11" antes
export function quandoCurto(valor) {
  if (!valor) return ''
  const data = new Date(valor)
  const dias = diasAtras(data)
  if (dias <= 0) return hora(data)
  if (dias === 1) return 'Ontem'
  if (dias < 7) return data.toLocaleDateString('pt-BR', { weekday: 'short' })
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

// separador de dia dentro da conversa: "Hoje", "Ontem", "segunda-feira, 2 de novembro"
export function rotuloDia(valor) {
  const data = new Date(valor)
  const dias = diasAtras(data)
  if (dias <= 0) return 'Hoje'
  if (dias === 1) return 'Ontem'
  const mesmoAno = data.getFullYear() === new Date().getFullYear()
  return data.toLocaleDateString('pt-BR', {
    weekday: dias < 7 ? 'long' : undefined,
    day: 'numeric',
    month: 'long',
    year: mesmoAno ? undefined : 'numeric',
  })
}

export function mesmoDia(a, b) {
  return inicioDoDia(new Date(a)) === inicioDoDia(new Date(b))
}

// separa o texto em pedacos, marcando os links (http ou https) para virarem <a>
const LINK = /(https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]])/g
export function pedacosComLinks(texto) {
  return String(texto)
    .split(LINK)
    .filter(Boolean)
    .map((parte) => ({ texto: parte, link: /^https?:\/\//.test(parte) }))
}

// junta mensagens novas com as que a tela ja tem, sem repetir (a mesma
// mensagem pode chegar pela resposta do envio e pela busca automatica)
export function juntarMensagens(atuais, novas) {
  if (!novas.length) return atuais
  const vistos = new Set(atuais.map((m) => m.id_mensagem))
  const soNovas = novas.filter((m) => !vistos.has(m.id_mensagem))
  if (!soNovas.length) return atuais
  return [...atuais, ...soNovas].sort((a, b) => a.id_mensagem - b.id_mensagem)
}
