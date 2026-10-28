import { useState } from 'react'
import Carregando from '../../components/Carregando'
import EmptyState from '../../components/EmptyState'
import PageHeading from '../../components/PageHeading'
import StatusBadge from '../../components/StatusBadge'
import Tabs from '../../components/Tabs'
import { admin } from '../../api'
import { nomeDaArea } from '../../data/credenciamento'
import { useRecurso } from '../../hooks/useRecurso'
import { cnpj, dataHora, rotulo, telefone } from '../../utils/format'
import { useApp } from '../../state/useApp'

const perfis = [
  { id: 'organizador', label: 'Organizadores' },
  { id: 'fornecedor', label: 'Fornecedores' },
]

const abas = [
  { id: 'em_analise', label: 'Em análise' },
  { id: 'aprovado', label: 'Aprovados' },
  { id: 'recusado', label: 'Recusados' },
]

// so vira link clicavel se for um endereco web
function Link({ url }) {
  if (!url) return '—'
  return /^https?:\/\//i.test(url) ? (
    <a href={url} target="_blank" rel="noreferrer noopener">
      {url}
    </a>
  ) : (
    url
  )
}

// os dados que cada perfil enviou no credenciamento
function Fatos({ pedido }) {
  const organizador = pedido.perfil === 'organizador'
  const juridica = !organizador || pedido.tipo_pessoa === 'juridica'

  const fatos = [
    ['Responsável', pedido.nome],
    ['E-mail', pedido.email],
    organizador ? ['Tipo', juridica ? 'Pessoa jurídica (produtora)' : 'Pessoa física'] : null,
    juridica ? ['Razão social', pedido.razao_social] : ['CPF', pedido.cpf],
    juridica ? ['CNPJ', cnpj(pedido.cnpj)] : null,
    ['Cidade', `${pedido.cidade || '—'} / ${pedido.estado || '—'}`],
    ['Telefone', telefone(pedido.telefone)],
    [
      organizador ? 'Tipos de evento' : 'Áreas',
      (pedido.categorias || []).map((c) => (organizador ? c : nomeDaArea(c))).join(', ') || '—',
    ],
    organizador
      ? ['Público médio', pedido.publico_medio ? `${pedido.publico_medio} pessoas` : '—']
      : ['Serviços cadastrados', pedido.total_servicos],
    ['Site ou rede social', <Link url={pedido.link} key="link" />],
    ['Enviado', dataHora(pedido.solicitado_em)],
    pedido.revisado_em
      ? ['Analisado', `${dataHora(pedido.revisado_em)} por ${pedido.analisado_por || '—'}`]
      : null,
  ].filter(Boolean)

  return (
    <dl className="request-facts">
      {fatos.map(([rotuloFato, valor]) => (
        <div key={rotuloFato}>
          <dt>{rotuloFato}</dt>
          <dd>{valor || '—'}</dd>
        </div>
      ))}
    </dl>
  )
}

export default function Requests({ profile, onMudou }) {
  const { dispatch } = useApp()
  const [perfil, setPerfil] = useState('organizador')
  const [aba, setAba] = useState('em_analise')
  const { dados, carregando, erro, recarregar } = useRecurso(
    () => admin.credenciamentos(perfil, aba),
    `${perfil}-${aba}`,
  )

  async function decidir(pedido, aprovar) {
    const nome = pedido.nome_organizacao || pedido.nome_empresa
    try {
      if (aprovar) {
        const r = await admin.aprovarCredenciamento(pedido.id_credenciamento)
        const liberadas = r.solicitacoes_liberadas
          ? ` ${r.solicitacoes_liberadas} pedido(s) de serviço foram liberados aos fornecedores.`
          : ''
        dispatch({ type: 'aviso', texto: `${nome} credenciado.${liberadas}` })
      } else {
        const motivo = window.prompt('Por que está recusando? A pessoa vai ver esse motivo.')
        if (!motivo || !motivo.trim()) return
        await admin.recusarCredenciamento(pedido.id_credenciamento, motivo.trim())
        dispatch({ type: 'aviso', texto: `${nome} recusado.` })
      }
      recarregar()
      onMudou?.()
    } catch (e) {
      dispatch({ type: 'aviso', texto: e.message })
    }
  }

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Credenciamentos"
        description="Confira os dados de organizadores e fornecedores antes de liberar o acesso completo."
      />

      <Tabs options={perfis} value={perfil} onChange={setPerfil} />
      <Tabs options={abas} value={aba} onChange={setAba} />

      {carregando || erro ? (
        <Carregando erro={erro} aoTentarDeNovo={recarregar} />
      ) : dados.length === 0 ? (
        <EmptyState
          title="Nada nessa aba"
          description={`Quando um ${perfil} enviar o credenciamento, ele aparece aqui.`}
        />
      ) : (
        <div className="request-grid">
          {dados.map((pedido) => (
            <article className="request-card" key={pedido.id_credenciamento}>
              <header>
                <div>
                  <small className="eyebrow">Protocolo {pedido.id_credenciamento}</small>
                  <h3>{pedido.nome_organizacao || pedido.nome_empresa}</h3>
                  <p>{perfil === 'organizador' ? 'Organizador' : 'Fornecedor'}</p>
                </div>
                <StatusBadge status={rotulo(pedido.status)} />
              </header>

              <Fatos pedido={pedido} />

              {pedido.descricao ? <p className="request-descricao">{pedido.descricao}</p> : null}
              {pedido.observacao ? (
                <p className="request-descricao">Motivo da recusa: {pedido.observacao}</p>
              ) : null}

              {pedido.status === 'em_analise' ? (
                <footer>
                  <button className="btn-secondary" onClick={() => decidir(pedido, false)}>
                    Recusar
                  </button>
                  <button className="btn-approve" onClick={() => decidir(pedido, true)}>
                    Credenciar
                  </button>
                </footer>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </>
  )
}
