/* Dónde está el usuario, para "Cerca de ti" y para la distancia de las
   tarjetas ("A 1,2 km").

   - Solo se pide tras un gesto (el botón "Ver lo que tengo cerca"), nunca al
     abrir la app: pedir permisos sin contexto hace que la gente diga que no.
   - Se queda en ESTE dispositivo (localStorage) y caduca a las 3 horas. No se
     manda nunca al servidor: es un dato muy sensible
     (docs/descubre-implementacion.md, 14.1). */

const CLAVE = 'citaly_ubicacion'
const VALIDA_MS = 3 * 60 * 60 * 1000
export const UBICACION_EVENTO = 'citaly:ubicacion'

let enMemoria

/** { lat, lng } o null si no hay o ya caducó. */
export function getUbicacion() {
  if (enMemoria !== undefined && (!enMemoria || Date.now() - enMemoria.en < VALIDA_MS)) {
    return enMemoria ? { lat: enMemoria.lat, lng: enMemoria.lng } : null
  }
  try {
    const guardada = JSON.parse(localStorage.getItem(CLAVE))
    enMemoria = guardada && Date.now() - guardada.en < VALIDA_MS ? guardada : null
  } catch {
    enMemoria = null
  }
  return enMemoria ? { lat: enMemoria.lat, lng: enMemoria.lng } : null
}

function guardar(lat, lng) {
  enMemoria = { lat, lng, en: Date.now() }
  try {
    localStorage.setItem(CLAVE, JSON.stringify(enMemoria))
  } catch {
    /* Sin localStorage: vale para esta visita. */
  }
  window.dispatchEvent(new Event(UBICACION_EVENTO))
}

/**
 * Pide la posición al navegador. Resuelve { lat, lng } o rechaza con un
 * motivo: 'sin-gps' (el navegador no sabe) o 'sin-permiso'.
 */
export function pedirUbicacion() {
  return new Promise((resolver, rechazar) => {
    if (!navigator.geolocation) {
      rechazar(new Error('sin-gps'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        /* 4 decimales (~10 m): de sobra para ordenar por cercanía. */
        const lat = Math.round(coords.latitude * 1e4) / 1e4
        const lng = Math.round(coords.longitude * 1e4) / 1e4
        guardar(lat, lng)
        resolver({ lat, lng })
      },
      (error) => rechazar(new Error(error.code === 1 ? 'sin-permiso' : 'sin-gps')),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 5 * 60 * 1000 },
    )
  })
}

export function olvidarUbicacion() {
  enMemoria = null
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    /* nada */
  }
  window.dispatchEvent(new Event(UBICACION_EVENTO))
}
