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

  return <div className="carregando">Carregando…</div>
}
