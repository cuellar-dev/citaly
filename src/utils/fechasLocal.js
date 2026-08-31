import { addDays, isSameDay } from 'date-fns'

export const MAPA_DIAS = { 0: 'd', 1: 'l', 2: 'm', 3: 'x', 4: 'j', 5: 'v', 6: 's' }

export function fechasDisponiblesLocal(hoy, diasLocal, diasAMostrar = 14) {
  const fechas = Array.from({ length: diasAMostrar }, (_, i) => addDays(hoy, i))
  return fechas.filter((fecha) => diasLocal.includes(MAPA_DIAS[fecha.getDay()]))
}

/** Fecha efectiva para selector, horarios y guardar cita. */
export function fechaEnUso(fechaSeleccionada, fechasDisponibles) {
  if (fechasDisponibles.length === 0) return fechaSeleccionada
  const valida = fechasDisponibles.some((f) => isSameDay(f, fechaSeleccionada))
  return valida ? fechaSeleccionada : fechasDisponibles[0]
}
