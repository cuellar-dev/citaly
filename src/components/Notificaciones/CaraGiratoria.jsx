import { fotoCuadrada, iniciales } from '../../utils/fichaLocal.js'
import './caraGiratoria.css'

/* Tu foto y la de tu local son las dos caras de una misma moneda: el botón de
   las flechitas la voltea. Tú eres redondo; el local, cuadrado de esquinas
   suaves, como un letrero. Al girar, la forma también cambia, así que se
   entiende de quién son los avisos antes de leer el nombre. */

/* Dos flechas persiguiéndose, a pluma. */
function IconoGirar() {
  return (
    <svg className="cara-girar-icono" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <g filter="url(#noti-pulso)" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18.6 9 C17.4 5.8 14.6 4 11.6 4.2 C8.8 4.4 6.6 6 5.4 8.2" />
        <path d="M18.9 4.6 L18.7 9.2 L14.2 8.8" />
        <path d="M5.4 15 C6.6 18.2 9.4 20 12.4 19.8 C15.2 19.6 17.4 18 18.6 15.8" />
        <path d="M5.1 19.4 L5.3 14.8 L9.8 15.2" />
      </g>
    </svg>
  )
}

function Cara({ foto, nombre, clase }) {
  return (
    <span className={`cara-giratoria-cara ${clase}`}>
      {foto ? (
        <img src={fotoCuadrada(foto, 240)} alt="" decoding="async" />
      ) : (
        <span className="cara-giratoria-iniciales">{iniciales(nombre)}</span>
      )}
    </span>
  )
}

function CaraGiratoria({ lado, persona, local, nuevasOtroLado, onGirar }) {
  const enLocal = lado === 'negocio'
  const destino = enLocal ? persona.nombre : local.nombre

  return (
    <div className={`cara-giratoria${enLocal ? ' cara-giratoria--local' : ''}`}>
      <div className="cara-giratoria-moneda">
        <Cara foto={persona.foto} nombre={persona.nombre} clase="cara-giratoria-cara--tu" />
        <Cara foto={local.foto} nombre={local.nombre} clase="cara-giratoria-cara--local" />
      </div>

      <button
        type="button"
        className="cara-girar"
        onClick={onGirar}
        aria-label={`Ver avisos de ${destino}${nuevasOtroLado ? `, ${nuevasOtroLado} sin leer` : ''}`}
      >
        <IconoGirar />
        {nuevasOtroLado > 0 && (
          <span className="cara-girar-contador" aria-hidden="true">
            {nuevasOtroLado > 9 ? '9+' : nuevasOtroLado}
          </span>
        )}
      </button>
    </div>
  )
}

export default CaraGiratoria
