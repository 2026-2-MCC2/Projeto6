// Teste de fumaca do backend do TrocaTicket.
// Sobe o servidor, roda o banco limpo com o seed e execute: npm test
const base = process.env.API || 'http://localhost:3000/api'
let ok = 0, fail = 0
const linhas = []
const avisos = []

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
// periodo, publico e margem de um evento (FLX-02). inicio no formato do banco.
const periodo = (inicio, horas = 8) => ({
  data_inicio: inicio,
  data_fim: new Date(new Date(inicio.replace(' ', 'T')).getTime() + horas * 3600000)
    .toISOString().slice(0, 19).replace('T', ' '),
  publico_minimo: 500, publico_maximo: 1000, margem_lucro: 20,
})
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
  nome_empresa: `Gabisom ${n}`, razao_social: 'Gabisom Eventos Ltda', cnpj: cnpjValido(String(n).slice(-12)),
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

// as contas sao comparadas pelo nome (que leva o Date.now()), entao o teste
// passa mesmo com cadastros de rodadas anteriores no banco
const naVitrine = (lista) => lista.some((f) => f.nome_empresa === dadosForn.nome_empresa)
const vitrineAntes = await api('GET', '/fornecedores')
check('fornecedor em analise nao aparece na vitrine', !naVitrine(vitrineAntes.body))

const filaCred = await api('GET', '/admin/credenciamentos?perfil=fornecedor', null, adm)
const meuPedido = filaCred.body.find((c) => c.id_credenciamento === cred.body.id_credenciamento)
check('adm ve a fila de fornecedores com os dados', meuPedido?.razao_social === 'Gabisom Eventos Ltda', `${filaCred.body.length} na fila`)
await api('POST', `/admin/credenciamentos/${cred.body.id_credenciamento}/aprovar`, {}, adm)
const vitrineDepois = await api('GET', '/fornecedores')
check('credenciado aparece na vitrine', naVitrine(vitrineDepois.body))
const historico = await api('GET', '/admin/credenciamentos?perfil=fornecedor&status=aprovado', null, adm)
const aprovado = historico.body.find((c) => c.id_credenciamento === cred.body.id_credenciamento)
check('fica registrado quem aprovou e quando', aprovado?.analisado_por === 'Administrador' && !!aprovado?.revisado_em)

// 4b. credenciamento do organizador
const semCred = await api('POST', '/eventos', {
  nome: 'Antes do credenciamento', ...periodo('2027-03-14 20:00:00'), id_categoria: cat.body.id_categoria,
  local: { nome: 'Arena TT', cidade: 'Sao Paulo', estado: 'SP' },
}, org)
check('organizador sem credenciamento nao cria evento', semCred.status === 403 && semCred.body.codigo === 'credenciamento_necessario', semCred.body.erro)

const dadosOrg = {
  tipo_pessoa: 'fisica', nome_organizacao: `Lucas Producoes ${n}`, cidade: 'Sao Paulo', estado: 'SP',
  telefone: '11977776666', categorias: [cat.body.id_categoria], descricao: 'Organizo shows ha 3 anos',
  publico_medio: 800, declaracao: true,
}
const juridicaSemCnpj = await api('POST', '/credenciamento', { ...dadosOrg, tipo_pessoa: 'juridica' }, org)
check('organizador pessoa juridica precisa de CNPJ e razao social', juridicaSemCnpj.status === 400 && !!juridicaSemCnpj.body.campos?.cnpj && !!juridicaSemCnpj.body.campos?.razao_social)
const credOrg = await api('POST', '/credenciamento', dadosOrg, org)
check('organizador pede credenciamento', credOrg.status === 201, credOrg.body.erro)

// 5. evento + lotes + fornecedor externo
const semLocal = await api('POST', '/eventos', {
  nome: 'Sem lugar', ...periodo('2027-03-14 20:00:00'), id_categoria: cat.body.id_categoria,
}, org)
check('evento sem local e barrado', semLocal.status === 400, semLocal.body.erro)

