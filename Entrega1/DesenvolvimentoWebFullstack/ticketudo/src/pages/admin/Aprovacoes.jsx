import { useState } from 'react'
import Carregando from '../../components/Carregando'
import EmptyState from '../../components/EmptyState'
import PageHeading from '../../components/PageHeading'
import StatusBadge from '../../components/StatusBadge'
import Tabs from '../../components/Tabs'
import { admin } from '../../api'
import { useRecurso } from '../../hooks/useRecurso'
import { dataHora, rotulo } from '../../utils/format'

// Historico das decisoes do administrador (FLX-07, rastreabilidade 5.3):
// quem aprovou ou recusou cada credenciamento e cada evento, quando e por que.

const FILTROS = [
  { id: 'todos', label: 'Tudo' },
  { id: 'organizador', label: 'Organizadores' },
  { id: 'fornecedor', label: 'Fornecedores' },
  { id: 'evento', label: 'Eventos' },
]

const PERFIL = { organizador: 'Organizador', fornecedor: 'Fornecedor', evento: 'Evento' }

export default function Aprovacoes({ profile }) {
  const { dados, carregando, erro, recarregar } = useRecurso(() => admin.aprovacoes())
  const [filtro, setFiltro] = useState('todos')

  if (carregando || erro) return <Carregando erro={erro} aoTentarDeNovo={recarregar} />

  const linhas = dados.filter((h) => filtro === 'todos' || h.perfil === filtro)

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Histórico de aprovações"
        description="Cada decisão do administrador fica registrada: quem decidiu, quando e o motivo da recusa."
      />

      <Tabs
        options={FILTROS.map((f) => ({
          ...f,
          count: f.id === 'todos' ? dados.length : dados.filter((h) => h.perfil === f.id).length,
        }))}
        value={filtro}
        onChange={setFiltro}
      />

      {linhas.length === 0 ? (
        <EmptyState title="Nenhuma decisão ainda" description="As aprovações e recusas aparecem aqui." />
      ) : (
        <div className="tabela-rolagem bloco">
          <table className="tabela">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Tipo</th>
                <th>Nome</th>
                <th>Decisão</th>
                <th>Por</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((h) => (
                <tr key={`${h.tipo}-${h.id}`}>
                  <td>{dataHora(h.decidido_em)}</td>
                  <td>{PERFIL[h.perfil]}</td>
                  <td>
                    <strong>{h.nome}</strong>
                    <br />
                    <small>{h.responsavel}</small>
                  </td>
                  <td>
                    <StatusBadge status={rotulo(h.decisao)} />
                  </td>
                  <td>{h.decidido_por || '—'}</td>
                  <td>{h.motivo || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
