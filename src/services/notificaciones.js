import { notificacionesDemo } from '../data/notificacionesDemo.js'
import { notisMisLocales } from './misLocales.js'
import { notisApertura } from './avisosApertura.js'
import { hayApi, pedir } from './api.js'
import { idUsuarioActual } from './sesion.js'
import { getCitas } from './storage.js'
import { HORA_PROPUESTA, venceLaPropuesta } from '../utils/estadosCita.js'
import { diaEnFrase, horaCorta } from '../utils/proponerHora.js'

/* Con backend (GET /api/notificaciones, PATCH /:id/leida, DELETE /:id) los
   avisos son los de la cuenta, sin los de la demo. Se guardan en memoria
   para que la campana y la página los lean al momento; sincronizarNotis()
   los trae y avisa con NOTIS_EVENTO. */
export const NOTIS_EVENTO = 'citaly:notis'
const PAGINAS_MAX = 5
let delServidor = { de: null, lista: [] }

/* Tipos del backend → tipos que pinta FilaNoti. */
function adaptarNoti(n) {
  const negocio = n.ambito === 'negocio'
  const tipo = {
    reserva_nueva: 'reserva',
    confirmada: negocio ? 'confirmo' : 'aceptada',
    cancelada: negocio ? 'cancelo' : 'rechazada',
    recordatorio: 'recordatorio',
    /* El local movió la hora (al cliente) y la respuesta del cliente (al dueño). */
    hora_propuesta: 'nuevaHora',
    propuesta_aceptada: 'aceptoHora',
    propuesta_cancelada: 'cancelo',
  }[n.tipo] ?? 'resumen'
  return {
    id: n.id,
    deApi: true,
    ambito: negocio ? 'negocio' : 'personal',
    tipo,
    titulo: n.titulo,
    texto: n.cuerpo,
    creadaEn: n.programada_para ?? n.creado_en,
    leida: Boolean(n.leida),
    enlace: negocio ? '/negocio' : '/citas',
    /* La cuenta atrás solo mientras la cita siga pendiente de verdad. */
    ...(tipo === 'reserva' && Number(n.cita_estado) === 0 ? { plazo: 15, accion: 'Ver y aceptar' } : null),
    /* Hora nueva: la cuenta atrás va hasta que vence la propuesta. */
    ...(tipo === 'nuevaHora' && Number(n.cita_estado) === HORA_PROPUESTA
      ? { plazo: plazoHasta(n.programada_para ?? n.creado_en, n.propuesta_vence), accion: 'Ver la nueva hora' }
      : null),
  }
}

/* Minutos entre que se avisó y que vence; null si no hay fecha de fin. */
function plazoHasta(desde, hasta) {
  if (!hasta) return null
  const min = Math.round((new Date(hasta) - new Date(desde)) / 60000)
  return min > 0 ? min : null
}

/* Sin backend: la hora que propuso un local sale de las citas de este
   navegador (ver services/propuestasDemo.js). Con backend la manda el servidor. */
export function notisPropuestas() {
  return getCitas()
    .filter((c) => c.estadoReserva === HORA_PROPUESTA && c.propuesta)
    .map((c) => {
      const en = c.propuesta.en ?? c.creadaEn
      const vence = venceLaPropuesta(c)
      const dia = c.propuesta.fecha !== c.fecha ? ` ${diaEnFrase(c.propuesta.fecha)}` : ''
      return {
        id: `hora-${c.id}-${en}`,
        ambito: 'personal',
        tipo: 'nuevaHora',
        titulo: `${c.localNombre || 'El local'} cambió la hora de tu cita`,
        texto: `De las ${horaCorta(c.horario)} a las ${horaCorta(c.propuesta.horario)}${dia}. ¿Te sirve? Acéptala o cancélala desde Mis citas.`,
        creadaEn: en,
        plazo: vence ? plazoHasta(en, vence) : null,
        enlace: '/citas',
        accion: 'Ver la nueva hora',
      }
    })
}

export async function sincronizarNotis() {
  const yo = idUsuarioActual()
  if (!hayApi || !yo) return
  const todas = []
  for (let pagina = 1; pagina <= PAGINAS_MAX; pagina++) {
    const filas = await pedir(`/api/notificaciones?page=${pagina}`)
    const lista = Array.isArray(filas) ? filas : []
    todas.push(...lista)
    if (lista.length < 10) break
  }
  delServidor = { de: yo, lista: todas.map(adaptarNoti) }
  window.dispatchEvent(new Event(NOTIS_EVENTO))
}

/* Borrar en el servidor espera a que pase el «deshacer» (10 s). */
const borradoPendiente = new Map()
const ESPERA_BORRAR_MS = 11000

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
  /* Sin sesión no hay avisos: ni los del servidor ni los guardados en este
     navegador («Avísame cuando abra»), que si no encendían la campana con un
     «1» a quien ni ha entrado. Vuelven al iniciar sesión. */
  if (!idUsuarioActual()) return []
  const leidas = leer(LEIDAS_KEY)
  const borradas = leer(BORRADAS_KEY)
  const base = hayApi
    ? [...(delServidor.de === idUsuarioActual() ? delServidor.lista : []), ...notisMisLocales(), ...notisApertura()]
    : [...notificacionesDemo(), ...notisPropuestas(), ...notisMisLocales(), ...notisApertura()]
  return base
    .filter((n) => !borradas.has(n.id))
    .map((n) => ({ ...n, leida: Boolean(n.leida) || leidas.has(n.id) }))
    .sort((a, b) => new Date(b.creadaEn) - new Date(a.creadaEn))
}

export function marcarLeidas(ids) {
  const leidas = leer(LEIDAS_KEY)
  ids.forEach((id) => leidas.add(id))
  guardar(LEIDAS_KEY, leidas)
  if (!hayApi) return
  const delApi = new Set(delServidor.lista.filter((n) => !n.leida).map((n) => n.id))
  ids.filter((id) => delApi.has(id)).forEach((id) => {
    pedir(`/api/notificaciones/${encodeURIComponent(id)}/leida`, { metodo: 'PATCH' }).catch(() => {})
  })
}

/* Se borra en el momento, no al acabar el aviso de deshacer: si cierras la
   app durante esos 10 s, lo borrado se queda borrado. Deshacer la devuelve. */
export function borrarNoti(id) {
  const borradas = leer(BORRADAS_KEY)
  borradas.add(id)
  guardar(BORRADAS_KEY, borradas)
  if (hayApi && delServidor.lista.some((n) => n.id === id)) {
    clearTimeout(borradoPendiente.get(id))
    borradoPendiente.set(
      id,
      setTimeout(() => {
        borradoPendiente.delete(id)
        pedir(`/api/notificaciones/${encodeURIComponent(id)}`, { metodo: 'DELETE' }).catch(() => {})
      }, ESPERA_BORRAR_MS),
    )
  }
}

export function restaurarNoti(id) {
  const borradas = leer(BORRADAS_KEY)
  borradas.delete(id)
  guardar(BORRADAS_KEY, borradas)
  clearTimeout(borradoPendiente.get(id))
  borradoPendiente.delete(id)
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
