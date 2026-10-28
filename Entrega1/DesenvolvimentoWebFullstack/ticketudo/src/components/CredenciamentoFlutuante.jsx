import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { catalogo, credenciamento } from '../api'
import { AREAS_FORNECEDOR, DECLARACAO } from '../data/credenciamento'
import { useApp } from '../state/useApp'
import { cnpj, soData, telefone } from '../utils/format'
import { UFS, cnpjValido, soDigitos, telefoneValido } from '../utils/validacao'

// Pop-up de credenciamento no canto da tela (FLX-09). Aparece para
// organizador e fornecedor ainda nao credenciados. Minimizado mostra a
// situacao; expandido mostra o formulario, o andamento ou o motivo da recusa.

const TITULO = {
  nao_solicitado: 'Complete seu credenciamento',
  em_analise: 'Credenciamento em análise',
  recusado: 'Credenciamento recusado: ver motivo',
}

// enquanto esta em analise, confere de tempos em tempos se o adm ja decidiu
const INTERVALO = 60000

function vazio(perfil) {
  const base = { cidade: '', estado: '', telefone: '', descricao: '', link: '', categorias: [], declaracao: false }
  return perfil === 'organizador'
    ? { ...base, tipo_pessoa: '', nome_organizacao: '', razao_social: '', cnpj: '', publico_medio: '' }
    : { ...base, nome_empresa: '', razao_social: '', cnpj: '' }
}

// dados ja enviados (reenvio depois de recusado) viram o formulario preenchido
function preencher(perfil, dados) {
  const form = vazio(perfil)
  if (!dados) return form
  for (const campo of Object.keys(form)) {
    if (campo === 'declaracao') continue
    if (dados[campo] !== null && dados[campo] !== undefined) form[campo] = dados[campo]
  }
  form.publico_medio = dados.publico_medio ? String(dados.publico_medio) : ''
  form.telefone = dados.telefone ? telefone(dados.telefone) : ''
  form.cnpj = dados.cnpj ? cnpj(dados.cnpj) : ''
  return form
}

function validar(perfil, f) {
  const erros = {}
  const juridica = perfil === 'fornecedor' || f.tipo_pessoa === 'juridica'

  if (perfil === 'organizador') {
    if (!f.tipo_pessoa) erros.tipo_pessoa = 'Escolha pessoa física ou jurídica.'
    if (!f.nome_organizacao.trim()) erros.nome_organizacao = 'Informe o nome da produtora ou nome comercial.'
    if (!f.descricao.trim()) erros.descricao = 'Conte sua experiência com eventos.'
    if (f.publico_medio && !(Number.isInteger(Number(f.publico_medio)) && Number(f.publico_medio) > 0)) {
      erros.publico_medio = 'Use um número inteiro, como 500.'
    }
    if (!f.categorias.length) erros.categorias = 'Escolha ao menos um tipo de evento.'
  } else {
    if (!f.nome_empresa.trim()) erros.nome_empresa = 'Informe o nome da empresa.'
    if (!f.descricao.trim()) erros.descricao = 'Conte quais serviços você oferece.'
    if (!f.categorias.length) erros.categorias = 'Escolha ao menos uma área.'
  }

  if (juridica) {
    if (!f.razao_social.trim()) erros.razao_social = 'Informe a razão social.'
    if (!cnpjValido(f.cnpj)) erros.cnpj = 'CNPJ inválido. Confira os 14 números.'
  }
  if (!f.cidade.trim()) erros.cidade = 'Informe a cidade.'
  if (!f.estado) erros.estado = 'Escolha a UF.'
  if (!telefoneValido(f.telefone)) erros.telefone = 'Telefone com DDD, como (11) 98888-7777.'
  if (!f.declaracao) erros.declaracao = 'Marque a declaração para enviar.'
  return erros
}

function corpoDoEnvio(perfil, f) {
  const corpo = {
    cidade: f.cidade.trim(),
    estado: f.estado,
    telefone: soDigitos(f.telefone),
    descricao: f.descricao.trim(),
    link: f.link.trim() || undefined,
    categorias: f.categorias,
    declaracao: f.declaracao,
  }
  if (perfil === 'organizador') {
    Object.assign(corpo, {
      tipo_pessoa: f.tipo_pessoa,
      nome_organizacao: f.nome_organizacao.trim(),
      publico_medio: f.publico_medio ? Number(f.publico_medio) : undefined,
    })
    if (f.tipo_pessoa === 'juridica') {
      Object.assign(corpo, { razao_social: f.razao_social.trim(), cnpj: soDigitos(f.cnpj) })
    }
  } else {
    Object.assign(corpo, {
      nome_empresa: f.nome_empresa.trim(),
      razao_social: f.razao_social.trim(),
      cnpj: soDigitos(f.cnpj),
    })
  }
  return corpo
}

