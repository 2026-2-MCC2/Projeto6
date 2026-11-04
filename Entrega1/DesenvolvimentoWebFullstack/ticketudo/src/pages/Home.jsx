import { useState } from 'react'
import CalculadoraIngresso from '../components/CalculadoraIngresso'
import LinhaEtapas from '../components/LinhaEtapas'
import Logo from '../components/Logo'
import Revela from '../components/Revela'
import { guarantees } from '../data/paginaInicial'
import { profiles, todosOsPapeis } from '../data/profiles'
import './Home.css'

const passos = [
  {
    titulo: 'O cadastro é aprovado',
    texto:
      'Organizadores e fornecedores criam a conta e enviam o credenciamento. O administrador analisa e aprova ou recusa, com o motivo.',
    quem: 'Organizador e fornecedor',
  },
  {
    titulo: 'O organizador planeja o evento',
    texto:
      'Cadastra data, local, público mínimo e máximo e a margem desejada, lista os itens de custo (palco, som, segurança…) e os outros custos.',
    quem: 'Organizador',
  },
  {
    titulo: 'Os fornecedores mandam propostas',
    texto:
      'O evento é publicado para cotação. Os fornecedores credenciados enviam uma proposta por item, com valor, descrição e validade.',
    quem: 'Fornecedor',
  },
  {
    titulo: 'O organizador escolhe e vê o preço',
    texto:
      'Compara as propostas de cada item e escolhe uma. O orçamento é consolidado e o ticket de equilíbrio e o ticket-alvo são calculados para cada cenário de público.',
    quem: 'Organizador',
  },
  {
    titulo: 'O administrador revisa',
    texto:
      'O evento vai para análise com o orçamento completo. O administrador aprova ou recusa, informando o motivo.',
    quem: 'Administrador',
  },
]

// as tres portas dos portais: papel, escura e escura com botao lilas
const corDaPorta = {
  organizer: 'faixa-clara',
  supplier: 'faixa-escura',
  admin: 'faixa-escura porta-destaque',
}

const letreiro = 'planeje · cote · compare · precifique · aprove ·'

