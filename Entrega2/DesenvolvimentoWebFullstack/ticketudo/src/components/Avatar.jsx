export default function Avatar({ initials, small }) {
  return <i className={small ? 'avatar avatar-small' : 'avatar'}>{initials}</i>
}