const ufRuim = await api('POST', '/eventos', {
  nome: 'UF errada', ...periodo('2027-03-14 20:00:00'), id_categoria: cat.body.id_categoria,
  local: { nome: 'Arena TT', cidade: 'Sao Paulo', estado: 'Sao Paulo' },
}, org)
check('estado com mais de 2 letras e barrado', ufRuim.status === 400, ufRuim.body.erro)

const ev = await api('POST', '/eventos', {
  nome: 'Festival Pulse', ...periodo('2027-03-14 20:00:00'),
  id_categoria: cat.body.id_categoria,
  local: { nome: 'Arena TT', cidade: 'Sao Paulo', estado: 'sp', endereco: 'Rua 1, 100' },
}, org)
check('organizador cria evento com local digitado', ev.status === 201)

// o segundo evento no mesmo lugar reaproveita a linha em vez de duplicar
const locaisAntes = (await api('GET', '/locais')).body.length
const ev2 = await api('POST', '/eventos', {
  nome: 'Outro no mesmo lugar', ...periodo('2027-04-10 20:00:00'),
  id_categoria: cat.body.id_categoria,
  local: { nome: 'Arena TT', cidade: 'Sao Paulo', estado: 'SP', endereco: 'Rua 1, 100' },
}, org)
const locaisDepois = (await api('GET', '/locais')).body.length
check('mesmo local nao duplica', ev2.status === 201 && locaisDepois === locaisAntes,
  `${locaisAntes} -> ${locaisDepois}`)
const evId = ev.body.id_evento
const org2 = await criar('organizador', 'Intruso')

// 5b. planejamento do evento (FLX-02) e editar/excluir (WEB-05)
const baseEv = { nome: 'Festival Pulse', id_categoria: cat.body.id_categoria,
  local: { nome: 'Arena TT', cidade: 'Sao Paulo', estado: 'SP', endereco: 'Rua 1, 100' } }
const publicoRuim = await api('POST', '/eventos', { ...baseEv, ...periodo('2027-03-14 20:00:00'), publico_minimo: 900, publico_maximo: 100 }, org)
check('publico maximo menor que o minimo da 400', publicoRuim.status === 400, publicoRuim.body.erro)
const margemRuim = await api('POST', '/eventos', { ...baseEv, ...periodo('2027-03-14 20:00:00'), margem_lucro: 100 }, org)
check('margem de 100% da 400', margemRuim.status === 400, margemRuim.body.erro)
const periodoRuim = await api('POST', '/eventos', { ...baseEv, ...periodo('2027-03-14 20:00:00', -5) }, org)
check('evento que termina antes de comecar da 400', periodoRuim.status === 400, periodoRuim.body.erro)

const item1 = await api('POST', `/eventos/${evId}/itens`, { categoria: 'iluminacao', descricao: 'Iluminacao de palco', quantidade: 1, custo_estimado: 12000 }, org)
const item2 = await api('POST', `/eventos/${evId}/itens`, { categoria: 'seguranca', descricao: 'Seguranca (20 pessoas)', quantidade: 20, custo_estimado: 8000 }, org)
check('organizador cadastra itens de custo', item1.status === 201 && item2.status === 201, item1.body.erro)
const itemRuim = await api('POST', `/eventos/${evId}/itens`, { categoria: 'foguete', descricao: 'x', quantidade: 0, custo_estimado: -1 }, org)
check('item invalido da 400', itemRuim.status === 400, itemRuim.body.erro)
const itemEdit = await api('PUT', `/eventos/${evId}/itens/${item2.body.id_item}`, { categoria: 'seguranca', descricao: 'Seguranca (25 pessoas)', quantidade: 25, custo_estimado: 10000 }, org)
check('organizador edita item', itemEdit.status === 200 && itemEdit.body.quantidade === 25)
const custoFiscal = await api('POST', `/eventos/${evId}/custos`, { tipo: 'fiscal', descricao: 'ISS e taxas', valor: 3000 }, org)
const custoOp = await api('POST', `/eventos/${evId}/custos`, { tipo: 'operacional', descricao: 'Equipe de producao', valor: 4500.5 }, org)
check('organizador cadastra outros custos', custoFiscal.status === 201 && custoOp.status === 201)
const custoRuim = await api('POST', `/eventos/${evId}/custos`, { tipo: 'imposto', descricao: '', valor: 10 }, org)
check('custo invalido da 400', custoRuim.status === 400)
const plano = await api('GET', `/eventos/${evId}/planejamento`, null, org)
check('planejamento soma itens e custos', plano.body.totais?.itens_estimado === 22000 && plano.body.totais?.custos === 7500.5,
  JSON.stringify(plano.body.totais))
