// Teste de fumaca do backend do TrocaTicket.
// Sobe o servidor, roda o banco limpo com o seed e execute: npm test
const base = process.env.API || 'http://localhost:3000/api'
let ok = 0, fail = 0
const linhas = []

function check(nome, cond, extra = '') {
  linhas.push(`${cond ? 'OK   ' : 'FALHA'} ${nome}${extra ? ' :: ' + extra : ''}`)
  cond ? ok++ : fail++
}

async function api(metodo, rota, corpo, token) {
  const r = await fetch(base + rota, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: corpo ? JSON.stringify(corpo) : undefined,
  })
  return { status: r.status, body: await r.json().catch(() => ({})) }
}

// gera um CNPJ valido (com os digitos verificadores certos) diferente a cada rodada
function cnpjValido(base12) {
  const dv = (b) => {
    let soma = 0
    let peso = b.length - 7
    for (const d of b) { soma += Number(d) * peso; peso = peso === 2 ? 9 : peso - 1 }
    const r = soma % 11
    return r < 2 ? 0 : 11 - r
  }
  const d1 = dv(base12)
  return base12 + d1 + dv(base12 + d1)
}

const n = Date.now()
const emails = {}
let seq = 0
async function criar(tipo, nome) {
  seq += 1
  const email = `${tipo}${seq}.${n}@tt.com`
  emails[nome] = email
  const r = await api('POST', '/auth/cadastro', {
    nome, email, cpf: String(n + seq * 1000).slice(-11), senha: 'senha123', tipo,
  })
  if (!r.body.token) console.error('cadastro falhou:', tipo, r.status, JSON.stringify(r.body))
  return r.body.token
}

// 1. contas
// adm nao sai do cadastro aberto: vem do seed
const loginAdm = await api('POST', '/auth/login', { email: 'admin@trocaticket.com.br', senha: 'admin123' })
const adm = loginAdm.body.token
check('adm do seed faz login', !!adm)
const tentouAdm = await api('POST', '/auth/cadastro', { nome: 'X', email: `x${Date.now()}@x.com`, cpf: '12345678901', senha: 'senha123', tipo: 'adm' })
check('ninguem se cadastra como adm', tentouAdm.status === 400, tentouAdm.body.erro)
const org = await criar('organizador', 'Lucas Organizador')
const forn = await criar('fornecedor', 'Gabi Fornecedora')
const c1 = await criar('comprador', 'Caio Comprador')
const c2 = await criar('comprador', 'Bia Compradora')
check('cadastro dos 4 perfis abertos', [org, forn, c1, c2].every(Boolean))

const login = await api('POST', '/auth/login', { email: emails['Lucas Organizador'], senha: 'senha123' })
check('login devolve token', !!login.body.token)
const senhaErrada = await api('POST', '/auth/login', { email: emails['Lucas Organizador'], senha: 'errada' })
check('senha errada e rejeitada', senhaErrada.status === 401)
const maiusc = emails['Lucas Organizador'].toUpperCase()
const loginMaiusc = await api('POST', '/auth/login', { email: '  ' + maiusc + '  ', senha: 'senha123' })
check('login aceita o e-mail com maiusculas e espacos', !!loginMaiusc.body.token)
const emailMisto = `Fulano.${Date.now()}@TT.com`
const cadMisto = await api('POST', '/auth/cadastro', { nome: 'Fulano', email: emailMisto, cpf: String(Date.now() + 555).slice(-11), senha: 'senha123' })
check('cadastro grava o e-mail em minusculas', cadMisto.body.usuario?.email === emailMisto.toLowerCase(), cadMisto.body.usuario?.email)
const cadRepetido = await api('POST', '/auth/cadastro', { nome: 'Outro', email: emailMisto.toUpperCase(), cpf: String(Date.now() + 777).slice(-11), senha: 'senha123' })
check('nao cria conta repetida mudando so as maiusculas', cadRepetido.status === 409, cadRepetido.body.erro)
const eu = await api('GET', '/auth/eu', null, org)
check('/auth/eu devolve o usuario logado', eu.body.tipo === 'organizador', eu.body.nome)

