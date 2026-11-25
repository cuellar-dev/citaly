import { format, parseISO, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { fechasDisponiblesLocal } from './fechasLocal.js'
import { horariosDelDia } from './reservaHorarios.js'
import { CANCELADA, HORA_PROPUESTA } from './estadosCita.js'

/* Las horas que el dueño puede proponer al mover una cita: las del turno del
   local, menos las pasadas y las que ya están llenas. Una hora cuenta como
   llena cuando hay tantas citas vivas como sitios en paralelo (1 en un
   servicio, las mesas online en un local de mesas). Las horas que el local
   ya propuso a otros clientes también ocupan: están guardadas para ellos. */

const DIAS_A_MIRAR = 7

function horasQueOcupa(c) {
  const horas = [{ fecha: c.fecha, horario: c.horario }]
  if (c.estadoReserva === HORA_PROPUESTA && c.propuesta) horas.push(c.propuesta)
  return horas
}

/** Horas llenas de un día ('yyyy-MM-dd'), sin contar la cita que se está moviendo. */
export function horasLlenas(citas, clave, { excepto, enParalelo = 1 } = {}) {
  const cuenta = new Map()
  citas.forEach((c) => {
    if (c.id === excepto || c.estadoReserva === CANCELADA) return
    horasQueOcupa(c)
      .filter((h) => h.fecha === clave)
      .forEach((h) => cuenta.set(h.horario, (cuenta.get(h.horario) ?? 0) + 1))
  })
  return [...cuenta].filter(([, n]) => n >= Math.max(1, enParalelo)).map(([hora]) => hora)
}

/**
 * Días abiertos desde el de la cita (o desde hoy, si la cita es de antes) con
 * sus horas y estado: libre | pasada | ocupada. La hora actual de la cita sale
 * como 'actual' para que se vea de dónde se mueve.
 */
export function diasParaProponer(local, citas, cita, { ahora = new Date(), enParalelo = 1, dias = DIAS_A_MIRAR } = {}) {
  if (!local?.horarioApertura || !local?.horarioCierre) return []
  const hoy = startOfDay(ahora)
  const desdeCita = startOfDay(parseISO(cita.fecha))
  const inicio = desdeCita > hoy ? desdeCita : hoy
  return fechasDisponiblesLocal(inicio, local.dias ?? [], dias).map((fecha) => {
    const clave = format(fecha, 'yyyy-MM-dd')
    const llenas = horasLlenas(citas, clave, { excepto: cita.id, enParalelo })
    const horas = horariosDelDia(local, fecha, { ahora, tomadas: llenas }).map((h) =>
      clave === cita.fecha && h.hora === cita.horario ? { ...h, estado: 'actual' } : h,
    )
    const etiqueta = format(fecha, "EEE d", { locale: es })
    return {
      clave,
      fecha,
      etiqueta: etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1),
      horas,
      libres: horas.filter((h) => h.estado === 'libre').length,
    }
  })
}

/** '16:30' → '4:30 PM', como el resto de la agenda. */
export function horaCorta(horario) {
  const [h, m] = String(horario).split(':').map(Number)
  const sufijo = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${sufijo}`
}

/** «hoy», «mañana» o «el jueves 27», para frases. */
export function diaEnFrase(clave, ahora = new Date()) {
  const hoy = format(ahora, 'yyyy-MM-dd')
  const manana = format(new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1), 'yyyy-MM-dd')
  if (clave === hoy) return 'hoy'
  if (clave === manana) return 'mañana'
  return `el ${format(parseISO(clave), "EEEE d", { locale: es })}`
}