const planoAlheio = await api('GET', `/eventos/${evId}/planejamento`, null, org2)
const itemAlheio = await api('POST', `/eventos/${evId}/itens`, { categoria: 'comida', descricao: 'x', quantidade: 1, custo_estimado: 1 }, org2)
check('outro organizador nao ve nem mexe no planejamento', planoAlheio.status === 403 && itemAlheio.status === 403)

const editado = await api('PUT', `/eventos/${evId}`, { ...baseEv, ...periodo('2027-03-14 20:00:00', 10), publico_minimo: 600, publico_maximo: 1200, publico_esperado: 900, margem_lucro: 25 }, org)
check('organizador edita o evento', editado.status === 200 && editado.body.publico_esperado === 900, editado.body.erro)
const editRuim = await api('PUT', `/eventos/${evId}`, { ...baseEv, ...periodo('2027-03-14 20:00:00'), publico_minimo: 0 }, org)
check('editar com dados invalidos da 400', editRuim.status === 400)
const editAlheio = await api('PUT', `/eventos/${evId}`, { ...baseEv, ...periodo('2027-03-14 20:00:00') }, org2)
const editNada = await api('PUT', '/eventos/999999', { ...baseEv, ...periodo('2027-03-14 20:00:00') }, org)
check('editar evento alheio da 403 e inexistente 404', editAlheio.status === 403 && editNada.status === 404)

const descartavel = await api('POST', '/eventos', { ...baseEv, nome: 'Vai ser excluido', ...periodo('2027-05-01 20:00:00') }, org)
await api('POST', `/eventos/${descartavel.body.id_evento}/itens`, { categoria: 'comida', descricao: 'Buffet', quantidade: 1, custo_estimado: 500 }, org)
const delAlheio = await api('DELETE', `/eventos/${descartavel.body.id_evento}`, null, org2)
const del = await api('DELETE', `/eventos/${descartavel.body.id_evento}`, null, org)
const delDeNovo = await api('DELETE', `/eventos/${descartavel.body.id_evento}`, null, org)
check('excluir: alheio 403, dono exclui, depois 404', delAlheio.status === 403 && del.status === 200 && delDeNovo.status === 404)

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
const pedidoOrg = filaOrg.body.find((c) => c.id_credenciamento === credOrg.body.id_credenciamento)
check('adm ve a fila de organizadores', pedidoOrg?.nome_organizacao === dadosOrg.nome_organizacao && pedidoOrg?.categorias.length === 1, `${filaOrg.body.length} na fila`)
const recusaSemMotivo = await api('POST', `/admin/credenciamentos/${credOrg.body.id_credenciamento}/recusar`, {}, adm)
check('recusa sem motivo da 400', recusaSemMotivo.status === 400)
const aprovOrg = await api('POST', `/admin/credenciamentos/${credOrg.body.id_credenciamento}/aprovar`, {}, adm)
check('aprovar o organizador libera o pedido retido', aprovOrg.body.solicitacoes_liberadas === 1, JSON.stringify(aprovOrg.body))

const inbox = await api('GET', '/solicitacoes', null, forn)
check('fornecedor ve a solicitacao com chat', inbox.body.length === 1 && !!inbox.body[0].id_chat && inbox.body[0].status === 'em_analise')
sol.body.id_chat = inbox.body[0].id_chat