function Campo({ id, label, erro, dica, children }) {
  return (
    <div className={erro ? 'field has-error' : 'field'}>
      <label htmlFor={id}>{label}</label>
      {children}
      {erro ? <small className="field-error">{erro}</small> : null}
      {!erro && dica ? <small className="field-hint">{dica}</small> : null}
    </div>
  )
}

function Formulario({ perfil, dados, recusado, onEnviado }) {
  const [form, setForm] = useState(() => preencher(perfil, dados))
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [tipos, setTipos] = useState([])

  // tipos de evento vem da tabela categoria
  useEffect(() => {
    if (perfil !== 'organizador') return
    catalogo.categorias().then(setTipos).catch(() => setTipos([]))
  }, [perfil])

  const mudar = (campo, valor) => {
    setForm((f) => ({ ...f, [campo]: valor }))
    setErros((e) => ({ ...e, [campo]: undefined }))
  }

  function alternarCategoria(id) {
    mudar(
      'categorias',
      form.categorias.includes(id) ? form.categorias.filter((c) => c !== id) : [...form.categorias, id],
    )
  }

  async function enviar(e) {
    e.preventDefault()
    setErroGeral(null)
    const encontrados = validar(perfil, form)
    setErros(encontrados)
    if (Object.keys(encontrados).length) {
      setErroGeral('Confira os campos destacados.')
      return
    }

    setEnviando(true)
    try {
      await credenciamento.enviar(corpoDoEnvio(perfil, form))
      onEnviado()
    } catch (err) {
      setErros(err.corpo?.campos || {})
      setErroGeral(err.message)
    } finally {
      setEnviando(false)
    }
  }

  const org = perfil === 'organizador'
  const juridica = !org || form.tipo_pessoa === 'juridica'
  const opcoes = org
    ? tipos.map((t) => ({ id: t.id_categoria, label: t.nome }))
    : AREAS_FORNECEDOR

  return (
    <form className="cred-form" onSubmit={enviar} noValidate>
      {erroGeral ? (
        <p className="form-erro" role="alert">
          {erroGeral}
        </p>
      ) : null}

      {org ? (
        <fieldset className={erros.tipo_pessoa ? 'cred-grupo has-error' : 'cred-grupo'}>
          <legend>Você organiza eventos como</legend>
          <div className="cred-opcoes">
            {[
              ['fisica', 'Pessoa física', 'produtor independente'],
              ['juridica', 'Pessoa jurídica', 'produtora com CNPJ'],
            ].map(([valor, titulo, sub]) => (
              <label className="cred-opcao" key={valor}>
                <input
                  type="radio"
                  name="cred-tipo-pessoa"
                  id={`cred-tipo-${valor}`}
                  checked={form.tipo_pessoa === valor}
                  onChange={() => mudar('tipo_pessoa', valor)}
                />
                <span>
                  {titulo}
                  <small>{sub}</small>
                </span>
              </label>
            ))}
          </div>
          {erros.tipo_pessoa ? <small className="field-error">{erros.tipo_pessoa}</small> : null}
        </fieldset>
      ) : null}

      <Campo
        id="cred-nome"
        label={org ? 'Nome da produtora ou nome comercial' : 'Nome da empresa (nome fantasia)'}
        erro={org ? erros.nome_organizacao : erros.nome_empresa}
      >
        <input
          id="cred-nome"
          value={org ? form.nome_organizacao : form.nome_empresa}
          onChange={(e) => mudar(org ? 'nome_organizacao' : 'nome_empresa', e.target.value)}
          autoComplete="organization"
        />
      </Campo>

      {juridica ? (
        <div className="field-row">
          <Campo id="cred-razao" label="Razão social" erro={erros.razao_social}>
            <input
              id="cred-razao"
              value={form.razao_social}
              onChange={(e) => mudar('razao_social', e.target.value)}
            />
          </Campo>
          <Campo id="cred-cnpj" label="CNPJ" erro={erros.cnpj}>
            <input
              id="cred-cnpj"
              value={form.cnpj}
              onChange={(e) => mudar('cnpj', e.target.value)}
              placeholder="00.000.000/0001-00"
              inputMode="numeric"
            />
          </Campo>
        </div>
      ) : org && form.tipo_pessoa === 'fisica' ? (
        <p className="form-nota">Como pessoa física, usamos o CPF da sua conta.</p>
      ) : null}

      <div className="field-row cred-cidade">
        <Campo id="cred-cidade" label="Cidade de atuação" erro={erros.cidade}>
          <input
            id="cred-cidade"
            value={form.cidade}
            onChange={(e) => mudar('cidade', e.target.value)}
            autoComplete="address-level2"
          />
        </Campo>
        <Campo id="cred-uf" label="UF" erro={erros.estado}>
          <select id="cred-uf" value={form.estado} onChange={(e) => mudar('estado', e.target.value)}>
            <option value="">—</option>
            {UFS.map((uf) => (
              <option key={uf}>{uf}</option>
            ))}
          </select>
        </Campo>
      </div>

      <Campo id="cred-telefone" label="Telefone comercial" erro={erros.telefone}>
        <input
          id="cred-telefone"
          type="tel"
          value={form.telefone}
          onChange={(e) => mudar('telefone', e.target.value)}
          placeholder="(11) 98888-7777"
          autoComplete="tel"
        />
      </Campo>

      <fieldset className={erros.categorias ? 'cred-grupo has-error' : 'cred-grupo'}>
        <legend>{org ? 'Tipos de evento que você organiza' : 'O que você fornece'}</legend>
        <div className="cred-chips">
          {opcoes.map((o) => (
            <label className="cred-chip" key={o.id}>
              <input
                type="checkbox"
                id={`cred-cat-${o.id}`}
                checked={form.categorias.includes(o.id)}
                onChange={() => alternarCategoria(o.id)}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
        {erros.categorias ? <small className="field-error">{erros.categorias}</small> : null}
      </fieldset>

      <Campo
        id="cred-descricao"
        label={org ? 'Sua experiência com eventos' : 'Serviços que você oferece'}
        erro={erros.descricao}
      >
        <textarea
          id="cred-descricao"
          rows={3}
          value={form.descricao}
          onChange={(e) => mudar('descricao', e.target.value)}
          placeholder={
            org
              ? 'Ex.: organizo festas universitárias desde 2022, com público de 300 a 800 pessoas.'
              : 'Ex.: som, luz e palco para shows de até 2 mil pessoas.'
          }
        />
      </Campo>

      <div className={org ? 'field-row' : ''}>
        <Campo id="cred-link" label="Site, rede social ou portfólio" erro={erros.link} dica="Opcional">
          <input
            id="cred-link"
            type="url"
            value={form.link}
            onChange={(e) => mudar('link', e.target.value)}
            placeholder="https://"
          />
        </Campo>
        {org ? (
          <Campo id="cred-publico" label="Público médio dos eventos" erro={erros.publico_medio} dica="Opcional">
            <input
              id="cred-publico"
              type="number"
              min="1"
              step="1"
              value={form.publico_medio}
              onChange={(e) => mudar('publico_medio', e.target.value)}
            />
          </Campo>
        ) : null}
      </div>

      <label className={erros.declaracao ? 'cred-declaracao has-error' : 'cred-declaracao'}>
        <input
          type="checkbox"
          id="cred-declaracao"
          checked={form.declaracao}
          onChange={(e) => mudar('declaracao', e.target.checked)}
        />
        <span>{DECLARACAO}</span>
      </label>
      {erros.declaracao ? <small className="field-error">{erros.declaracao}</small> : null}

      <button className="btn-primary cred-enviar" type="submit" disabled={enviando}>
        {enviando ? 'Enviando…' : recusado ? 'Reenviar credenciamento' : 'Enviar credenciamento'}
      </button>
    </form>
  )
}

// o que libera depois da aprovacao, por perfil
const LIBERA = {
  organizador: 'Você já pode criar eventos e pedir serviços. Os pedidos chegam aos fornecedores e o evento pode ir para análise assim que o credenciamento for aprovado.',
  fornecedor: 'Você já pode cadastrar seus serviços. Eles aparecem para os organizadores assim que o credenciamento for aprovado.',
}

// avisa uma vez quando a situacao muda (em analise -> aprovado ou recusado)
function lembrarSituacao(idUsuario, situacao) {
  const chave = `trocaticket:credenciamento:${idUsuario}`
  let anterior = null
  try {
    anterior = localStorage.getItem(chave)
    localStorage.setItem(chave, situacao)
  } catch {
    // sem armazenamento: so nao mostra o aviso de mudanca
  }
  return anterior
}

export default function CredenciamentoFlutuante() {
  const { state, dispatch } = useApp()
  const { info, expandido, motivo, depois } = state.credenciamento
  const idUsuario = state.sessao.id
  const botaoRef = useRef(null)
  const painelRef = useRef(null)
  const estavaAberto = useRef(false)

  const carregar = useCallback(async () => {
    try {
      const novo = await credenciamento.meu()
      dispatch({ type: 'credenciamento/carregado', info: novo })
      const anterior = lembrarSituacao(idUsuario, novo.situacao)
      if (anterior === 'em_analise' && novo.situacao === 'credenciado') {
        dispatch({ type: 'aviso', texto: 'Credenciamento aprovado!' })
      }
      if (anterior === 'em_analise' && novo.situacao === 'recusado') {
        dispatch({ type: 'aviso', texto: 'Credenciamento recusado. Veja o motivo no canto da tela.' })
      }
      return novo
    } catch {
      return null
    }
  }, [dispatch, idUsuario])

  useEffect(() => {
    carregar()
  }, [carregar])

  // a API respondeu 403 com credenciamento_necessario em alguma tela
  useEffect(() => {
    function aoBloquear(e) {
      carregar().then((novo) => {
        if (novo && novo.situacao !== 'em_analise' && novo.situacao !== 'credenciado') {
          dispatch({ type: 'credenciamento/abrir', motivo: e.detail?.erro })
        }
      })
    }
    window.addEventListener('credenciamento-necessario', aoBloquear)
    return () => window.removeEventListener('credenciamento-necessario', aoBloquear)
  }, [carregar, dispatch])

  // em analise: confere de tempos em tempos e quando a aba volta ao foco
  const situacao = info?.situacao
  useEffect(() => {
    if (situacao !== 'em_analise') return
    const timer = setInterval(carregar, INTERVALO)
    window.addEventListener('focus', carregar)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', carregar)
    }
  }, [situacao, carregar])

  // foco: ao abrir vai pro painel; ao minimizar volta pro botao
  useEffect(() => {
    if (expandido) painelRef.current?.focus()
    else if (estavaAberto.current) botaoRef.current?.focus()
    estavaAberto.current = expandido
  }, [expandido])

  if (!info || situacao === 'credenciado') return null

  const perfil = info.perfil
  const minimizar = () => dispatch({ type: 'credenciamento/minimizar' })

  async function aoEnviar() {
    const continuar = depois
    await carregar()
    minimizar()
    dispatch({ type: 'aviso', texto: 'Credenciamento enviado. Agora é com o administrador.' })
    continuar?.()
  }

  if (!expandido) {
    return (
      <div className={`cred cred-${situacao}`}>
        <button
          ref={botaoRef}
          className="cred-botao"
          aria-expanded="false"
          onClick={() => dispatch({ type: 'credenciamento/abrir' })}
        >
          <span className="cred-ponto" aria-hidden="true" />
          {TITULO[situacao]}
          <Icon name="trend" size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className={`cred cred-${situacao} is-aberto`}>
      <section
        id="cred-painel"
        className="cred-painel"
        role="dialog"
        aria-labelledby="cred-titulo"
        tabIndex={-1}
        ref={painelRef}
        onKeyDown={(e) => e.key === 'Escape' && minimizar()}
      >
        <header className="cred-cab">
          <div>
            <small className="eyebrow">Credenciamento · {perfil === 'organizador' ? 'Organizador' : 'Fornecedor'}</small>
            <h2 id="cred-titulo">
              {situacao === 'em_analise'
                ? 'Seus dados estão em análise'
                : situacao === 'recusado'
                  ? 'Seu credenciamento foi recusado'
                  : 'Faça seu credenciamento'}
            </h2>
          </div>
          <button className="cred-minimizar" aria-expanded="true" aria-label="Minimizar" onClick={minimizar}>
            ×
          </button>
        </header>

        <div className="cred-corpo">
          {motivo ? <p className="cred-motivo">{motivo}</p> : null}

          {situacao === 'em_analise' ? (
            <>
              <p>
                Recebemos seus dados em {soData(info.enviado_em)}. O administrador confere as informações e
                libera seu acesso completo.
              </p>
              <p>{LIBERA[perfil]}</p>
              <button className="btn-secondary" onClick={minimizar}>
                Entendi
              </button>
            </>
          ) : (
            <>
              {situacao === 'recusado' ? (
                <div className="cred-recusa">
                  <strong>Motivo da recusa</strong>
                  <p>{info.motivo_recusa || 'O administrador não informou o motivo.'}</p>
                  <small>Corrija os dados abaixo e envie de novo.</small>
                </div>
              ) : (
                <p>
                  É rápido: o administrador confere seus dados e libera {perfil === 'organizador'
                    ? 'a publicação dos seus eventos e a contratação de fornecedores'
                    : 'seus serviços para os organizadores'}.
                </p>
              )}
              <Formulario
                perfil={perfil}
                dados={info.dados}
                recusado={situacao === 'recusado'}
                onEnviado={aoEnviar}
              />
            </>
          )}
        </div>
      </section>
    </div>
  )
}
