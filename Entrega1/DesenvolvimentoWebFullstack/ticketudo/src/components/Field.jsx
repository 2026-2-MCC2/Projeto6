export default function Field({ label, children }) {
  return (
    <label className="field">
      {label}
      {children}
    </label>
  )
}
