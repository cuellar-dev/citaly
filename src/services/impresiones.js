/* Paso 3 — Registro de impresiones (docs/descubre-implementacion.md, sección 7).

   Qué tarjetas de Descubre vio de verdad el usuario (≥50 % en pantalla durante
   ≥1 s) y cuáles tocó, con su bloque y su posición. Es la base para afinar los
   pesos y para el factor "novedad".

   Mientras no haya backend, la cola vive en localStorage con un tope (los más
   viejos se tiran). Cuando exista `POST /eventos`, `enviarPendientes` la manda
   con sendBeacon; cada evento lleva un id propio para que reenviar no duplique.

   Solo se guarda lo listado: local, bloque, posición, tipo y fecha. */

const CLAVE = 'citaly_impresiones'
const TOPE = 500
/* Cuando haya backend: la ruta del endpoint. Mientras sea null no se envía nada. */
const URL_EVENTOS = null

function leer() {
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE))
    return Array.isArray(lista) ? lista : []
  } catch {
    return []
  }
}

function escribir(lista) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista.slice(-TOPE)))
  } catch {
    /* Sin espacio o sin localStorage: se pierde el evento, no la app. */
  }
}

export function getImpresiones() {
  return leer()
}

/** tipo: 'vista' | 'toque'. */
export function registrarEventos(eventos) {
  if (!eventos.length) return
  const en = new Date().toISOString()
  const nuevos = eventos.map((e) => ({
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    en,
    enviado: false,
    ...e,
  }))
  escribir([...leer(), ...nuevos])
}

/** Manda lo pendiente al servidor (cuando exista). Pensado para visibilitychange. */
export function enviarPendientes() {
  if (!URL_EVENTOS || !navigator.sendBeacon) return
  const lista = leer()
  const pendientes = lista.filter((e) => !e.enviado)
  if (!pendientes.length) return
  // eslint-disable-next-line no-unused-vars
  const ok = navigator.sendBeacon(URL_EVENTOS, JSON.stringify(pendientes.map(({ enviado, ...e }) => e)))
  if (ok) escribir(lista.map((e) => ({ ...e, enviado: true })))
}
