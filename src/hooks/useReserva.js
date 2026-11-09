import { useEffect, useMemo, useState } from 'react'
import { startOfToday } from 'date-fns'
import { agendaDelLocal, diaEnUso, horasYaReservadas } from '../utils/reservaHorarios.js'

/* Cuánto hay que bajar (en px) para que la guía de pasos se pegue arriba. */
export const SCROLL_GUIA = 120

const AGENDA_VACIA = { dias: [], fechas: [], primeraReservable: null, sinHuecos: true }

/**
 * Estado común de las dos pantallas de reserva: qué día es hoy, la agenda real
 * del local, el día y la hora elegidos, y si la guía de pasos va pegada arriba.
 *
 * La fecha arranca en `null` a propósito. Antes arrancaba en HOY, y si el local
 * cerraba hoy la pantalla marcaba igual un día inservible; ahora, mientras el
 * usuario no toque nada, se usa el primer día con hueco de verdad.
 */
export function useReserva(local, citas = []) {
  const [hoy, setHoy] = useState(() => startOfToday())
  const [ahora, setAhora] = useState(() => new Date())
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null)
  const [horario, setHorario] = useState(null)
  const [guiaPegada, setGuiaPegada] = useState(false)

  /* El reloj avanza: una hora que acaba de pasar deja de poder elegirse sola. */
  useEffect(() => {
    const refrescar = () => {
      setAhora(new Date())
      setHoy(startOfToday())
    }
    const id = setInterval(refrescar, 60000)
    const alVolver = () => {
      if (document.visibilityState === 'visible') refrescar()
    }
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [])

  useEffect(() => {
    const alScroll = () => setGuiaPegada(window.scrollY > SCROLL_GUIA)
    alScroll()
    window.addEventListener('scroll', alScroll, { passive: true })
    return () => window.removeEventListener('scroll', alScroll)
  }, [])

  const localId = local?.id
  const agenda = useMemo(() => {
    if (!local) return AGENDA_VACIA
    return agendaDelLocal(local, {
      hoy,
      ahora,
      tomadasDe: (fecha) => horasYaReservadas(citas, localId, fecha),
    })
  }, [local, localId, hoy, ahora, citas])

  const dia = diaEnUso(agenda, fechaSeleccionada)

  /* Si la hora guardada deja de poder usarse (dio la hora mientras mirabas, o
     cambió el día) se ignora al vuelo. Derivado en el render y no en un efecto:
     así nunca se confirma una hora que ya no existe, ni hay un render de más. */
  const horarioValido = dia?.horas.some((h) => h.hora === horario && h.estado === 'libre')
    ? horario
    : null

  function elegirFecha(fecha) {
    setFechaSeleccionada(fecha)
    setHorario(null)
  }

  function reiniciarFechaYHora() {
    setFechaSeleccionada(null)
    setHorario(null)
  }

  return {
    hoy,
    ahora,
    agenda,
    dia,
    fecha: dia?.fecha ?? null,
    horas: dia?.horas ?? [],
    horario: horarioValido,
    setHorario,
    elegirFecha,
    reiniciarFechaYHora,
    guiaPegada,
  }
}
