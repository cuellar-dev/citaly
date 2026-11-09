import { CANCELADA, CONFIRMADA } from '../../utils/estadosCita.js'
import './selloCita.css'

/* Sello de goma dibujado a mano, al estilo de los trazos de TimelineTurno:
   el anillo va con wobble a propósito (no es un círculo perfecto) y el glifo
   dentro lee el estado. Todo hereda el color del contenedor con currentColor,
   así la tarjeta lo tiñe con su --tono y no hace falta un SVG por estado. */

/* Anillo exterior irregular, como estampado a pulso. */
const ANILLO = `M28 5.2
  C 36.5 5 44.6 9.8 48.6 17.2
  C 52.6 24.6 51.8 34 46.8 40.6
  C 41.8 47.2 33 50.9 24.9 49.8
  C 16.6 48.7 9 43.2 6.2 35.4
  C 3.4 27.6 5.4 18.2 11.4 12.3
  C 15.8 8 21.8 5.4 28 5.2 Z`

/* Anillo interior, más fino y discontinuo: la tinta no agarra por igual. */
const ANILLO_INTERIOR = `M28 10.4
  C 35 10.2 41.6 14.2 44.9 20.3
  C 48.2 26.4 47.5 34.2 43.4 39.6
  C 39.3 45 32 48.1 25.3 47.2
  C 18.5 46.3 12.3 41.8 10 35.4
  C 7.7 29 9.3 21.3 14.3 16.4
  C 17.9 12.9 22.9 10.6 28 10.4 Z`

/* Salpicaduras: tres motas fuera del anillo para que no quede limpio de imprenta. */
const MOTAS = [
  [47.5, 12.5, 1.5],
  [8.5, 44.5, 1.2],
  [51, 36, 0.9],
]

const GLIFOS = {
  /* Visto de cómic: trazo grueso y desigual, el palo largo se escapa del anillo. */
  confirmada: (
    <path
      d="M17.5 29 L24.8 36.8 L39.5 18.8"
      className="sello-cita-trazo sello-cita-trazo--grueso"
    />
  ),
  /* Reloj: la cita existe pero aún no es firme. */
  espera: (
    <g className="sello-cita-trazo">
      <path d="M28 16.5 C 34.5 16.5 39.8 22 39.8 28.6 C 39.8 35.2 34.5 40.6 28 40.6 C 21.5 40.6 16.2 35.2 16.2 28.6 C 16.2 22 21.5 16.5 28 16.5 Z" />
      <path d="M28 21.6 L28 29 L33.6 32.4" className="sello-cita-trazo--grueso" />
    </g>
  ),
  /* Tachón: dos trazos cruzados que se pasan de largo. */
  cancelada: (
    <g className="sello-cita-trazo sello-cita-trazo--grueso">
      <path d="M19 18.5 L37.5 37.8" />
      <path d="M37.8 18.8 L18.8 37.5" />
    </g>
  ),
}

function glifoDe(estadoReserva) {
  if (estadoReserva === CANCELADA) return 'cancelada'
  if (estadoReserva === CONFIRMADA) return 'confirmada'
  return 'espera'
}

/* Sello rectangular y girado para las citas cuya fecha ya pasó: lo que en el
   recibo era el talón de "archivo". Ojo, NO dice que el usuario fuera: aquí
   solo sabemos que la fecha quedó atrás, así que el texto habla del tiempo.
   No lleva color de estado, solo tinta apagada. */
function SelloPasada() {
  return (
    <svg
      className="sello-cita sello-cita--pasada"
      viewBox="0 0 104 40"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M5.5 7 L97 4.5 L99.5 32.5 L7 35.5 Z"
        className="sello-cita-trazo sello-cita-marco"
      />
      <text x="52" y="26" textAnchor="middle" className="sello-cita-palabra">
        YA FUE
      </text>
    </svg>
  )
}

/**
 * Sello de estado en la esquina de la tarjeta. Es decorativo: el estado ya va
 * escrito en el chip de la cabecera, así que aquí no hay texto para lectores.
 */
function SelloCita({ estadoReserva = 0, pasada = false }) {
  if (pasada && estadoReserva !== CANCELADA) return <SelloPasada />

  const glifo = glifoDe(estadoReserva)

  return (
    <svg
      className={`sello-cita sello-cita--${glifo}`}
      viewBox="0 0 56 56"
      aria-hidden="true"
      focusable="false"
    >
      <path d={ANILLO} className="sello-cita-trazo sello-cita-anillo" />
      <path d={ANILLO_INTERIOR} className="sello-cita-trazo sello-cita-anillo-interior" />
      {GLIFOS[glifo]}
      <g className="sello-cita-motas">
        {MOTAS.map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
        ))}
      </g>
    </svg>
  )
}

export default SelloCita
