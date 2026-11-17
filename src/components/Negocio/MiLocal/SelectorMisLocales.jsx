import { Link } from 'react-router-dom'
import { Plus, Store } from 'lucide-react'
import './miLocal.css'

/* Arriba de Mi Negocio: los locales que el usuario ha creado y el botón para
   crear otro. Si no tiene ninguno, una invitación a poner el suyo.
   Debajo sigue el switch de ejemplos de la demo. */

function estadoDe(local) {
  if (local.estado === 'revision') return { texto: 'En revisión', tono: 'amarillo' }
  if (!local.completado) return { texto: 'Falta completar', tono: 'amarillo' }
  if (local.oculto) return { texto: 'Oculto', tono: 'gris' }
  return { texto: 'En Citaly', tono: 'verde' }
}

function SelectorMisLocales({ locales, activo, onElegir }) {
  if (!locales.length) {
    return (
      <Link to="/negocio/nuevo" className="mis-locales-invita">
        <span className="mis-locales-invita-icono" aria-hidden="true">
          <Store size={20} strokeWidth={2.2} />
        </span>
        <span className="mis-locales-invita-textos">
          <strong>¿Tienes un negocio? Ponlo en Citaly</strong>
          <span>Dos minutos y lo revisamos. Gratis.</span>
        </span>
        <span className="mis-locales-invita-boton">Crear</span>
      </Link>
    )
  }

  return (
    <div className="mis-locales">
      <p className="mis-locales-titulo">Tus locales</p>
      <div className="mis-locales-fila" role="radiogroup" aria-label="Tus locales">
        {locales.map((l) => {
          const estado = estadoDe(l)
          return (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={activo === l.id}
              className="mis-locales-opcion"
              onClick={() => activo !== l.id && onElegir(l.id)}
            >
              <span className="mis-locales-nombre">{l.localName}</span>
              <span className={`mis-locales-estado mis-locales-estado--${estado.tono}`}>{estado.texto}</span>
            </button>
          )
        })}
        <Link to="/negocio/nuevo" className="mis-locales-opcion mis-locales-opcion--nuevo" aria-label="Crear otro local">
          <Plus size={18} strokeWidth={2.4} aria-hidden="true" />
          <span className="mis-locales-nombre">Nuevo</span>
        </Link>
      </div>
    </div>
  )
}

export default SelectorMisLocales