const semItem = await api('POST', `/eventos/${ev2.body.id_evento}/enviar-analise`, {}, org)
check('evento sem item de custo nao vai pra analise', semItem.status === 400, semItem.body.erro)

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

// 6b. cotacao (FLX-03) e propostas (FLX-04)
const forn2 = await criar('fornecedor', 'Luz & Cia')
const cred2 = await api('POST', '/credenciamento', { ...dadosForn, nome_empresa: `Luz e Cia ${n}`, cnpj: cnpjValido(String(n + 7).slice(-12)) }, forn2)
await api('POST', `/admin/credenciamentos/${cred2.body.id_credenciamento}/aprovar`, {}, adm)
const fornSemCred = await criar('fornecedor', 'Sem Credenciamento')
const amanha = new Date(Date.now() + 30 * dia).toISOString().slice(0, 10)
const ontem = new Date(Date.now() - dia).toISOString().slice(0, 10)

const cotAlheia = await api('POST', `/eventos/${evId}/abrir-cotacao`, {}, org2)
check('outro organizador nao abre a cotacao', cotAlheia.status === 403)
const cotSemItem = await api('POST', `/eventos/${ev2.body.id_evento}/abrir-cotacao`, {}, org)
check('evento sem item nao vai para cotacao', cotSemItem.status === 400, cotSemItem.body.erro)
const cot = await api('POST', `/eventos/${evId}/abrir-cotacao`, {}, org)
check('organizador publica o evento para cotacao', cot.status === 200 && cot.body.status === 'em_cotacao', cot.body.erro)
const itemNaCotacao = await api('POST', `/eventos/${evId}/itens`, { categoria: 'comida', descricao: 'x', quantidade: 1, custo_estimado: 1 }, org)
check('itens nao mudam durante a cotacao', itemNaCotacao.status === 409)

const cotSemCred = await api('GET', '/cotacoes', null, fornSemCred)
const cotComprador = await api('GET', '/cotacoes', null, c1)
check('fornecedor nao credenciado e comprador nao veem cotacoes', cotSemCred.status === 403 && cotSemCred.body.codigo === 'credenciamento_necessario' && cotComprador.status === 403)
const cotacoes = await api('GET', '/cotacoes', null, forn)
check('fornecedor credenciado ve o evento em cotacao', cotacoes.body.some((e) => e.id_evento === evId))
const cotDetalhe = await api('GET', `/cotacoes/${evId}`, null, forn)
check('detalhe da cotacao traz os itens sem o custo estimado', cotDetalhe.body.itens?.length === 2 && cotDetalhe.body.itens[0].custo_estimado === undefined)

const prop = (valor, validade = amanha) => ({ valor, descricao: 'Equipamento e equipe inclusos', validade, observacoes: 'Pagamento 50% antes' })
const p1 = await api('POST', `/itens/${item1.body.id_item}/propostas`, prop(11000), forn)
check('fornecedor envia proposta para um item', p1.status === 201 && p1.body.situacao === 'enviada', p1.body.erro)
const pDup = await api('POST', `/itens/${item1.body.id_item}/propostas`, prop(10000), forn)
check('nao manda duas propostas para o mesmo item', pDup.status === 409)
const pVencida = await api('POST', `/itens/${item2.body.id_item}/propostas`, prop(9000, ontem), forn)
check('validade anterior a hoje da 400', pVencida.status === 400, pVencida.body.erro)
const pEdit = await api('PUT', `/propostas/${p1.body.id_proposta}`, prop(10500), forn)
check('fornecedor edita a propria proposta', pEdit.status === 200 && pEdit.body.valor === 10500)
const pEditAlheio = await api('PUT', `/propostas/${p1.body.id_proposta}`, prop(1), forn2)
check('outro fornecedor nao mexe na proposta', pEditAlheio.status === 404)
const p2 = await api('POST', `/itens/${item1.body.id_item}/propostas`, prop(9800), forn2)
const p3 = await api('POST', `/itens/${item2.body.id_item}/propostas`, prop(9200), forn2)
const p3c = await api('POST', `/propostas/${p3.body.id_proposta}/cancelar`, {}, forn2)
check('segundo fornecedor envia e cancela', p2.status === 201 && p3c.body.situacao === 'cancelada')
const p3r = await api('POST', `/itens/${item2.body.id_item}/propostas`, prop(9100), forn2)
check('proposta cancelada pode ser enviada de novo', p3r.status === 201 && p3r.body.id_proposta === p3.body.id_proposta)