// 2. permissao por perfil
const semPermissao = await api('POST', '/categorias', { nome: 'Teste' }, org)
check('organizador nao cria categoria', semPermissao.status === 403)
const semToken = await api('GET', '/admin/eventos')
check('rota de adm exige token', semToken.status === 401)

// 3. catalogo
const cat = await api('POST', '/categorias', { nome: 'Show ' + n }, adm)
check('adm cria categoria', cat.status === 201)

// 4. credenciamento do fornecedor: pede antes, depois cadastra servicos
const servAntes = await api('POST', '/fornecedores/servicos', { nome: 'Som e luz', preco: 15000 }, forn)
check('fornecedor sem credenciamento nao cadastra servico', servAntes.status === 403 && servAntes.body.codigo === 'credenciamento_necessario', servAntes.body.erro)
const meuAntes = await api('GET', '/credenciamento/meu', null, forn)
check('pop-up le a situacao nao_solicitado', meuAntes.body.situacao === 'nao_solicitado' && meuAntes.body.perfil === 'fornecedor')

const dadosForn = {
  nome_empresa: 'Gabisom', razao_social: 'Gabisom Eventos Ltda', cnpj: cnpjValido(String(n).slice(-12)),
  cidade: 'Sao Paulo', estado: 'sp', telefone: '(11) 98888-7777', categorias: ['iluminacao', 'estrutura'],
  descricao: 'Som, luz e palco para shows', declaracao: true,
}
const cnpjRuim = await api('POST', '/credenciamento', { ...dadosForn, cnpj: '11.111.111/1111-11' }, forn)
check('CNPJ invalido da 400 com o campo', cnpjRuim.status === 400 && !!cnpjRuim.body.campos?.cnpj, cnpjRuim.body.campos?.cnpj)
const semDeclaracao = await api('POST', '/credenciamento', { ...dadosForn, declaracao: false, estado: 'XX' }, forn)
check('sem declaracao e UF errada da 400 por campo', semDeclaracao.status === 400 && !!semDeclaracao.body.campos?.declaracao && !!semDeclaracao.body.campos?.estado)
const cred = await api('POST', '/credenciamento', dadosForn, forn)
check('fornecedor pede credenciamento', cred.status === 201)
const credDeNovo = await api('POST', '/credenciamento', dadosForn, forn)
check('nao pede de novo enquanto esta em analise', credDeNovo.status === 409)
const meuForn = await api('GET', '/credenciamento/meu', null, forn)
check('pop-up mostra em analise com os dados', meuForn.body.situacao === 'em_analise' && meuForn.body.dados?.categorias?.length === 2 && meuForn.body.dados?.estado === 'SP')

const serv = await api('POST', '/fornecedores/servicos', { nome: 'Som e luz', preco: 15000 }, forn)
check('em analise ja cadastra servico', serv.status === 201)

const vitrineAntes = await api('GET', '/fornecedores')
check('fornecedor em analise nao aparece na vitrine', vitrineAntes.body.length === 0)

const filaCred = await api('GET', '/admin/credenciamentos?perfil=fornecedor', null, adm)
check('adm ve a fila de fornecedores com os dados', filaCred.body.length === 1 && filaCred.body[0].razao_social === 'Gabisom Eventos Ltda', `${filaCred.body.length}`)
await api('POST', `/admin/credenciamentos/${cred.body.id_credenciamento}/aprovar`, {}, adm)
const vitrineDepois = await api('GET', '/fornecedores')
check('credenciado aparece na vitrine', vitrineDepois.body.length === 1)
const historico = await api('GET', '/admin/credenciamentos?perfil=fornecedor&status=aprovado', null, adm)
check('fica registrado quem aprovou e quando', historico.body[0]?.analisado_por === 'Administrador' && !!historico.body[0]?.revisado_em)

// 4b. credenciamento do organizador
const semCred = await api('POST', '/eventos', {
  nome: 'Antes do credenciamento', data_hora: '2027-03-14 20:00:00', id_categoria: cat.body.id_categoria,
  local: { nome: 'Arena TT', cidade: 'Sao Paulo', estado: 'SP' },
}, org)
check('organizador sem credenciamento nao cria evento', semCred.status === 403 && semCred.body.codigo === 'credenciamento_necessario', semCred.body.erro)

