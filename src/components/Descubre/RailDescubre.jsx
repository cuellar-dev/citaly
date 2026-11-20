import talyAMano from '../Taly/taly-a-mano.svg'
import './railDescubre.css'

/* Fila horizontal de lugares. El último hueco deja ver el borde de la tarjeta
   siguiente a propósito: es lo que avisa de que hay más y invita a deslizar.
   `taly` (opcional): una frase corta de Taly bajo el título. */

function RailDescubre({ titulo, nota, taly, children }) {
  return (
    <section className="rail-descubre">
      <header className="rail-descubre-cabecera">
        <h2>{titulo}</h2>
        {nota ? <span>{nota}</span> : null}
      </header>
      {taly ? (
        <p className="rail-descubre-taly">
          <img src={talyAMano} alt="" aria-hidden="true" />
          {taly}
        </p>
      ) : null}
      <div className="rail-descubre-pista">{children}</div>
    </section>
  )
}

export default RailDescubre
