// Andamento do evento: as cinco etapas ligadas pela linha com o degrade da
// logo, como a linha das etapas da pagina inicial. A linha enche ate a etapa
// em que o evento esta; cada numero aceso tem a cor da linha naquele ponto.
// Evento recusado volta para a etapa da analise, marcada em vermelho.

const ETAPAS = [
  { status: 'rascunho', nome: 'Rascunho', texto: 'itens e custos sendo montados' },
  { status: 'em_cotacao', nome: 'Em cotação', texto: 'fornecedores mandando propostas' },
  { status: 'cotacao_encerrada', nome: 'Cotação encerrada', texto: 'hora de comparar e escolher' },
  { status: 'em_analise', nome: 'Em análise', texto: 'com o administrador' },
  { status: 'aprovado', nome: 'Aprovado', texto: 'liberado para seguir' },
]

export default function EtapasEvento({ status }) {
  const recusado = status === 'recusado'
  const indice = recusado ? 3 : Math.max(0, ETAPAS.findIndex((e) => e.status === status))
  // fracao da linha preenchida: 0 na primeira etapa, 1 na ultima
  const progresso = indice / (ETAPAS.length - 1)

  return (
    <section className="etapas-evento" aria-labelledby="etapas-evento-titulo">
      <h3 id="etapas-evento-titulo">Andamento do evento</h3>
      <div className="etapas-evento-corpo" style={{ '--progresso': progresso }}>
        <span className="etapas-evento-trilho" aria-hidden="true">
          <span />
        </span>
        <ol>
          {ETAPAS.map((etapa, i) => {
            const feita = i < indice
            const atual = i === indice
            let classe = 'etapa-evento'
            if (feita) classe += ' is-feita'
            if (atual) classe += recusado ? ' is-atual is-recusada' : ' is-atual'

            return (
              <li className={classe} aria-current={atual ? 'step' : undefined} key={etapa.status}>
                <b aria-hidden="true">{i + 1}</b>
                <strong>{atual && recusado ? 'Recusado na análise' : etapa.nome}</strong>
                <small>{atual && recusado ? 'ajuste e envie de novo' : etapa.texto}</small>
                <span className="sr-only">
                  {feita ? ' (concluída)' : atual ? ' (etapa atual)' : ' (ainda não)'}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
