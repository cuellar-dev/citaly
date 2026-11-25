import { proximaAperturaFecha } from '../utils/descubre.js'

/* «Avísame cuando abra», de momento SOLO en el front: se guarda en este
   navegador la próxima hora de apertura del local y, cuando llega, aparece un
   aviso normal en Notificaciones (y en la campana).

   Pendiente en el backend (docs/pendientes-backend.md): tabla de
   suscripciones + tarea que cree la notificación al abrir, para que llegue
   en cualquier dispositivo. Cuando exista, se cambia el cuerpo de estas
   funciones por la API sin tocar la pantalla. */

const CLAVE = 'citaly_avisos_apertura'
export const AVISOS_APERTURA_EVENTO = 'citaly:avisos-apertura'
/* Un aviso ya disparado se queda una semana en la lista y luego se olvida. */
const CADUCA_MS = 7 * 24 * 60 * 60 * 1000

function leer() {
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE))
    return Array.isArray(lista) ? lista : []
  } catch {
    return []
  }
}

function guardar(lista) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista))
  } catch {
    /* Sin storage: el aviso no se guarda, nada más. */
  }
  window.dispatchEvent(new Event(AVISOS_APERTURA_EVENTO))
  /* La campana y la página de avisos escuchan este. */
  window.dispatchEvent(new Event('citaly:notis'))
  programar()
}

/** ¿Hay un aviso pendiente (aún sin disparar) para este local? */
export function tieneAvisoApertura(localId, ahora = new Date()) {
  return leer().some((a) => a.localId === String(localId) && new Date(a.abreEn) > ahora)
}

/** Apunta el aviso. Devuelve la fecha en que llegará, o null si no se sabe cuándo abre. */
export function pedirAvisoApertura(local, ahora = new Date()) {
  const abreEn = proximaAperturaFecha(local, ahora)
  if (!abreEn) return null
  const id = String(local.id)
  const lista = leer().filter((a) => a.localId !== id || new Date(a.abreEn) <= ahora)
  lista.push({ localId: id, nombre: local.localName, abreEn: abreEn.toISOString(), pedidoEn: ahora.toISOString() })
  guardar(lista)
  return abreEn
}

export function quitarAvisoApertura(localId, ahora = new Date()) {
  guardar(leer().filter((a) => a.localId !== String(localId) || new Date(a.abreEn) <= ahora))
}

/** Los avisos que ya tocaron, con la forma que pinta FilaNoti. */
export function notisApertura(ahora = new Date()) {
  return leer()
    .filter((a) => {
      const t = new Date(a.abreEn).getTime()
      return t <= ahora.getTime() && ahora.getTime() - t < CADUCA_MS
    })
    .map((a) => ({
      id: `abre-${a.localId}-${a.abreEn}`,
      ambito: 'personal',
      tipo: 'abre',
      titulo: `${a.nombre} ya está abierto`,
      texto: 'Nos pediste que te avisáramos. Si te apetece, ya puedes ir o reservar.',
      creadaEn: a.abreEn,
      enlace: `/local/${a.localId}`,
      accion: 'Ver el local',
    }))
}

/* Si la app sigue abierta cuando llega la hora, la campana se entera al
   momento (setTimeout no aguanta más de ~24 días; con un día basta). */
let temporizador = null
function programar() {
  clearTimeout(temporizador)
  const ahora = Date.now()
  const proxima = leer()
    .map((a) => new Date(a.abreEn).getTime())
    .filter((t) => t > ahora)
    .sort((a, b) => a - b)[0]
  if (!proxima || proxima - ahora > 24 * 60 * 60 * 1000) return
  temporizador = setTimeout(() => {
    window.dispatchEvent(new Event('citaly:notis'))
    window.dispatchEvent(new Event(AVISOS_APERTURA_EVENTO))
    programar()
  }, proxima - ahora + 1000)
}

if (typeof window !== 'undefined') programar()
