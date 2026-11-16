import { EJEMPLOS, guardarEjemplo } from '../../data/ejemplosNegocio.js'
import './switchEjemplo.css'

/* Solo para la demo: cambia Mi Negocio entre un local de cada tipo, para ver
   cómo se lleva cada uno. Cuando haya sesión, el local será el del dueño y
   esto se va. Se recuerda en este navegador. */

function SwitchEjemplo({ activo, onCambiar }) {
  const cambiar = (id) => {
    guardarEjemplo(id)
    onCambiar(id)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="switch-ejemplo">
      <p className="switch-ejemplo-titulo">
        Ejemplo <span>· solo en la demo</span>
      </p>
      <div className="switch-ejemplo-opciones" role="radiogroup" aria-label="Tipo de local de ejemplo">
        {EJEMPLOS.map(({ id, label, local, Icono }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={activo === id}
            className="switch-ejemplo-opcion"
            onClick={() => activo !== id && cambiar(id)}
          >
            <Icono size={16} strokeWidth={2.2} aria-hidden="true" />
            <span className="switch-ejemplo-textos">
              <b>{label}</b>
              <small>{local}</small>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default SwitchEjemplo
