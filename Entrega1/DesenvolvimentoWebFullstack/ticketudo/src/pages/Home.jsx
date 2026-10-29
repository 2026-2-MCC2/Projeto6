import Contador from '../components/Contador'
import Icon from '../components/Icon'
import Logo from '../components/Logo'
import Revela from '../components/Revela'
import { destaques, guarantees, testimonials } from '../data/paginaInicial'
import { profiles, todosOsPapeis } from '../data/profiles'

const passos = [
  {
    numero: '01',
    titulo: 'O cadastro é aprovado',
    texto:
      'Organizadores e fornecedores criam a conta e enviam o credenciamento. O administrador analisa e aprova ou recusa, com o motivo.',
  },
  {
    numero: '02',
    titulo: 'O organizador monta o evento',
    texto:
      'Cadastra o evento e o local, registra os fornecedores próprios com o valor de cada serviço e acompanha o custo total.',
  },
  {
    numero: '03',
    titulo: 'Os fornecedores respondem',
    texto:
      'O organizador escolhe fornecedores credenciados e pede um serviço, com o valor que propõe. O fornecedor aceita ou recusa, e a conversa acontece no chat.',
  },
  {
    numero: '04',
    titulo: 'O administrador revisa',
    texto:
      'O evento vai para análise. O administrador confere o custo com fornecedores e aprova ou recusa, informando o motivo. Só eventos aprovados são liberados.',
  },
]

export default function Home({ onEnter }) {
  return (
    <div className="site">
      <header className="site-header">
        <div className="wrap site-header-inner">
          <Logo />
          <nav>
            <a href="#como-funciona">Como funciona</a>
            <a href="#portais">Portais</a>
            <a href="#historia">Quem somos</a>
          </nav>
          <button className="btn-primary" onClick={onEnter}>
            Acessar plataforma
          </button>
        </div>
      </header>

      <section className="site-hero">
        <div className="hero-brilho" aria-hidden="true" />
        <div className="wrap hero-grade">
          <div>
            <Revela>
              <p className="pilula">
                <i aria-hidden="true" />
                Planejamento de eventos com fornecedores credenciados
              </p>
            </Revela>

            <Revela atraso={80}>
              <h1>
                <span>Planeje o evento,</span>
                <span>contrate fornecedores</span>
                <span>
                  e <em>acompanhe o custo</em>.
                </span>
              </h1>
            </Revela>

            <Revela atraso={160}>
              <p className="lead">
                A TrocaTicket reúne organizador, fornecedores credenciados e administrador em um só
                lugar. Você cadastra o evento, pede serviços, conversa pelo chat e vê o custo antes
                de enviar o evento para análise.
              </p>
            </Revela>

            <Revela atraso={240}>
              <div className="hero-acoes">
                <button className="btn-primary" onClick={onEnter}>
                  Entrar no meu portal <b>→</b>
                </button>
                <a className="btn-secondary" href="#como-funciona">
                  Ver como funciona
                </a>
              </div>
            </Revela>

            <Revela atraso={320}>
              <dl className="hero-numeros">
                {destaques.map((item) => (
                  <div key={item.id}>
                    <dt>{item.rotulo}</dt>
                    <dd>
                      {typeof item.valor === 'number' ? <Contador valor={item.valor} /> : item.valor}
                    </dd>
                    <span>{item.texto}</span>
                  </div>
                ))}
              </dl>
            </Revela>
          </div>
        </div>
      </section>

      <section className="site-secao" id="como-funciona">
        <div className="wrap">
          <Revela className="secao-topo">
            <p className="eyebrow">Como funciona</p>
            <h2>Quatro etapas entre o cadastro e o evento aprovado</h2>
            <p className="lead">
              Nenhum evento é liberado sem a revisão do administrador, e só fornecedores
              credenciados aparecem para o organizador.
            </p>
          </Revela>

          <ol className="passos">
            {passos.map((passo, i) => (
              <Revela as="li" atraso={i * 90} key={passo.numero}>
                <span className="passo-numero">{passo.numero}</span>
                <h3>{passo.titulo}</h3>
                <p>{passo.texto}</p>
              </Revela>
            ))}
          </ol>
        </div>
      </section>

      <section className="site-secao secao-alt" id="garantias">
        <div className="wrap">
          <Revela className="secao-topo">
            <p className="eyebrow">Regras da plataforma</p>
            <h2>Quatro regras que valem para todo mundo</h2>
          </Revela>

          <div className="cartoes">
            {guarantees.map((item, i) => (
              <Revela atraso={i * 80} key={item.id}>
                <article>
                  <b>
                    <Icon name={item.icon} size={17} />
                  </b>
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                </article>
              </Revela>
            ))}
          </div>
        </div>
      </section>

      <section className="site-secao" id="portais">
        <div className="wrap">
          <Revela className="secao-topo">
            <p className="eyebrow">Portais</p>
            <h2>Cada perfil entra por uma porta</h2>
            <p className="lead">
              Organizador, fornecedor e administrador veem telas diferentes, com as permissões que
              cada papel precisa — e só elas.
            </p>
          </Revela>

          <div className="cartoes cartoes-portal">
            {todosOsPapeis.map((role, i) => {
              const profile = profiles[role]

              return (
                <Revela atraso={i * 80} key={role}>
                  <article>
                    <b className={profile.theme}>
                      <Icon name={profile.icon} size={17} />
                    </b>
                    <h3>{profile.label}</h3>
                    <p>{profile.pitch}</p>
                    <button className="btn-link" onClick={onEnter}>
                      Acessar portal →
                    </button>
                  </article>
                </Revela>
              )
            })}
          </div>
        </div>
      </section>

      <section className="site-secao secao-alt" id="historia">
        <div className="wrap historia-grade">
          <Revela>
            <p className="eyebrow">Quem somos</p>
            <h2>Nascemos em 2021 para acabar com o golpe do ingresso</h2>
            <p className="lead">
              A plataforma foi criada por programadores e entusiastas de música depois de verem
              amigos barrados em festivais lotados com ingressos duplicados.
            </p>
            <p>
              No lugar da confiança cega em um desconhecido de grupo de rede social, entram
              identidade verificada e código validado. A cobrança acontece só quando a transação se
              conclui: a plataforma só ganha quando comprador e vendedor conseguem fechar negócio.
            </p>
          </Revela>

          <div className="depoimentos">
            {testimonials.map((item, i) => (
              <Revela atraso={i * 90} key={item.id}>
                <blockquote>
                  <p>{item.quote}</p>
                  <footer>
                    <strong>{item.author}</strong>
                    <span>{item.detail}</span>
                  </footer>
                </blockquote>
              </Revela>
            ))}
          </div>
        </div>
      </section>

      <section className="site-chamada">
        <div className="wrap">
          <Revela>
            <h2>Pronto para entrar?</h2>
            <p className="lead">
              Crie sua conta de organizador ou fornecedor e envie o credenciamento para análise.
            </p>
            <button className="btn-primary" onClick={onEnter}>
              Acessar plataforma <b>→</b>
            </button>
          </Revela>
        </div>
      </section>

      <footer className="site-footer">
        <div className="wrap site-footer-inner">
          <div>
            <Logo />
            <p>
              Plataforma para planejar eventos com fornecedores credenciados.
            </p>
          </div>
          <p className="site-footer-nota">
            Projeto acadêmico do grupo Os Ticketudo · FECAP · sem cobrança real
          </p>
        </div>
      </footer>
    </div>
  )
}
