import { LetreiroCarregando } from './Carregando'
import './Carregando.css'

// Tela cheia de carregamento da marca, como a da agencia Benjamin: a logo e o
// nome entram por mascara, dois adesivos saltam, a barra enche e o letreiro
// corre no pe. Na primeira pagina da sessao ela sai subindo como cortina
// (App.jsx controla o tempo); nas outras so aparece se a espera demorar.
export default function TelaCarregando({ saindo = false, rapida = false }) {
  let classe = 'tela-carregando'
  if (rapida) classe += ' is-rapida'
  if (saindo) classe += ' is-saindo'

  return (
    <div className={classe} role={saindo ? undefined : 'status'} aria-hidden={saindo || undefined}>
      <span className="sr-only">Carregando o TrocaTicket…</span>
      <div className="tela-carregando-palco" aria-hidden="true">
        <div className="tela-carregando-marca">
          <img src="/marca/logo.png" alt="" width="96" height="96" />
          <strong>TrocaTicket</strong>
          <span className="tela-carregando-adesivo tela-carregando-ingresso">
            <small>ingresso</small>
            Nº 001
          </span>
          <span className="tela-carregando-adesivo tela-carregando-selo">
            Incubada
            <br />
            na FECAP
          </span>
        </div>
        <div className="carregando-barra carregando-barra-grande">
          <span />
        </div>
      </div>
      <LetreiroCarregando />
    </div>
  )
}
