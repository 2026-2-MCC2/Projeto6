import Avatar from '../../components/Avatar'
import PageHeading from '../../components/PageHeading'

export default function Profile({ profile }) {
  return (
    <>
      <PageHeading
        eyebrow={profile.tagline}
        title="Meu perfil"
        description="Mantenha seus dados profissionais atualizados."
      />
      <section className="profile-card">
        <div className="profile-cover" />
        <Avatar initials={profile.initials} />
        <h3>{profile.name}</h3>
        <p>{profile.label} · São Paulo, SP</p>
        <button className="btn-primary">Salvar alterações</button>
      </section>
    </>
  )
}
