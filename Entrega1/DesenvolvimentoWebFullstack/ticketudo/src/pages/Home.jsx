import Contador from '../components/Contador'
import Icon from '../components/Icon'
import Logo from '../components/Logo'
import Revela from '../components/Revela'
import { guarantees, platformStats, testimonials } from '../data/platform'
import { profiles, roleOrder } from '../data/profiles'

const passos = [
  {
    numero: '01',
    titulo: 'O organizador publica',
    texto:
      'Cadastra o evento, monta os lotes com preço, quantidade e o teto de revenda, e envia para análise.',
  },
  {
    numero: '02',
    titulo: 'A plataforma confere',
    texto:
      'Um administrador revisa os lotes, o custo com fornecedores e a documentação antes de liberar a venda.',
  },
  {
    numero: '03',
    titulo: 'A venda abre',
    texto:
      'Cada ingresso nasce com código único e nome do dono. O pagamento fica retido até a transferência se concluir.',
  },
  {
    numero: '04',
    titulo: 'A revenda respeita o teto',
    texto:
      'Quem comprou pode revender, mas nunca acima do limite que o organizador definiu. Sem ágio, sem cambista.',
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
                Custódia protegida e transferência verificada
              </p>
            </Revela>

            <Revela atraso={80}>
              <h1>
                <span>O dinheiro só sai</span>
                <span>da custódia quando</span>
                <span>
                  <em>você entra</em> no evento.
                </span>
              </h1>
            </Revela>

            <Revela atraso={160}>
              <p className="lead">
                A TrocaTicket concentra compra, venda e repasse de ingressos em um ambiente com
                identidade verificada, ingresso validado e pagamento retido até a confirmação da
                transferência.
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
                <div>
                  <dt>Ingressos validados</dt>
                  <dd>
                    <Contador valor={platformStats.validated} casas={1} sufixo="%" />
                  </dd>
                  <span>por biometria ou token dinâmico</span>
                </div>
                <div>
                  <dt>Organizadores</dt>
                  <dd>
                    <Contador valor={platformStats.organizers} />
                  </dd>
                  <span>produtoras credenciadas</span>
                </div>
                <div>
                  <dt>Liquidação</dt>
                  <dd>{platformStats.settlement}</dd>
                  <span>após a confirmação de entrada</span>
                </div>
              </dl>
            </Revela>
          </div>
        </div>
      </section>

      <section className="site-secao" id="como-funciona">
        <div className="wrap">
          <Revela className="secao-topo">
            <p className="eyebrow">Como funciona</p>
            <h2>Quatro etapas entre o anúncio e a catraca</h2>
            <p className="lead">
              Nenhum ingresso entra à venda sem passar por análise, e nenhum pagamento é liberado
              antes da transferência se concluir.
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
            <p className="eyebrow">O que garante a negociação</p>
            <h2>Quatro travas entre o anúncio e o golpe</h2>
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
            {roleOrder.map((role, i) => {
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
              Crie sua conta de organizador ou fornecedor em menos de um minuto.
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
              Infraestrutura de liquidação, custódia e troca de ingressos nominais.
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
