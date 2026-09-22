export default function Field({ label, hint, error, children }) {
  return (
    <label className={error ? 'field has-error' : 'field'}>
      {label}
      {children}
      {error ? <small className="field-error">{error}</small> : null}
      {!error && hint ? <small className="field-hint">{hint}</small> : null}
    </label>
  )
}