// uma proposta cancelada, para conferir depois que ela nao pode ser escolhida
const pCanc = await api('POST', `/itens/${item2.body.id_item}/propostas`, prop(9500), forn)
await api('POST', `/propostas/${pCanc.body.id_proposta}/cancelar`, {}, forn)
const selAberta = await api('POST', `/propostas/${p1.body.id_proposta}/selecionar`, {}, org)
check('com a cotacao aberta ainda nao escolhe proposta', selAberta.status === 409, selAberta.body.erro)

const analiseNaCotacao = await api('POST', `/eventos/${evId}/enviar-analise`, {}, org)
check('com a cotacao aberta nao vai para analise', analiseNaCotacao.status === 409)
const planoCot = await api('GET', `/eventos/${evId}/planejamento`, null, org)
check('organizador ve quantas propostas cada item recebeu', Number(planoCot.body.itens?.find((i) => i.id_item === item1.body.id_item)?.total_propostas) === 2)
const enc = await api('POST', `/eventos/${evId}/encerrar-cotacao`, {}, org)
check('organizador encerra a cotacao', enc.status === 200 && enc.body.status === 'cotacao_encerrada')
const pDepois = await api('POST', `/itens/${item2.body.id_item}/propostas`, prop(5000), forn)
const pEditDepois = await api('PUT', `/propostas/${p1.body.id_proposta}`, prop(1000), forn)
check('com a cotacao encerrada nao envia nem edita', pDepois.status === 409 && pEditDepois.status === 409)
const minhas = await api('GET', '/propostas/minhas', null, forn2)
check('historico mostra as propostas com a situacao', minhas.body.length === 2 && minhas.body.every((p) => p.situacao === 'enviada' && p.evento))

// 6c. comparar, selecionar e consolidar (FLX-05)
const comp = await api('GET', `/eventos/${evId}/propostas`, null, org)
const comp1 = comp.body.itens?.find((i) => i.id_item === item1.body.id_item)
check('organizador compara as propostas do item, da menor para a maior',
  comp1?.propostas.length === 2 && Number(comp1.propostas[0].valor) === 9800 && Number(comp1.propostas[1].valor) === 10500,
  JSON.stringify(comp1?.propostas.map((p) => p.valor)))
check('proposta cancelada nao aparece na comparacao',
  !comp.body.itens?.find((i) => i.id_item === item2.body.id_item)?.propostas.some((p) => p.id_proposta === pCanc.body.id_proposta))
const compAlheio = await api('GET', `/eventos/${evId}/propostas`, null, org2)
check('outro organizador nao ve as propostas', compAlheio.status === 403)
const selAlheio = await api('POST', `/propostas/${p2.body.id_proposta}/selecionar`, {}, org2)
check('outro organizador nao seleciona', selAlheio.status === 403)
const selCanc = await api('POST', `/propostas/${pCanc.body.id_proposta}/selecionar`, {}, org)
check('proposta cancelada nao pode ser selecionada', selCanc.status === 409, selCanc.body.erro)

const sel = await api('POST', `/propostas/${p1.body.id_proposta}/selecionar`, {}, org)
const sel2 = await api('POST', `/propostas/${p2.body.id_proposta}/selecionar`, {}, org)
const depoisSel = await api('GET', `/eventos/${evId}/propostas`, null, org)
const situacoes = Object.fromEntries(depoisSel.body.itens.find((i) => i.id_item === item1.body.id_item).propostas.map((p) => [p.id_proposta, p.situacao]))
check('selecionar outra proposta do item troca a escolha',
  sel.status === 200 && sel2.status === 200 && situacoes[p2.body.id_proposta] === 'selecionada' && situacoes[p1.body.id_proposta] === 'nao_selecionada',
  JSON.stringify(situacoes))