export default function Home({ onEnter }) {
  const [menuAberto, setMenuAberto] = useState(false)

  return (
    <div className="site">
      <header className={`site-header faixa-clara${menuAberto ? ' is-aberto' : ''}`}>
        <div className="wrap site-header-inner">
          <Logo />
          <nav id="menu-site" aria-label="Seções da página">
            <a href="#como-funciona" onClick={() => setMenuAberto(false)}>
              Como funciona
            </a>
            <a href="#portais" onClick={() => setMenuAberto(false)}>
              Portais
            </a>
            <a href="#historia" onClick={() => setMenuAberto(false)}>
              Quem somos
            </a>
          </nav>
          <button
            className="btn-sticker menu-botao"
            type="button"
            aria-expanded={menuAberto}
            aria-controls="menu-site"
            onClick={() => setMenuAberto((aberto) => !aberto)}
          >
            {menuAberto ? 'Fechar' : 'Menu'}
          </button>
          <button className="btn-sticker site-header-acao" onClick={onEnter}>
            Acessar plataforma
          </button>
        </div>
      </header>

      <section className="site-hero faixa-escura" aria-labelledby="hero-titulo">
        <div className="wrap hero-grade">
          <div>
            <Revela>
              <h1 id="hero-titulo">Quanto cobrar pelo ingresso?</h1>
            </Revela>

            <Revela atraso={80}>
              <p className="hero-apoio">
                A TrocaTicket junta organizador, fornecedores credenciados e administrador: você
                lista os custos, recebe propostas por item e vê o preço que cobre tudo e garante a
                sua margem.
              </p>
            </Revela>

            <Revela atraso={160}>
              <div className="hero-acoes">
                <button className="btn-sticker" onClick={onEnter}>
                  Entrar no meu portal <b aria-hidden="true">→</b>
                </button>
                <a className="btn-sticker btn-sticker-claro" href="#como-funciona">
                  Ver como funciona
                </a>
              </div>
            </Revela>
          </div>

          <Revela atraso={240}>
            <CalculadoraIngresso />
          </Revela>
        </div>
      </section>

      <div className="letreiro" aria-hidden="true">
        <div className="letreiro-trilho">
          {[0, 1, 2, 3].map((i) => (
            <span key={i}>{letreiro}</span>
          ))}
        </div>
      </div>

      <section className="site-secao faixa-roxa" id="como-funciona" aria-labelledby="etapas-titulo">
        <div className="wrap jornada">
          <div className="jornada-intro">
            <h2 id="etapas-titulo">Cinco etapas até o evento aprovado</h2>
            <p>
              Do planejamento ao preço do ingresso, com fornecedores credenciados e a revisão do
              administrador no fim.
            </p>
            <button className="btn-sticker" onClick={onEnter}>
              Criar minha conta
            </button>
          </div>

          <LinhaEtapas passos={passos} />
        </div>
      </section>

      <section className="site-secao faixa-clara" id="garantias" aria-labelledby="regras-titulo">
        <div className="wrap">
          <Revela className="secao-topo">
            <h2 id="regras-titulo">Quatro regras para todo mundo</h2>
            <p>
              Cada uma confere com uma rota da plataforma. Não é promessa: é como o sistema
              funciona hoje.
            </p>
          </Revela>

          <div className="regras">
            {guarantees.map((item, i) => (
              <Revela atraso={i * 80} key={item.id}>
                <article className="regra">
                  <span className="carimbo">{item.carimbo}</span>
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                </article>
              </Revela>
            ))}
          </div>
        </div>
      </section>

      <section className="site-secao faixa-lilas" id="portais" aria-labelledby="portais-titulo">
        <div className="wrap">
          <Revela className="secao-topo">
            <h2 id="portais-titulo">Cada perfil entra por uma porta</h2>
            <p>
              Organizador, fornecedor e administrador veem telas diferentes, com as permissões que
              cada papel precisa, e só elas.
            </p>
          </Revela>

          <div className="portas">
            {todosOsPapeis.map((role, i) => {
              const profile = profiles[role]

              return (
                <Revela atraso={i * 80} key={role}>
                  <article className={`porta ${corDaPorta[role]}`}>
                    <h3>{profile.label}</h3>
                    <p>{profile.pitch}</p>
                    <button className="btn-sticker" onClick={onEnter}>
                      Entrar como {profile.label.toLowerCase()}
                    </button>
                  </article>
                </Revela>
              )
            })}
          </div>
        </div>
      </section>

      <section className="site-secao faixa-escura" id="historia" aria-labelledby="historia-titulo">
        <div className="wrap historia-grade">
          <Revela>
            <h2 id="historia-titulo">Nasceu na festa da faculdade</h2>
            <p className="selo" aria-hidden="true">
              Incubada
              <br />
              na FECAP
            </p>
          </Revela>
          <Revela atraso={80} className="historia-texto">
            <p>
              A TrocaTicket nasceu com o objetivo de facilitar a troca e a revenda de ingressos
              para festas universitárias e, com a evolução do negócio, passou a atender também
              outros tipos de eventos.
            </p>
            <p>
              Incubada e mentorada pela FECAP, a empresa pretende ampliar sua plataforma para
              apoiar organizadores ainda na etapa de planejamento.
            </p>
          </Revela>
        </div>
      </section>

      <section className="site-chamada faixa-roxa" aria-labelledby="chamada-titulo">
        <Revela className="wrap chamada-grade">
          <div>
            <h2 id="chamada-titulo">Pronto para entrar?</h2>
            <p>Crie sua conta de organizador ou fornecedor e envie o credenciamento para análise.</p>
          </div>
          <button className="btn-sticker" onClick={onEnter}>
            Acessar plataforma <b aria-hidden="true">→</b>
          </button>
        </Revela>
      </section>

      <footer className="site-footer faixa-escura">
        <div className="wrap">
          <p className="site-footer-nome" aria-hidden="true">
            TrocaTicket
          </p>
          <div className="site-footer-linha">
            <p>Plataforma para planejar e precificar eventos com fornecedores credenciados.</p>
            <p>Projeto acadêmico do grupo Os Ticketudo · FECAP · sem cobrança real</p>
          </div>
        </div>
      </footer>

      {/* no celular a acao principal fica sempre a mao, presa no rodape da tela */}
      <div className="barra-celular faixa-clara">
        <button className="btn-sticker" onClick={onEnter}>
          Acessar plataforma
        </button>
      </div>
    </div>
  )
}
