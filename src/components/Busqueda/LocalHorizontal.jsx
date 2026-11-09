import { ChevronRight, Star } from 'lucide-react'
import { estadoApertura, notaLocal } from '../../utils/descubre.js'

/* Fila de un lugar dentro de un carrusel. La nota sale de notaLocal, igual que
   en la tarjeta grande; antes se leía `local.points` crudo y podía no cuadrar
   con lo que mostraba la tarjeta del mismo local unas líneas más arriba. */

function LocalHorizontal({ local, onClick }) {
  const { nota } = notaLocal(local)
  const puertas = estadoApertura(local)

  return (
    <button type="button" className="local-horizontal" onClick={onClick}>
      <span className="local-horizontal-foto">
        <img src={local.url} alt="" loading="lazy" decoding="async" />
        {puertas.abierto ? (
          <span className="local-horizontal-abierto" aria-hidden="true" />
        ) : null}
      </span>

      <span className="local-horizontal-info">
        <strong>{local.localName}</strong>
        <small>{local.categoria}</small>
        <span className="local-horizontal-meta">
          <span className="local-horizontal-nota">
            <Star size={11} strokeWidth={2.6} aria-hidden="true" />
            {nota ? nota.toFixed(1) : '—'}
          </span>
          <span className="local-horizontal-punto" aria-hidden="true" />
          <span>A {local.metros} m</span>
        </span>
      </span>

      <ChevronRight size={17} strokeWidth={2.2} aria-hidden="true" />
    </button>
  )
}

export default LocalHorizontal
