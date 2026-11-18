import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { estadoApertura, notaLocal } from '../../utils/descubre.js'
import Foto from '../Foto/Foto.jsx'
import './tarjetaLocalCompacta.css'

/* Versión de bolsillo para los carruseles. Solo lo que se lee de un vistazo
   mientras deslizas: foto, nombre, nota y si está abierto. */

function TarjetaLocalCompacta({ local }) {
  const { nota } = notaLocal(local)
  const puertas = estadoApertura(local)

  return (
    <Link
      to={`/local/${local.id}`}
      className="local-compacto"
      aria-label={`Ver ${local.localName}`}
    >
      <span className="local-compacto-foto tema-oscuro-fijo foto-marco">
        {/* Cuadrada de 152 px. */}
        <Foto src={local.url} anchos={[160, 320, 480]} proporcion={1} sizes="152px" />
        <span className="local-compacto-velo" aria-hidden="true" />
        {puertas.abierto ? <span className="local-compacto-abierto">Abierto</span> : null}
      </span>
      <span className="local-compacto-info">
        <strong>{local.localName}</strong>
        <span className="local-compacto-linea">
          <span className="local-compacto-nota">
            <Star size={11} strokeWidth={2.6} aria-hidden="true" />
            {nota ? nota.toFixed(1) : '—'}
          </span>
          <span className="local-compacto-punto" aria-hidden="true" />
          <span className="local-compacto-cat">{local.categoria}</span>
        </span>
      </span>
    </Link>
  )
}

export default TarjetaLocalCompacta
