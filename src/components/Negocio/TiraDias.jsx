import { useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import './tiraDias.css'

/* La semana del dueño en una tira: un día a la vez, nunca todas las citas
   juntas.

   Ligera a propósito, como la tira de un calendario: sin cajas, solo el día
   de la semana arriba y el número en un círculo. El elegido se rellena; hoy,
   si no está elegido, va en teal. Un puntito debajo dice que ese día hay
   citas (cuántas, lo dice la lista). Los días que no abres se apagan. */

function etiquetaDe(desplazamiento, fecha) {
  if (desplazamiento === 0) return 'Hoy'
  return format(fecha, 'EEE', { locale: es }).replace('.', '')
}

function TiraDias({ dias, seleccionada, onElegir }) {
  const elegidaRef = useRef(null)

  /* El día elegido siempre a la vista, centrado. Al entrar, sin animación. */
  const primeraVez = useRef(true)
  useEffect(() => {
    const suave = !primeraVez.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    elegidaRef.current?.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', inline: 'center', block: 'nearest' })
    primeraVez.current = false
  }, [seleccionada])

  return (
    <div className="tira-dias" role="group" aria-label="Día de la agenda">
      {dias.map(({ clave, fecha, desplazamiento, cantidad, abre }) => {
        const elegida = clave === seleccionada
        const clases = [
          'tira-dia',
          elegida && 'tira-dia--elegida',
          desplazamiento === 0 && 'tira-dia--hoy',
          desplazamiento < 0 && 'tira-dia--pasada',
          !abre && 'tira-dia--cerrada',
        ]
          .filter(Boolean)
          .join(' ')
        return (
          <button
            key={clave}
            ref={elegida ? elegidaRef : undefined}
            type="button"
            className={clases}
            aria-pressed={elegida}
            aria-label={`${format(fecha, "EEEE d 'de' MMMM", { locale: es })}: ${
              abre ? `${cantidad} ${cantidad === 1 ? 'cita' : 'citas'}` : 'no abres'
            }`}
            onClick={() => onElegir(clave)}
          >
            <span className="tira-dia-nombre">{etiquetaDe(desplazamiento, fecha)}</span>
            <span className="tira-dia-numero">{format(fecha, 'd')}</span>
            <span className={`tira-dia-punto${abre && cantidad > 0 ? ' tira-dia-punto--hay' : ''}`} aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}

export default TiraDias
