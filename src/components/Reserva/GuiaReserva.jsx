import { Check } from 'lucide-react'
import './guiaReserva.css'

/* Guía de pasos de la reserva. Vive pegada arriba mientras bajas.
 *
 * Tres estados y ninguno es rojo: el rojo de antes decía "error" en un paso al
 * que todavía no habías llegado. Ahora "hecho" es teal con visto, "ahora" es un
 * anillo teal con halo, y "pendiente" es un aro apagado con su número.
 */

function estadoDe(paso, indice, pasoActual) {
  if (paso.completo) return 'hecho'
  if (indice === pasoActual) return 'ahora'
  return 'pendiente'
}

function GuiaReserva({ pasos, pasoActual, mensaje, resumen = [], pegada = false, onPasoClick }) {
  const partes = (Array.isArray(resumen) ? resumen : [resumen])
    .map((t) => String(t ?? '').trim())
    .filter(Boolean)

  const hechos = pasos.filter((p) => p.completo).length
  const progreso = pasos.length ? Math.round((hechos / pasos.length) * 100) : 0

  return (
    <div
      className={`guia-reserva${pegada ? ' guia-reserva--pegada' : ''}`}
      role="group"
      aria-label={`Paso ${Math.min(pasoActual + 1, pasos.length)} de ${pasos.length}`}
    >
      <ol className="guia-reserva-pasos">
        {pasos.map((paso, i) => {
          const estado = estadoDe(paso, i, pasoActual)
          return (
            <li key={paso.id ?? i} className={`guia-reserva-paso guia-reserva-paso--${estado}`}>
              <button
                type="button"
                className="guia-reserva-boton"
                onClick={() => onPasoClick?.(paso.id)}
                aria-current={estado === 'ahora' ? 'step' : undefined}
              >
                <span className="guia-reserva-marca" aria-hidden="true">
                  {estado === 'hecho' ? <Check size={15} strokeWidth={3} /> : i + 1}
                </span>
                <span className="guia-reserva-label">{paso.label}</span>
                <span className="guia-reserva-oculto">
                  {estado === 'hecho' ? 'hecho' : estado === 'ahora' ? 'en curso' : 'pendiente'}
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      {/* Lo que falta por hacer, o el resumen de lo ya elegido. El mensaje se
          calculaba desde el principio pero el componente viejo no lo pintaba. */}
      <p className="guia-reserva-pie" aria-live="polite">
        {partes.length > 0 ? (
          <span className="guia-reserva-resumen">
            {partes.map((parte, i) => (
              <span key={parte + i} className="guia-reserva-chip">
                {parte}
              </span>
            ))}
          </span>
        ) : (
          <span className="guia-reserva-mensaje">{mensaje}</span>
        )}
      </p>

      <div
        className="guia-reserva-barra"
        role="progressbar"
        aria-valuenow={progreso}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progreso de la reserva"
      >
        <span className="guia-reserva-barra-relleno" style={{ width: `${progreso}%` }} />
      </div>
    </div>
  )
}

export default GuiaReserva
