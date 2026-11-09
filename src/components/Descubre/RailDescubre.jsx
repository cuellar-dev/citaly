import './railDescubre.css'

/* Fila horizontal de lugares. El último hueco deja ver el borde de la tarjeta
   siguiente a propósito: es lo que avisa de que hay más y invita a deslizar. */

function RailDescubre({ titulo, nota, children }) {
  return (
    <section className="rail-descubre">
      <header className="rail-descubre-cabecera">
        <h2>{titulo}</h2>
        {nota ? <span>{nota}</span> : null}
      </header>
      <div className="rail-descubre-pista">{children}</div>
    </section>
  )
}

export default RailDescubre
