import './caraRating.css'
import { COLORES_PUNTUACION, ETIQUETAS_PUNTUACION } from '../../utils/puntuacion.js'

function CaraRating({ nivel = 0, size = 22, className = '' }) {
  const activo = nivel >= 1 && nivel <= 5
  const color = COLORES_PUNTUACION[nivel] ?? 'transparent'
  const label = ETIQUETAS_PUNTUACION[nivel] ?? ''

  return (
    <span
      className={`cara-rating ${activo ? 'cara-rating--activo' : ''} ${className}`.trim()}
      style={{ width: size, height: size, color: activo ? color : 'transparent' }}
      title={label}
      /* role="img": un <span> no puede llevar aria-label por sí solo; así el
         lector lo anuncia como una imagen con nombre ("Excelente servicio"). */
      role={activo ? 'img' : undefined}
      aria-label={activo ? label : undefined}
      aria-hidden={!activo}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className="cara-rating__svg"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" className="cara-rating__trazo" />

        <g className={`cara-rating__capa cara-rating__cejas ${nivel === 1 ? 'cara-rating__capa--activa' : ''}`}>
          <path d="M7.5 8 10 9" className="cara-rating__trazo" />
          <path d="m14 9 2.5-1" className="cara-rating__trazo" />
        </g>

        <g className={`cara-rating__capa cara-rating__ojos cara-rating__ojos--normales ${nivel !== 1 && activo ? 'cara-rating__capa--activa' : ''}`}>
          <line x1="9" x2="9.01" y1="9" y2="9" className="cara-rating__trazo" />
          <line x1="15" x2="15.01" y1="9" y2="9" className="cara-rating__trazo" />
        </g>

        <g className={`cara-rating__capa cara-rating__ojos cara-rating__ojos--enojados ${nivel === 1 ? 'cara-rating__capa--activa' : ''}`}>
          <path d="M9 10h.01" className="cara-rating__trazo" />
          <path d="M15 10h.01" className="cara-rating__trazo" />
        </g>

        <path
          d="M16 16s-1.5-2-4-2-4 2-4 2"
          className={`cara-rating__capa cara-rating__boca cara-rating__boca--triste ${nivel === 1 || nivel === 2 ? 'cara-rating__capa--activa' : ''}`}
        />

        <line
          x1="8"
          x2="16"
          y1="15"
          y2="15"
          className={`cara-rating__capa cara-rating__boca cara-rating__boca--neutral ${nivel === 3 ? 'cara-rating__capa--activa' : ''}`}
        />

        <path
          d="M8 14s1.5 2 4 2 4-2 4-2"
          className={`cara-rating__capa cara-rating__boca cara-rating__boca--sonrisa ${nivel === 4 ? 'cara-rating__capa--activa' : ''}`}
        />

        <path
          d="M18 13a6 6 0 0 1-6 5 6 6 0 0 1-6-5h12Z"
          className={`cara-rating__capa cara-rating__boca cara-rating__boca--risa ${nivel === 5 ? 'cara-rating__capa--activa' : ''}`}
        />
      </svg>
    </span>
  )
}

export default CaraRating