const dadosOrg = {
  tipo_pessoa: 'fisica', nome_organizacao: 'Lucas Producoes', cidade: 'Sao Paulo', estado: 'SP',
  telefone: '11977776666', categorias: [cat.body.id_categoria], descricao: 'Organizo shows ha 3 anos',
  publico_medio: 800, declaracao: true,
}
const juridicaSemCnpj = await api('POST', '/credenciamento', { ...dadosOrg, tipo_pessoa: 'juridica' }, org)
check('organizador pessoa juridica precisa de CNPJ e razao social', juridicaSemCnpj.status === 400 && !!juridicaSemCnpj.body.campos?.cnpj && !!juridicaSemCnpj.body.campos?.razao_social)
const credOrg = await api('POST', '/credenciamento', dadosOrg, org)
check('organizador pede credenciamento', credOrg.status === 201, credOrg.body.erro)

// 5. evento + lotes + fornecedor externo
const semLocal = await api('POST', '/eventos', {
  nome: 'Sem lugar', data_hora: '2027-03-14 20:00:00', id_categoria: cat.body.id_categoria,
}, org)
check('evento sem local e barrado', semLocal.status === 400, semLocal.body.erro)

const ufRuim = await api('POST', '/eventos', {
  nome: 'UF errada', data_hora: '2027-03-14 20:00:00', id_categoria: cat.body.id_categoria,
  local: { nome: 'Arena TT', cidade: 'Sao Paulo', estado: 'Sao Paulo' },
}, org)
check('estado com mais de 2 letras e barrado', ufRuim.status === 400, ufRuim.body.erro)

const ev = await api('POST', '/eventos', {
  nome: 'Festival Pulse', data_hora: '2027-03-14 20:00:00',
  id_categoria: cat.body.id_categoria,
  local: { nome: 'Arena TT', cidade: 'Sao Paulo', estado: 'sp', endereco: 'Rua 1, 100' },
}, org)
check('organizador cria evento com local digitado', ev.status === 201)

// o segundo evento no mesmo lugar reaproveita a linha em vez de duplicar
const locaisAntes = (await api('GET', '/locais')).body.length
const ev2 = await api('POST', '/eventos', {
  nome: 'Outro no mesmo lugar', data_hora: '2027-04-10 20:00:00',
  id_categoria: cat.body.id_categoria,
  local: { nome: 'Arena TT', cidade: 'Sao Paulo', estado: 'SP', endereco: 'Rua 1, 100' },
}, org)
const locaisDepois = (await api('GET', '/locais')).body.length
check('mesmo local nao duplica', ev2.status === 201 && locaisDepois === locaisAntes,
  `${locaisAntes} -> ${locaisDepois}`)
const evId = ev.body.id_evento

const emAnalise = await api('POST', `/eventos/${evId}/enviar-analise`, {}, org)
check('organizador em analise nao envia evento pro adm', emAnalise.status === 403 && emAnalise.body.codigo === 'credenciamento_necessario', emAnalise.body.erro)

// datas no formato "AAAA-MM-DD hh:mm:ss" que o banco aceita
const dia = 86400000
const data = (ms) => new Date(Date.now() + ms).toISOString().slice(0, 19).replace('T', ' ')

const lote = await api('POST', `/eventos/${evId}/lotes`, {
  setor: 'Pista', nome: '1o lote', preco: 100, quantidade: 10, margem_revenda: 20,
  data_inicio: data(-dia), data_fim: data(7 * dia),
}, org)
check('lote criado com teto calculado', lote.body.teto_revenda === 120, `teto ${lote.body.teto_revenda}`)

const repetido = await api('POST', `/eventos/${evId}/lotes`, {
  setor: 'Pista', nome: '1o lote', preco: 999, quantidade: 1,
  data_inicio: data(-dia), data_fim: data(7 * dia),
}, org)
check('nao repete setor + lote', repetido.status === 409, repetido.body.erro)

