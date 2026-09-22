import EmptyState from '../../components/EmptyState'
import PageHeading from '../../components/PageHeading'
import StatusBadge from '../../components/StatusBadge'
import { useApp } from '../../state/useApp'

export default function Requests({ profile }) {
  const { state, dispatch } = useApp()

  function decide(id, approved) {
    dispatch({ type: 'credential/decide', id, approved })
  }

  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Requisições de cadastro"
        description="Valide KYC, conta de repasse e histórico antes de liberar a empresa na vitrine."
      />

      {state.credentialRequests.length === 0 ? (
        <EmptyState
          title="Nenhuma requisição na fila"
          description="Assim que uma produtora ou fornecedor enviar documentação, a solicitação aparece aqui."
        />
      ) : (
        <div className="request-grid">
          {state.credentialRequests.map((request) => (
            <article className="request-card" key={request.id}>
              <header>
                <div>
                  <small className="eyebrow">
                    {request.kind} · protocolo {request.protocol}
                  </small>
                  <h3>{request.company}</h3>
                  <p>
                    {request.specialty} · {request.document}
                  </p>
                </div>
                <StatusBadge status={request.status} />
              </header>

              <dl className="request-facts">
                <div>
                  <dt>Responsável</dt>
                  <dd>{request.owner}</dd>
                </div>
                <div>
                  <dt>Status de KYC</dt>
                  <dd>{request.kyc}</dd>
                </div>
                <div>
                  <dt>Conta de repasse</dt>
                  <dd>{request.escrow}</dd>
                </div>
                <div>
                  <dt>Eventos previstos</dt>
                  <dd>{request.forecast}</dd>
                </div>
                <div>
                  <dt>Taxa proposta</dt>
                  <dd>{request.fee}</dd>
                </div>
                <div>
                  <dt>Enviado</dt>
                  <dd>{request.submitted}</dd>
                </div>
              </dl>

              <footer>
                <button className="btn-secondary" onClick={() => decide(request.id, false)}>
                  Recusar
                </button>
                <button className="btn-approve" onClick={() => decide(request.id, true)}>
                  Credenciar
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
