export default function PageHeading({ eyebrow, title, description, children }) {
  return (
    <div className="page-heading">
      <div>
        <small className="eyebrow">{eyebrow}</small>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="page-heading-actions">
        {children}
        <button className="btn-secondary">Ajuda</button>
      </div>
    </div>
  )
}