const invertido = await api('POST', `/eventos/${evId}/lotes`, {
  setor: 'Pista', nome: 'invertido', preco: 10, quantidade: 1,
  data_inicio: data(7 * dia), data_fim: data(dia),
}, org)
check('data_fim antes do inicio e barrada', invertido.status === 400, invertido.body.erro)

const depoisDoShow = await api('POST', `/eventos/${evId}/lotes`, {
  setor: 'Pista', nome: 'tarde demais', preco: 10, quantidade: 1,
  data_inicio: data(dia), data_fim: '2027-06-01 00:00:00',
}, org)
check('venda nao termina depois do evento', depoisDoShow.status === 400, depoisDoShow.body.erro)

// mesmo setor, fase seguinte, ainda fechada
const loteFuturo = await api('POST', `/eventos/${evId}/lotes`, {
  setor: 'Pista', nome: '2o lote', preco: 150, quantidade: 5, margem_revenda: 20,
  data_inicio: data(30 * dia), data_fim: data(40 * dia),
}, org)
// outro setor, aberto junto com o 1o lote
const loteCamarote = await api('POST', `/eventos/${evId}/lotes`, {
  setor: 'Camarote', nome: '1o lote', preco: 300, quantidade: 5, margem_revenda: 10,
  data_inicio: data(-dia), data_fim: data(7 * dia),
}, org)
check('setores diferentes convivem', loteFuturo.status === 201 && loteCamarote.status === 201)

await api('POST', `/eventos/${evId}/fornecedores-externos`, { nome: 'Buffet do Ze', servico: 'Comida', valor: 5000 }, org)

// outro organizador nao mexe nesse evento
const org2 = await criar('organizador', 'Intruso')
const invasao = await api('POST', `/eventos/${evId}/lotes`, { nome: 'x', preco: 1, quantidade: 1 }, org2)
check('organizador nao mexe em evento alheio', invasao.status === 403)

// 6. solicitacao de servico + chat
// organizador ainda em analise: o pedido fica retido
const sol = await api('POST', `/eventos/${evId}/solicitacoes`, {
  id_servico: serv.body.id_servico, mensagem: 'Topa fechar?', valor_proposto: 14000,
}, org)
check('pedido de organizador em analise fica retido', sol.status === 201 && sol.body.status === 'aguardando_organizador' && !sol.body.id_chat)
const dup = await api('POST', `/eventos/${evId}/solicitacoes`, { id_servico: serv.body.id_servico }, org)
check('nao solicita o mesmo servico 2x', dup.status === 409)

const inboxRetido = await api('GET', '/solicitacoes', null, forn)
check('fornecedor nao ve o pedido retido', inboxRetido.body.length === 0)
const aceitarRetido = await api('POST', `/solicitacoes/${sol.body.id_solicitacao}/aceitar`, {}, forn)
check('fornecedor nao responde pedido retido', aceitarRetido.status === 404)

const filaOrg = await api('GET', '/admin/credenciamentos?perfil=organizador', null, adm)
check('adm ve a fila de organizadores', filaOrg.body.length === 1 && filaOrg.body[0].nome_organizacao === 'Lucas Producoes' && filaOrg.body[0].categorias.length === 1)
const recusaSemMotivo = await api('POST', `/admin/credenciamentos/${credOrg.body.id_credenciamento}/recusar`, {}, adm)
check('recusa sem motivo da 400', recusaSemMotivo.status === 400)
const aprovOrg = await api('POST', `/admin/credenciamentos/${credOrg.body.id_credenciamento}/aprovar`, {}, adm)
check('aprovar o organizador libera o pedido retido', aprovOrg.body.solicitacoes_liberadas === 1, JSON.stringify(aprovOrg.body))

const inbox = await api('GET', '/solicitacoes', null, forn)
check('fornecedor ve a solicitacao com chat', inbox.body.length === 1 && !!inbox.body[0].id_chat && inbox.body[0].status === 'em_analise')
sol.body.id_chat = inbox.body[0].id_chat

const semLote = await api('POST', `/eventos/${ev2.body.id_evento}/enviar-analise`, {}, org)
check('evento sem lote nao vai pra analise', semLote.status === 400, semLote.body.erro)

