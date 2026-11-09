import { Check } from 'lucide-react'
import './servicioitem.css'
import { duracionAMinutos, duracionTexto } from '../../utils/fichaLocal.js'

/* `marcable` lo usa la pantalla de reserva, donde el servicio se elige y hace
   falta ver cuál está marcado. En el catálogo de Mi Negocio se omite y la
   tarjeta queda igual que siempre. */
function ServicioItem({ nombre, precio, duracion, nota, seleccionado, onSeleccionar, marcable = false }) {
  const precioTexto = precio > 0 ? `${precio} CUP` : 'Gratis / consumo en local'

  const contenido = (
    <>
      {marcable ? (
        <span className="servicio-item-marca" aria-hidden="true">
          {seleccionado ? <Check size={13} strokeWidth={3.2} /> : null}
        </span>
      ) : null}
      <div className="servicio-item-info">
        <h3 className="servicio-item-nombre">{nombre}</h3>
        <p className="servicio-item-meta">
          {duracionTexto(duracionAMinutos(duracion))}
          {nota ? ` · ${nota}` : ''}
        </p>
      </div>
      <p className="servicio-item-precio">{precioTexto}</p>
    </>
  )

  if (!marcable) {
    return (
      <li className={`servicio-item ${seleccionado ? 'servicio-item-tocado' : ''}`} onClick={onSeleccionar}>
        {contenido}
      </li>
    )
  }

  return (
    <li className={`servicio-item servicio-item--marcable ${seleccionado ? 'servicio-item-tocado' : ''}`}>
      <button
        type="button"
        className="servicio-item-boton"
        aria-pressed={Boolean(seleccionado)}
        onClick={onSeleccionar}
      >
        {contenido}
      </button>
    </li>
  )
}

export default ServicioItem
