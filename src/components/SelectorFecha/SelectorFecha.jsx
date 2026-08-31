import { useRef } from 'react'
import { format, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import './selectorFecha.css'

function SelectorFecha({ fechas, fechaSeleccionada, onSeleccionar }) {
  const scrollRef = useRef(null)

  function handleSeleccion(fecha, boton){
    onSeleccionar(fecha)
    boton.scrollIntoView({behavior: 'smooth', inline: 'center', block: 'nearest'})
  }
  return (
    <div className="selector-fecha-container" ref={scrollRef}>
      {fechas.map((fecha)=>{
        const seleccionada = isSameDay(fecha, fechaSeleccionada)
        return(
          <button
            key={fecha.toISOString()}
            type="button"
            className={`selector-fecha-item ${seleccionada ? 'selector-fecha-item--activa' : ''}`}
            onClick={(e) => handleSeleccion(fecha, e.currentTarget)}
          >
          <span className="selector-fecha-mes">{format(fecha, 'MMM', { locale: es })}</span>
            <span className="selector-fecha-dia">{format(fecha, 'd')}</span>
            <span className="selector-fecha-semana">{format(fecha, 'EEE', { locale: es })}</span>
          </button>
        )
      })}
    </div>
  )
}
export default SelectorFecha