import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import talyAMano from '../Taly/taly-a-mano.svg'
import { guardarSeccion } from '../../utils/seccionDescubre.js'
import './railDescubre.css'

/* Fila horizontal de lugares. El último hueco deja ver el borde de la tarjeta
   siguiente a propósito: es lo que avisa de que hay más y invita a deslizar.
   `taly` (opcional): una frase corta de Taly bajo el título.
   `verMas` (opcional): { clave, titulo, nota, ids }. Si la fila se quedó
   corta respecto a todos los que cumplen su condición, al final va una
   tarjeta «+» que abre Búsqueda con la lista entera. */

function RailDescubre({ titulo, nota, taly, verMas, children }) {
  const total = verMas?.ids?.length ?? 0
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
      <div className="rail-descubre-pista">
        {children}
        {verMas ? (
          <Link
            to={`/buscar/seccion/${encodeURIComponent(verMas.clave)}`}
            state={{ seccion: verMas }}
            className="rail-descubre-mas"
            onClick={() => guardarSeccion(verMas)}
          >
            <span className="rail-descubre-mas-circulo" aria-hidden="true">
              <Plus size={26} strokeWidth={2.4} />
            </span>
            <span className="rail-descubre-mas-texto">Ver los {total}</span>
            <span className="sr-only"> de {titulo}</span>
          </Link>
        ) : null}
      </div>
    </section>
  )
}

export default RailDescubre
