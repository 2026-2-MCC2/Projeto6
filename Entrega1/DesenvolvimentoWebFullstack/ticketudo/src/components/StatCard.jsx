// numero da visao geral: o valor grande e o rotulo, sem icone em circulo
// (o icone que as telas ainda passam e ignorado)
export default function StatCard({ label, value, trend, note, down }) {
  // valor em reais ("R$ 73.000,00") nao cabe no tamanho dos numeros curtos
  const longo = String(value).length > 7

  return (
    <article className={longo ? 'stat is-longo' : 'stat'}>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <small className={down ? 'stat-trend is-down' : 'stat-trend'}>
        {trend && `${trend} `}
        <i>{note}</i>
      </small>
    </article>
  )
}
