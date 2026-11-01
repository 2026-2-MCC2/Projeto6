import Icon from './Icon'
import './Shared.css'

export default function Logo() {
  return (
    <div className="brand">
      <b>
        <Icon name="trend" size={13} />
      </b>
      troca<span>.ticket</span>
    </div>
  )
}
