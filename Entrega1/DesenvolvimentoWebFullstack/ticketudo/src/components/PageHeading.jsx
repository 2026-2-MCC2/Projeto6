// abertura de cada tela da plataforma: faixa roxa de ponta a ponta com o
// titulo grande, como as secoes da pagina inicial. O nome do portal ja
// aparece no menu lateral, entao o titulo nao repete o perfil em cima dele
// (o eyebrow que as telas ainda passam e ignorado)
export default function PageHeading({ title, description, children }) {
  return (
    <div className="page-heading faixa-roxa">
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {children ? <div className="page-heading-actions">{children}</div> : null}
    </div>
  )
}
