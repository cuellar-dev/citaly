import { useEffect, useRef } from 'react'
import { format, isSameDay, isToday, isTomorrow } from 'date-fns'
import { es } from 'date-fns/locale'
import './selectorFecha.css'

/* Tira de días del local. Recibe los días ya evaluados ({ fecha, reservable })
   para poder apagar los que no tienen ni un hueco, en vez de dejar que el
   usuario elija un día y se encuentre la rejilla de horas vacía. */

function etiquetaDe(fecha) {
  if (isToday(fecha)) return 'Hoy'
  if (isTomorrow(fecha)) return 'Mañana'
  return format(fecha, 'EEE', { locale: es })
}

function SelectorFecha({ dias, fechaSeleccionada, onSeleccionar }) {
  const pistaRef = useRef(null)
  const activaRef = useRef(null)

  /* Al entrar, el día elegido queda a la vista aunque esté al final de la tira. */
  useEffect(() => {
    activaRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [])

  return (
    <div className="selector-fecha-container" ref={pistaRef} role="group" aria-label="Día de la reserva">
      {dias.map(({ fecha, reservable }) => {
        const seleccionada = fechaSeleccionada && isSameDay(fecha, fechaSeleccionada)
        return (
          <button
            key={fecha.toISOString()}
            ref={seleccionada ? activaRef : undefined}
            type="button"
            disabled={!reservable}
            aria-pressed={Boolean(seleccionada)}
            aria-label={`${format(fecha, "EEEE d 'de' MMMM", { locale: es })}${
              reservable ? '' : ', sin horas libres'
            }`}
            className={`selector-fecha-item${seleccionada ? ' selector-fecha-item--activa' : ''}${
              reservable ? '' : ' selector-fecha-item--llena'
            }`}
            onClick={(e) => {
              onSeleccionar(fecha)
              e.currentTarget.scrollIntoView({
                behavior: 'smooth',
                inline: 'center',
                block: 'nearest',
              })
            }}
          >
            <span className="selector-fecha-semana">{etiquetaDe(fecha)}</span>
            <span className="selector-fecha-dia">{format(fecha, 'd')}</span>
            <span className="selector-fecha-mes">{format(fecha, 'MMM', { locale: es })}</span>
          </button>
        )
      })}
    </div>
  )
}

export default SelectorFecha
