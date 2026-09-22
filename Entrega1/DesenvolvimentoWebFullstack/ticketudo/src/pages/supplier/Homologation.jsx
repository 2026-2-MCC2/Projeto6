import PageHeading from '../../components/PageHeading'
import StatusBadge from '../../components/StatusBadge'
import { useApp } from '../../state/useApp'

export default function Homologation({ profile }) {
  const { state, dispatch } = useApp()
  const approved = state.homologationDocs.filter((doc) => doc.status === 'Aprovado').length
  const analysing = state.homologationDocs.filter((doc) => doc.status === 'Em análise').length
  const total = state.homologationDocs.length

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Homologação"
        description="A auditoria valida certidões e registros antes de liberar sua empresa na vitrine oficial."
      />

      <div className="banner banner-mint">
        <div>
          <small className="eyebrow">Andamento da análise</small>
          <h3>
            {approved} de {total} documentos aprovados
          </h3>
          <p>
            {analysing} em análise · {total - approved - analysing} pendentes. Aceitamos PDF, PNG ou JPG de
            até 15 MB por arquivo, com assinatura digital válida.
          </p>
        </div>
        <strong className="banner-stat">
          {Math.round((approved / total) * 100)}%
          <small>homologado</small>
        </strong>
      </div>

      <section className="data-list">
        {state.homologationDocs.map((doc) => (
          <div key={doc.id}>
            <span>
              <strong>{doc.label}</strong>
              <small>
                {doc.status === 'Aprovado'
                  ? 'Conferido pela auditoria'
                  : doc.status === 'Em análise'
                    ? 'Aguardando conferência da auditoria'
                    : 'Documento ainda não enviado'}
              </small>
            </span>
            <StatusBadge status={doc.status} />
            {doc.status === 'Pendente' ? (
              <button
                className="btn-approve"
                onClick={() => dispatch({ type: 'homologation/attach', id: doc.id })}
              >
                Anexar documento
              </button>
            ) : (
              <button className="btn-secondary" disabled>
                Enviado
              </button>
            )}
          </div>
        ))}
      </section>
    </>
  )
}