const desm = await api('POST', `/propostas/${p2.body.id_proposta}/desmarcar`, {}, org)
const depoisDesm = await api('GET', `/eventos/${evId}/propostas`, null, org)
check('desmarcar volta todas para enviada',
  desm.status === 200 && depoisDesm.body.itens.find((i) => i.id_item === item1.body.id_item).propostas.every((p) => p.situacao === 'enviada'))
await api('POST', `/propostas/${p2.body.id_proposta}/selecionar`, {}, org)

// item1 pela proposta (9.800) + item2 pelo custo estimado (10.000) + outros custos (7.500,50)
const orc = await api('GET', `/eventos/${evId}/orcamento`, null, org)
check('orcamento consolidado soma selecionada, estimado e outros custos',
  orc.body.totais?.custo_total === 27300.5 && orc.body.totais.propostas_selecionadas === 9800 && orc.body.totais.itens_sem_proposta === 10000,
  JSON.stringify(orc.body.totais))
const minhasForn2 = await api('GET', '/propostas/minhas', null, forn2)
const minhasForn = await api('GET', '/propostas/minhas', null, forn)
check('fornecedor ve a proposta selecionada ou nao selecionada',
  minhasForn2.body.some((p) => p.id_proposta === p2.body.id_proposta && p.situacao === 'selecionada')
  && minhasForn.body.some((p) => p.id_proposta === p1.body.id_proposta && p.situacao === 'nao_selecionada'))
const delComSel = await api('DELETE', `/eventos/${evId}`, null, org)
check('evento com proposta selecionada nao pode ser excluido', delComSel.status === 409, delComSel.body.erro)

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

// 7b. visao do adm e relatorios (FLX-07)
const todos = await api('GET', '/admin/eventos?status=todos', null, adm)
const noPainel = todos.body.find((e) => e.id_evento === evId)
check('adm ve todos os eventos com custo consolidado e andamento',
  Number(noPainel?.custo_consolidado) === 27300.5 && Number(noPainel.propostas_recebidas) === 3 && Number(noPainel.propostas_selecionadas) === 1 && Number(noPainel.total_itens) === 2,
  JSON.stringify({ c: noPainel?.custo_consolidado, r: noPainel?.propostas_recebidas, s: noPainel?.propostas_selecionadas }))
const detAdm = await api('GET', `/admin/eventos/${evId}`, null, adm)
check('detalhe do adm traz itens, custos e orcamento', detAdm.body.orcamento?.totais.custo_total === 27300.5 && detAdm.body.custos?.length === 2 && detAdm.body.revisado_por === 'Administrador')
const rel = await api('GET', '/admin/relatorios', null, adm)
const somaStatus = Object.values(rel.body.eventos || {}).reduce((a, b) => a + b, 0)
check('relatorio bate com a lista de eventos', somaStatus === todos.body.length && rel.body.valores?.eventos === todos.body.length,
  `${somaStatus} x ${todos.body.length}`)
check('relatorio traz usuarios, credenciamentos e propostas',
  rel.body.usuarios?.organizador >= 2 && rel.body.credenciamento?.fornecedor?.credenciado >= 2 && rel.body.propostas?.selecionada >= 1)
const hist = await api('GET', '/admin/aprovacoes', null, adm)
check('historico mostra quem aprovou o evento e os credenciamentos',
  hist.body.some((h) => h.tipo === 'evento' && h.id === evId && h.decisao === 'aprovado' && h.decidido_por === 'Administrador')
  && hist.body.some((h) => h.tipo === 'credenciamento' && h.decisao === 'recusado' && h.motivo))
const relOrg = await api('GET', '/admin/relatorios', null, org)
check('outros perfis nao veem relatorios', relOrg.status === 403)

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

