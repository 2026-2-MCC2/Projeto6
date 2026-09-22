import Icon from '../components/Icon'
import Logo from '../components/Logo'
import { guarantees, platformStats, testimonials } from '../data/platform'
import { profiles, roleOrder } from '../data/profiles'

export default function Home({ onEnter }) {
  return (
    <div className="site">
      <header className="site-header">
        <Logo />
        <nav>
          <a href="#como-funciona">Como funciona</a>
          <a href="#portais">Portais</a>
          <a href="#historia">Quem somos</a>
        </nav>
        <button className="btn-primary" onClick={onEnter}>
          Acessar plataforma
        </button>
      </header>

      <section className="site-hero">
        <div>
          <small className="eyebrow">Revenda de ingressos com custódia</small>
          <h1>
            O dinheiro só sai da custódia
            <br />
            <i>quando você entra</i> no evento.
          </h1>
          <p>
            A TrocaTicket concentra compra, venda e repasse de ingressos em um ambiente com identidade
            verificada, ingresso validado e pagamento retido até a confirmação da transferência.
          </p>
          <div className="site-hero-actions">
            <button className="btn-primary" onClick={onEnter}>
              Entrar no meu portal <b>→</b>
            </button>
            <a className="btn-secondary" href="#como-funciona">
              Ver como funciona
            </a>
          </div>
        </div>
        <dl className="site-figures">
          <div>
            <dt>Ingressos validados</dt>
            <dd>{platformStats.validated}%</dd>
            <span>por biometria ou token dinâmico</span>
          </div>
          <div>
            <dt>Liquidação</dt>
            <dd>{platformStats.settlement}</dd>
            <span>após a confirmação de entrada</span>
          </div>
          <div>
            <dt>Organizadores</dt>
            <dd>{platformStats.organizers}</dd>
            <span>produtoras credenciadas</span>
          </div>
        </dl>
      </section>

      <section className="site-section" id="como-funciona">
        <small className="eyebrow">O que garante a negociação</small>
        <h2>Quatro travas entre o anúncio e o golpe</h2>
        <div className="guarantee-grid">
          {guarantees.map((item) => (
            <article key={item.id}>
              <b>
                <Icon name={item.icon} size={16} />
              </b>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section" id="portais">
        <small className="eyebrow">Portais</small>
        <h2>Cada perfil entra por uma porta</h2>
        <div className="portal-grid">
          {roleOrder.map((role) => {
            const profile = profiles[role]

            return (
              <article key={role}>
                <b className={profile.theme}>
                  <Icon name={profile.icon} size={16} />
                </b>
                <h3>{profile.label}</h3>
                <p>{profile.pitch}</p>
                <button className="btn-link" onClick={onEnter}>
                  Acessar portal →
                </button>
              </article>
            )
          })}
        </div>
      </section>

      <section className="site-section site-split" id="historia">
        <div>
          <small className="eyebrow">Quem somos</small>
          <h2>Nascemos em 2021 para acabar com o golpe do ingresso</h2>
          <p>
            A plataforma foi criada por programadores e entusiastas de música depois de verem amigos
            barrados em festivais lotados com ingressos duplicados. No lugar da confiança cega em um
            desconhecido de grupo de rede social, entram identidade verificada e código validado.
          </p>
          <p>
            A cobrança acontece só quando a transação se conclui: a plataforma só ganha quando comprador
            e vendedor conseguem fechar a negociação.
          </p>
        </div>
        <div className="quote-stack">
          {testimonials.map((item) => (
            <blockquote key={item.id}>
              <p>{item.quote}</p>
              <footer>
                <strong>{item.author}</strong>
                <span>{item.detail}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <Logo />
        <p>Projeto acadêmico do grupo Os Ticketudo · FECAP</p>
      </footer>
    </div>
  )
}
