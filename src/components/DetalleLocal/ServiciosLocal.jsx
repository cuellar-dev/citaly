import { Plus } from 'lucide-react'
import { duracionAMinutos, duracionTexto, precioTexto } from '../../utils/fichaLocal.js'
import './serviciosLocal.css'

/* Lo que se puede reservar, con precio y duración: es lo que más decide.
   Cada fila tiene su "+" que abre la reserva con ese servicio ya marcado
   (en locales de mesa, abre la reserva de mesa sin más). */
function ServiciosLocal({ servicios, lugar, onReservar }) {
  if (!servicios.length) {
    return (
      <p className="local-servicios-vacio">
        Este local aún no publicó lo que ofrece. Escríbeles por WhatsApp y pregúntales.
      </p>
    )
  }

  return (
    <ul className="local-servicios">
      {servicios.map((s) => {
        const minutos = duracionAMinutos(s.duracion)
        const meta = [minutos ? duracionTexto(minutos) : null, s.nota].filter(Boolean).join(' · ')
        return (
          <li key={s.id} className="local-servicio">
            <div className="local-servicio-info">
              <h3 className="local-servicio-nombre">{s.nombre}</h3>
              {meta ? <p className="local-servicio-meta">{meta}</p> : null}
            </div>
            <span className="local-servicio-corte" aria-hidden="true" />
            <div className="local-servicio-talon">
              <span className="local-servicio-precio">{precioTexto(s.precio)}</span>
              <button
                type="button"
                className="local-servicio-mas"
                onClick={() => onReservar(s.id)}
                aria-label={lugar ? `Reservar mesa (${s.nombre})` : `Reservar ${s.nombre}`}
              >
                <Plus size={18} strokeWidth={2.6} />
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default ServiciosLocal