// recusa com motivo e reenvio
const credIntruso = await api('POST', '/credenciamento', { ...dadosOrg, nome_organizacao: 'Intruso Eventos' }, org2)
await api('POST', `/admin/credenciamentos/${credIntruso.body.id_credenciamento}/recusar`, { observacao: 'Descreva melhor sua experiencia' }, adm)
const meuRecusado = await api('GET', '/credenciamento/meu', null, org2)
check('recusado ve o motivo', meuRecusado.body.situacao === 'recusado' && meuRecusado.body.motivo_recusa === 'Descreva melhor sua experiencia')
const reenvio = await api('POST', '/credenciamento', { ...dadosOrg, nome_organizacao: 'Intruso Eventos', descricao: 'Fiz 10 festas universitarias' }, org2)
check('recusado corrige e reenvia', reenvio.status === 201)
await api('POST', `/solicitacoes/${sol.body.id_solicitacao}/aceitar`, {}, forn)

await api('POST', `/chats/${sol.body.id_chat}/mensagens`, { texto: 'Fechado, mando o contrato' }, forn)
const msgs = await api('GET', `/chats/${sol.body.id_chat}/mensagens`, null, org)
check('chat tem as 2 mensagens', msgs.body.length === 2, `${msgs.body.length}`)
const bisbilhoteiro = await api('GET', `/chats/${sol.body.id_chat}/mensagens`, null, c1)
check('estranho nao le o chat', bisbilhoteiro.status === 403)

// 7. aprovacao do evento
await api('POST', `/eventos/${evId}/enviar-analise`, {}, org)
const fila = await api('GET', '/admin/eventos', null, adm)
const naFila = fila.body.find((e) => e.id_evento === evId)
check('adm ve o evento na fila', !!naFila)
check('adm ve o custo dos fornecedores', Number(naFila.custo_fornecedores_externos) === 5000 && Number(naFila.custo_fornecedores_plataforma) === 14000,
  `externo ${naFila?.custo_fornecedores_externos} / plataforma ${naFila?.custo_fornecedores_plataforma}`)

const publicoAntes = await api('GET', '/eventos')
check('evento em analise nao e publico', !publicoAntes.body.some((e) => e.id_evento === evId))

const aprov = await api('POST', `/admin/eventos/${evId}/aprovar`, {}, adm)
check('aprovacao gera os ingressos dos 3 lotes', aprov.body.ingressos_gerados === 20, `${aprov.body.ingressos_gerados}`)
const publicoDepois = await api('GET', '/eventos')
check('evento aprovado fica publico', publicoDepois.body.some((e) => e.id_evento === evId))

// 8. compra
const compra = await api('POST', '/pedidos', { id_lote: lote.body.id_lote, quantidade: 2, metodo: 'pix' }, c1)
check('compra 2 ingressos do lote', compra.status === 201 && Number(compra.body.valor_total) === 200, `total ${compra.body.valor_total}`)
const demais = await api('POST', '/pedidos', { id_lote: lote.body.id_lote, quantidade: 20, metodo: 'pix' }, c2)
check('limite de 6 ingressos por pedido', demais.status === 400, demais.body.erro)

// sobraram 8: um terceiro comprador leva 6 e tenta levar mais 6
const c3 = await criar('comprador', 'Duda Compradora')
const seis = await api('POST', '/pedidos', { id_lote: lote.body.id_lote, quantidade: 6, metodo: 'pix' }, c3)
check('compra os 6 que cabem no pedido', seis.status === 201, `total ${seis.body.valor_total}`)
const estourou = await api('POST', '/pedidos', { id_lote: lote.body.id_lote, quantidade: 6, metodo: 'pix' }, c3)
check('nao vende mais do que tem', estourou.status === 409, `restavam ${estourou.body.disponiveis}`)

const fechado = await api('POST', '/pedidos', { id_lote: loteFuturo.body.id_lote, quantidade: 1, metodo: 'pix' }, c1)
check('lote fora da janela nao vende', fechado.status === 409, fechado.body.erro)