// 10. cenario de ponta a ponta do documento do PI (secao 10), do zero (FLX-08)
{
  const passo = (nr, nome, cond, extra) => check(`cenario ${nr}: ${nome}`, cond, extra)
  // 1. organizador faz o autocadastro e e aprovado pelo administrador
  const orgC = await criar('organizador', 'Cenario Organizador')
  const credC = await api('POST', '/credenciamento', { ...dadosOrg, nome_organizacao: `Cenario Producoes ${n}` }, orgC)
  const aprovC = await api('POST', `/admin/credenciamentos/${credC.body.id_credenciamento}/aprovar`, {}, adm)
  const meuC = await api('GET', '/credenciamento/meu', null, orgC)
  passo(1, 'organizador se cadastra e e aprovado', aprovC.status === 200 && meuC.body.situacao === 'credenciado')
  // 2. cria um evento e seus itens de custo
  const evC = await api('POST', '/eventos', { ...baseEv, nome: 'Cenario do PI', ...periodo('2027-10-10 19:00:00') }, orgC)
  const itC = await api('POST', `/eventos/${evC.body.id_evento}/itens`, { categoria: 'estrutura', descricao: 'Palco', quantidade: 1, custo_estimado: 40000 }, orgC)
  await api('POST', `/eventos/${evC.body.id_evento}/custos`, { tipo: 'fiscal', descricao: 'Impostos', valor: 10000 }, orgC)
  passo(2, 'cria o evento e os itens de custo', evC.status === 201 && itC.status === 201)
  // 3. um fornecedor aprovado ve o evento e envia uma proposta
  await api('POST', `/eventos/${evC.body.id_evento}/abrir-cotacao`, {}, orgC)
  const vistoC = await api('GET', '/cotacoes', null, forn)
  const propC = await api('POST', `/itens/${itC.body.id_item}/propostas`, prop(38000), forn)
  passo(3, 'fornecedor aprovado ve o evento e envia proposta', vistoC.body.some((e) => e.id_evento === evC.body.id_evento) && propC.status === 201)
  // 4. o organizador consulta e seleciona a proposta
  await api('POST', `/eventos/${evC.body.id_evento}/encerrar-cotacao`, {}, orgC)
  const compC = await api('GET', `/eventos/${evC.body.id_evento}/propostas`, null, orgC)
  const selC = await api('POST', `/propostas/${propC.body.id_proposta}/selecionar`, {}, orgC)
  passo(4, 'organizador consulta e seleciona a proposta', compC.body.itens?.[0]?.propostas.length === 1 && selC.status === 200)
  // 5. os custos sao consolidados
  const orcC = await api('GET', `/eventos/${evC.body.id_evento}/orcamento`, null, orgC)
  passo(5, 'custos consolidados (38.000 + 10.000)', orcC.body.totais?.custo_total === 48000, JSON.stringify(orcC.body.totais))
  // 6. a plataforma calcula o ticket estimado (FLX-06)
  const ticketC = await api('GET', `/eventos/${evC.body.id_evento}/ticket`, null, orgC)
  if (ticketC.status === 404 && ticketC.body.erro === 'rota nao encontrada') {
    avisos.push('cenario 6: o calculo do ticket ainda depende da FLX-06 (#42); este passo vira um check quando a rota existir')
  } else {
    passo(6, 'calcula o ticket estimado', ticketC.status === 200, JSON.stringify(ticketC.body).slice(0, 120))
  }
  // 7. o administrador ve o evento e as informacoes gerenciais
  await api('POST', `/eventos/${evC.body.id_evento}/enviar-analise`, {}, orgC)
  const vistoAdm = await api('GET', `/admin/eventos/${evC.body.id_evento}`, null, adm)
  const relC = await api('GET', '/admin/relatorios', null, adm)
  passo(7, 'administrador ve o evento e os relatorios',
    vistoAdm.body.orcamento?.totais.custo_total === 48000 && vistoAdm.body.status === 'em_analise' && relC.status === 200)
}

console.log(linhas.join('\n'))
if (avisos.length) console.log('\n' + avisos.map((a) => 'AVISO ' + a).join('\n'))
console.log(`\n${ok} ok / ${fail} falha(s)`)
process.exit(fail ? 1 : 0)
