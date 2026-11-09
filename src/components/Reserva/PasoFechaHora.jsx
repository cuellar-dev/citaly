import { CalendarX2, Clock, MoonStar } from 'lucide-react'
import SelectorFecha from '../SelectorFecha/SelectorFecha.jsx'
import SelectorHorario from '../SelectorHorario/SelectorHorario.jsx'
import { VacioReserva } from './ReservaShell.jsx'

/* Día y hora. Es el único paso idéntico en las dos pantallas, así que vive
   aquí una sola vez. */

function PasoFechaHora({ agenda, dia, horario, onFecha, onHora }) {
  if (agenda.sinHuecos) {
    return (
      <div className="reserva-vacio">
        <VacioReserva
          icono={CalendarX2}
          titulo="No quedan huecos estos días"
          texto="Este local no tiene horas libres en las próximas dos semanas. Prueba más adelante o escríbeles."
        />
      </div>
    )
  }

  const hayLibres = dia?.horas.some((h) => h.estado === 'libre')

  return (
    <div className="reserva-fechahora">
      <SelectorFecha
        dias={agenda.dias}
        fechaSeleccionada={dia?.fecha}
        onSeleccionar={onFecha}
      />

      <div className="reserva-horas">
        <p className="reserva-horas-titulo">
          <Clock size={15} strokeWidth={2.2} aria-hidden="true" />
          Hora
        </p>

        {hayLibres ? (
          <>
            <SelectorHorario
              horas={dia.horas}
              horarioSeleccionado={horario}
              onSeleccionar={onHora}
            />
            <p className="reserva-horas-leyenda">
              Las apagadas ya pasaron o las tienes cogidas.
            </p>
          </>
        ) : (
          <div className="reserva-vacio reserva-vacio--plano">
            <VacioReserva
              icono={MoonStar}
              titulo="Por hoy ya cerraron"
              texto="Elige otro día en la tira de arriba."
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default PasoFechaHora