const detalhe = await api('GET', `/eventos/${evId}`)
const pista1 = detalhe.body.lotes.find((l) => l.setor === 'Pista' && l.nome === '1o lote')
const pista2 = detalhe.body.lotes.find((l) => l.nome === '2o lote')
check('detalhe diz qual lote esta aberto', Number(pista1.aberto) === 1 && Number(pista2.aberto) === 0)
check('detalhe diz quantos sobraram', Number(pista1.disponiveis) === 2, `${pista1.disponiveis}`)

const meus = await api('GET', '/ingressos/meus', null, c1)
check('comprador ve os ingressos dele', meus.body.length === 2)
check('ingresso traz o teto de revenda', meus.body[0].teto_revenda === 120)
check('setor do ingresso e o setor, nao o nome do lote',
  meus.body[0].setor === 'Pista' && meus.body[0].lote === '1o lote',
  `setor ${meus.body[0].setor} / lote ${meus.body[0].lote}`)

// 9. revenda com teto
const idIngresso = meus.body[0].id_ingresso
const caro = await api('POST', `/ingressos/${idIngresso}/anunciar`, { preco: 150 }, c1)
check('revenda acima do teto e barrada', caro.status === 422, `teto ${caro.body.teto_revenda}`)
const alheio = await api('POST', `/ingressos/${idIngresso}/anunciar`, { preco: 110 }, c2)
check('nao anuncia ingresso dos outros', alheio.status === 403)
const anuncio = await api('POST', `/ingressos/${idIngresso}/anunciar`, { preco: 115 }, c1)
check('revenda dentro do teto passa', anuncio.status === 200 && anuncio.body.preco === 115)

const vitrine = await api('GET', `/ingressos/revenda/${evId}`)
check('ingresso aparece na vitrine de revenda', vitrine.body.length === 1)

const proprio = await api('POST', '/pedidos/revenda', { id_ingresso: idIngresso, metodo: 'cartao' }, c1)
check('nao compra o proprio ingresso', proprio.status === 409)

const revenda = await api('POST', '/pedidos/revenda', { id_ingresso: idIngresso, metodo: 'cartao' }, c2)
check('outro comprador leva a revenda', revenda.status === 201 && Number(revenda.body.valor_total) === 115)

const doC1 = await api('GET', '/ingressos/meus', null, c1)
const doC2 = await api('GET', '/ingressos/meus', null, c2)
check('ingresso trocou de dono', doC1.body.length === 1 && doC2.body.length === 1)

const duasVezes = await api('POST', '/pedidos/revenda', { id_ingresso: idIngresso, metodo: 'pix' }, c1)
check('nao compra o mesmo ingresso 2x', duasVezes.status === 409)

const pedidosC2 = await api('GET', '/pedidos/meus', null, c2)
check('historico de pedidos vem com os itens', pedidosC2.body?.[0]?.itens?.length === 1, JSON.stringify(pedidosC2).slice(0,200))

// --- chat direto do administrador ---
const semPermissao2 = await api('POST', '/chats', { id_usuario: 2 }, org)
check('so o adm abre conversa direta', semPermissao2.status === 403)

const pessoas = await api('GET', '/chats/usuarios?busca=', null, adm)
check('adm lista usuarios pro chat', pessoas.body.length >= 2, `${pessoas.body.length}`)
check('adm nao aparece na propria lista', !pessoas.body.some((u) => u.tipo === 'adm' && u.email === 'admin@trocaticket.com.br'))

const direto = await api('POST', '/chats', {
  id_usuario: pessoas.body[0].id_usuario, mensagem: 'Oi, uma duvida.',
}, adm)
check('adm abre conversa direta', direto.status === 201 && !!direto.body.id_chat)

const denovo = await api('POST', '/chats', { id_usuario: pessoas.body[0].id_usuario }, adm)
check('nao duplica a conversa direta', denovo.body.id_chat === direto.body.id_chat)

const doAdm = await api('GET', '/chats', null, adm)
check('conversa direta aparece na lista do adm', doAdm.body.some((c) => c.id_chat === direto.body.id_chat))

console.log(linhas.join('\n'))
console.log(`\n${ok} ok / ${fail} falha(s)`)
process.exit(fail ? 1 : 0)
