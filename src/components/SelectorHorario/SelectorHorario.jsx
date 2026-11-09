import './selectorHorario.css'

/* Rejilla de horas del turno. Recibe TODAS las horas del día con su estado,
   no una lista ya filtrada: así se ve el turno completo y se entiende por qué
   una hora no se puede coger, en vez de aparecer una rejilla a medias. */

const TITULO = {
  pasada: 'Esa hora ya pasó',
  ocupada: 'Ya tienes una reserva a esta hora aquí',
}

function SelectorHorario({ horas, horarioSeleccionado, onSeleccionar }) {
  return (
    <div className="selector-horario-container" role="group" aria-label="Hora de la reserva">
      {horas.map(({ hora, estado }) => {
        const libre = estado === 'libre'
        const activo = hora === horarioSeleccionado
        return (
          <button
            key={hora}
            type="button"
            disabled={!libre}
            title={TITULO[estado]}
            aria-pressed={activo}
            aria-label={`${hora}${estado === 'pasada' ? ', ya pasó' : ''}${
              estado === 'ocupada' ? ', ya reservada por ti' : ''
            }`}
            className={`selector-horario-item selector-horario-item--${estado}${
              activo ? ' selector-horario-item--activo' : ''
            }`}
            onClick={() => onSeleccionar(hora)}
          >
            {hora}
          </button>
        )
      })}
    </div>
  )
}

export default SelectorHorario
