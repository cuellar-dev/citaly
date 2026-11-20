import { hayApi } from './api.js'
import { enviarEventos } from './descubreApi.js'

/* Paso 3 — Registro de impresiones (docs/descubre-implementacion.md, sección 7).

   Qué tarjetas de Descubre vio de verdad el usuario (≥50 % en pantalla durante
   ≥1 s) y cuáles tocó, con su bloque y su posición. Es la base para afinar los
   pesos y para el factor "novedad".

   La cola vive en localStorage con un tope (los más viejos se tiran). Si hay
   backend (VITE_API_URL), `enviarPendientes` manda lo no enviado a
   POST /api/descubre/eventos en lotes de 100. Cada evento lleva un UUID propio:
   reenviar un lote que ya llegó no duplica nada (el backend lo ignora).

   Solo se guarda lo listado: local, bloque, posición, tipo, semilla y fecha. */

const CLAVE = 'citaly_impresiones'
const TOPE = 500
const LOTE = 100

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

/* UUID v4: el backend solo acepta ids con ese formato. */
function uuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  const b = new Uint8Array(16)
  globalThis.crypto.getRandomValues(b)
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

export function getImpresiones() {
  return leer()
}

/** tipo: 'vista' | 'toque'. */
export function registrarEventos(eventos) {
  if (!eventos.length) return
  const en = new Date().toISOString()
  const nuevos = eventos.map((e) => ({ id: uuid(), en, enviado: false, ...e }))
  escribir([...leer(), ...nuevos])
}

let enviando = false

/** Manda lo pendiente al backend (si hay). Pensado para visibilitychange. */
export async function enviarPendientes() {
  if (!hayApi || enviando) return
  const pendientes = leer().filter((e) => !e.enviado).slice(0, LOTE)
  if (!pendientes.length) return
  enviando = true
  try {
    await enviarEventos(pendientes)
    /* Llegó (o el backend lo descartó por inválido: reenviarlo no ayudaría). */
    const ids = new Set(pendientes.map((e) => e.id))
    escribir(leer().map((e) => (ids.has(e.id) ? { ...e, enviado: true } : e)))
  } catch (error) {
    /* Sin conexión o servidor caído: se queda pendiente para la próxima.
       Un 4xx de lote (formato) sí se marca como enviado para no atascar la cola. */
    if (error.status >= 400 && error.status < 500) {
      const ids = new Set(pendientes.map((e) => e.id))
      escribir(leer().map((e) => (ids.has(e.id) ? { ...e, enviado: true } : e)))
    }
  } finally {
    enviando = false
  }
}
