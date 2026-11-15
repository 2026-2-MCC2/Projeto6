export default function Avatar({ initials, small, foto }) {
  return foto ? (
    <img className={small ? 'avatar avatar-small' : 'avatar'} src={foto} alt="" />
  ) : (
    <i className={small ? 'avatar avatar-small' : 'avatar'}>{initials}</i>
  )
}
