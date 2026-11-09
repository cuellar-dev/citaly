import { addMinutes, format, isAfter, isBefore, isSameDay, parse } from 'date-fns'
import { fechasDisponiblesLocal } from './fechasLocal.js'

/* Horas de un turno y en qué estado está cada una. Lo comparten las dos
   pantallas de reserva (mesa y servicio). */

export function generarHorarios(apertura, cierre, intervaloMinutos) {
  const slots = []
  let actual = parse(apertura, 'HH:mm', new Date())
  const fin = parse(cierre, 'HH:mm', new Date())
  while (isBefore(actual, fin)) {
    slots.push(format(actual, 'HH:mm'))
    actual = addMinutes(actual, intervaloMinutos || 60)
  }
  return slots
}

/**
 * Las horas del día con su estado, en vez de una lista ya filtrada.
 * Así el usuario ve el turno completo y entiende por qué una hora no se puede,
 * en lugar de encontrarse una rejilla a medias sin explicación.
 *
 * libre | pasada (hoy, ya dieron) | ocupada (el usuario ya reservó esa hora aquí)
 */
export function horariosDelDia(local, fecha, { ahora = new Date(), tomadas = [] } = {}) {
  const todas = generarHorarios(
    local.horarioApertura,
    local.horarioCierre,
    local.intervaloMinutos,
  )
  const esHoy = isSameDay(fecha, ahora)

  return todas.map((hora) => {
    if (esHoy && !isAfter(parse(hora, 'HH:mm', fecha), ahora)) {
      return { hora, estado: 'pasada' }
    }
    if (tomadas.includes(hora)) return { hora, estado: 'ocupada' }
    return { hora, estado: 'libre' }
  })
}

export function hayHueco(horas) {
  return horas.some((h) => h.estado === 'libre')
}

/**
 * La agenda del local: qué días abre y, de esos, cuáles tienen hueco de verdad.
 *
 * `primeraReservable` es la clave del arreglo: antes la fecha inicial era
 * siempre HOY, y si el local cerraba hoy —o ya había pasado la hora de cierre—
 * la pantalla marcaba igualmente un día que no se podía usar. Ahora se empieza
 * en el primer día con al menos una hora libre.
 */
export function agendaDelLocal(local, { hoy, ahora = new Date(), diasAMostrar = 14, tomadasDe } = {}) {
  const abiertos = fechasDisponiblesLocal(hoy, local.dias ?? [], diasAMostrar)

  const dias = abiertos.map((fecha) => {
    const horas = horariosDelDia(local, fecha, {
      ahora,
      tomadas: tomadasDe ? tomadasDe(fecha) : [],
    })
    return { fecha, horas, reservable: hayHueco(horas) }
  })

  return {
    dias,
    fechas: dias.map((d) => d.fecha),
    primeraReservable: dias.find((d) => d.reservable)?.fecha ?? null,
    /* Ni un hueco en toda la ventana: la pantalla lo dice en vez de enseñar
       una rejilla vacía. */
    sinHuecos: dias.length === 0 || dias.every((d) => !d.reservable),
  }
}

/** El día elegido dentro de la agenda, o el primero reservable si ya no vale. */
export function diaEnUso(agenda, fechaSeleccionada) {
  if (!fechaSeleccionada) {
    return agenda.dias.find((d) => d.reservable) ?? agenda.dias[0] ?? null
  }
  const elegido = agenda.dias.find((d) => isSameDay(d.fecha, fechaSeleccionada))
  if (elegido) return elegido
  return agenda.dias.find((d) => d.reservable) ?? agenda.dias[0] ?? null
}

/** Horas que el usuario ya tiene reservadas en ese local y ese día. */
export function horasYaReservadas(citas, localId, fecha) {
  const dia = format(fecha, 'yyyy-MM-dd')
  return citas
    .filter((c) => c.localId === localId && c.fecha === dia && c.estadoReserva !== 3)
    .map((c) => c.horario)
}
