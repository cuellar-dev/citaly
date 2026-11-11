import { addDays, differenceInMinutes, format, isToday, isTomorrow } from 'date-fns'
import { es } from 'date-fns/locale'
import { codigoDia } from './fichaLocal.js'

/* La pausa de la agenda: mientras dura, no entran reservas nuevas.

   Se guarda en la ficha del local como { desde, hasta, motivo } (fechas ISO).
   No hay que acordarse de quitarla: cuando pasa `hasta`, deja de contar
   sola. "Hasta mañana" significa hasta la próxima vez que el local abre, que
   puede no ser mañana (si mañana es su día libre). */

export function pausaActiva(pausa, ahora = new Date()) {
  if (!pausa?.hasta) return false
  return new Date(pausa.hasta) > ahora
}

/** La próxima apertura del local después de hoy. */
export function proximaApertura(local, ahora = new Date()) {
  const [h, m] = String(local.horarioApertura || '09:00').split(':').map(Number)
  for (let i = 1; i <= 7; i++) {
    const dia = addDays(ahora, i)
    if (!local.dias?.length || local.dias.includes(codigoDia(dia))) {
      dia.setHours(h, m || 0, 0, 0)
      return dia
    }
  }
  const dia = addDays(ahora, 1)
  dia.setHours(h, m || 0, 0, 0)
  return dia
}

function hora(fecha) {
  return format(fecha, 'h:mm a')
}

/** "3:40 PM", "mañana a las 9:00 AM", "el viernes a las 9:00 AM". */
export function textoHasta(fecha) {
  if (isToday(fecha)) return hora(fecha)
  if (isTomorrow(fecha)) return `mañana a las ${hora(fecha)}`
  return `el ${format(fecha, 'EEEE', { locale: es })} a las ${hora(fecha)}`
}

/** "45 min", "2 h 10 min". */
export function textoQueda(hasta, ahora = new Date()) {
  const min = Math.max(differenceInMinutes(hasta, ahora), 0)
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const resto = min % 60
  return resto ? `${h} h ${resto} min` : `${h} h`
}
