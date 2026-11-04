import { letreiro } from '../data/paginaInicial'
import './Carregando.css'

// letreiro da pagina inicial, correndo sozinho enquanto a tela espera
export function LetreiroCarregando() {
  return (
    <div className="carregando-letreiro" aria-hidden="true">
      <div className="carregando-letreiro-trilho">
        {[0, 1, 2, 3].map((i) => (
          <span key={i}>{letreiro}</span>
        ))}
      </div>
    </div>
  )
}

// Espera dentro das telas, no desenho da tela de carregamento da marca:
// a faixa roxa no lugar do titulo, o letreiro correndo e a barra de adesivo
// enchendo. Direto na pagina ela ocupa a abertura da tela; dentro de um
// painel ou secao fica compacta (so letreiro e barra). Aparece so na primeira
// vez de cada tela na sessao, por no minimo 0,9s (useRecurso).
export default function Carregando({ erro, aoTentarDeNovo }) {
  if (erro) {
    return (
      <div className="empty-state">
        <strong>Não consegui carregar</strong>
        <p>{erro.message}</p>
        {aoTentarDeNovo ? (
          <button className="btn-secondary" onClick={aoTentarDeNovo}>
            Tentar de novo
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="carregando" role="status">
      <div className="carregando-faixa faixa-roxa" aria-hidden="true">
        <span />
        <span />
      </div>
      <LetreiroCarregando />
      <div className="carregando-corpo">
        <img className="carregando-logo" src="/marca/logo.png" alt="" width="48" height="48" />
        <div className="carregando-barra" aria-hidden="true">
          <span />
        </div>
        <p>Carregando…</p>
      </div>
    </div>
  )
}
