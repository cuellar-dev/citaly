import { notificacionesDemo } from '../data/notificacionesDemo.js'

/* Capa de notificaciones. Hoy es mock: la lista sale de la demo y lo único
   que se guarda es qué ids se leyeron y cuáles se borraron. Mañana se cambia
   el cuerpo de estas funciones por la API sin tocar la pantalla. */

const LEIDAS_KEY = 'citaly_notis_leidas'
const BORRADAS_KEY = 'citaly_notis_borradas'

function leer(clave) {
  try {
    return new Set(JSON.parse(localStorage.getItem(clave)) ?? [])
  } catch {
    return new Set()
  }
}

function guardar(clave, set) {
  try {
    localStorage.setItem(clave, JSON.stringify([...set]))
  } catch {
    /* Sin sitio o sin storage: se pierde el cambio, nada más. */
  }
}

/** Más recientes primero, sin las borradas. */
export function getNotificaciones() {
  const leidas = leer(LEIDAS_KEY)
  const borradas = leer(BORRADAS_KEY)
  return notificacionesDemo()
    .filter((n) => !borradas.has(n.id))
    .map((n) => ({ ...n, leida: Boolean(n.leida) || leidas.has(n.id) }))
    .sort((a, b) => new Date(b.creadaEn) - new Date(a.creadaEn))
}

export function marcarLeidas(ids) {
  const leidas = leer(LEIDAS_KEY)
  ids.forEach((id) => leidas.add(id))
  guardar(LEIDAS_KEY, leidas)
}

/* Se borra en el momento, no al acabar el aviso de deshacer: si cierras la
   app durante esos 10 s, lo borrado se queda borrado. Deshacer la devuelve. */
export function borrarNoti(id) {
  const borradas = leer(BORRADAS_KEY)
  borradas.add(id)
  guardar(BORRADAS_KEY, borradas)
}

export function restaurarNoti(id) {
  const borradas = leer(BORRADAS_KEY)
  borradas.delete(id)
  guardar(BORRADAS_KEY, borradas)
}

/* La campana cuenta lo no leído y, además, lo que sigue pidiendo una acción
   aunque ya lo hayas visto: una reserva por aceptar no deja de ser urgente
   porque abrieras la página. */
export function contarSinLeer(ahora = new Date()) {
  return getNotificaciones().filter((n) => !n.leida || requiereAccion(n, ahora)).length
}

/** Minutos que quedan para actuar, o null si no tiene plazo o ya venció. */
export function minutosRestantes(noti, ahora = new Date()) {
  if (!noti.plazo) return null
  const fin = new Date(noti.creadaEn).getTime() + noti.plazo * 60 * 1000
  const quedan = Math.ceil((fin - ahora.getTime()) / 60000)
  return quedan > 0 ? quedan : null
}

/** El plazo existía y ya pasó. */
export function vencida(noti, ahora = new Date()) {
  return Boolean(noti.plazo) && minutosRestantes(noti, ahora) == null
}

/* Tiene cuenta atrás y aún no venció: hay que hacer algo. Estas no se pueden
   borrar y se quedan arriba del todo hasta que se acabe su plazo. */
export function requiereAccion(noti, ahora = new Date()) {
  return minutosRestantes(noti, ahora) != null
}
