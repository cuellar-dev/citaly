import { MESAS_MAPA } from '../data/mesasMapa.js'
import { saveFicha } from '../services/storage.js'
import { actualizarMiLocal, getMiLocal } from '../services/misLocales.js'
import { mesasDe, validarPlano, zonaDe } from './modelo.js'

/* El plano de cada local: de dónde sale, cómo se guarda y cómo lo leen las
   pantallas que solo necesitan "la lista de mesas".

   Locales sin plano propio (todos los de demo y los nuevos que aún no lo
   dibujaron) usan el PLANO DE SIEMPRE: el dibujo de 7 mesas que había antes,
   pasado al formato nuevo con los mismos ids (m-1 … m-7) para que las
   reservas que ya existen sigan apuntando a la misma mesa. */

/* Posiciones del plano de siempre en casillas (local mediano, 44 × 32). */
const LEGADO = {
  'm-1': { tipo: 'mesa-redonda', x: 9, y: 4, w: 4 },
  'm-2': { tipo: 'mesa-redonda', x: 17, y: 4, w: 4 },
  'm-6': { tipo: 'mesa-redonda', x: 25, y: 4, w: 5 },
  'm-7': { tipo: 'mesa-rect', x: 15, y: 13, w: 10, h: 4 },
  'm-3': { tipo: 'mesa-rect', x: 9, y: 23, w: 7, h: 4 },
  'm-4': { tipo: 'mesa-rect', x: 21, y: 23, w: 8, h: 4 },
  'm-5': { tipo: 'mesa-rect', x: 0, y: 10, w: 8, h: 4, rot: 90 },
}

const CAP_LEGADO = (normal) => ({ min: Math.max(1, Math.ceil(normal / 2)), normal, max: null })

/** El plano de siempre, con lo que el dueño cambió de cada mesa (`local.mesas`, formato viejo). */
export function planoLegado(local) {
  const cambios = new Map((local?.mesas ?? []).map((m) => [m.id, m]))
  const piezas = MESAS_MAPA.map((base) => {
    const sitio = LEGADO[base.id]
    const propio = cambios.get(base.id) ?? {}
    const normal = Number(propio.capacidad) || base.capacidad
    return {
      id: base.id,
      piso: 'p0',
      rot: 0,
      h: sitio.w,
      ...sitio,
      nombre: base.codigo.replace('MESA-', 'Mesa '),
      cap: propio.cap ?? CAP_LEGADO(normal),
      online: propio.online ?? true,
      rasgos: [],
      nota: propio.ubicacion ?? base.ubicacion,
    }
  })
  piezas.push(
    { id: 'legado-barra', tipo: 'barra', piso: 'p0', x: 34, y: 12, w: 12, h: 3, rot: 90 },
    { id: 'legado-entrada', tipo: 'entrada', piso: 'p0', x: 2, y: 30, w: 5, h: 2, rot: 0 },
    { id: 'legado-banos', tipo: 'banos', piso: 'p0', x: 38, y: 25, w: 5, h: 5, rot: 0 },
  )
  return validarPlano({
    tamano: 'mediano',
    forma: { tipo: 'rect' },
    pisos: [{ id: 'p0', nombre: 'Planta baja' }],
    piezas,
    juntas: [{ mesas: ['m-3', 'm-4'] }],
  })
}

/** El plano del local: el suyo si lo dibujó (y es válido), o el de siempre. */
export function planoDeLocal(local) {
  return validarPlano(local?.plano) ?? planoLegado(local)
}

export const tienePlanoPropio = (local) => Boolean(validarPlano(local?.plano))

/**
 * Las mesas del plano como las leen las pantallas de siempre (reserva, Mi
 * Negocio, recibo…):
 *   capacidad = la normal (la cómoda) · capMin / capMax = el rango completo
 *   ubicacion = la zona en la que está, o su nota, o el nombre del piso
 */
export function mesasDelPlano(plano) {
  const pisos = new Map(plano.pisos.map((p) => [p.id, p.nombre]))
  return mesasDe(plano).map((m) => ({
    id: m.id,
    codigo: m.nombre,
    nombre: m.nombre,
    tipo: m.tipo,
    piso: m.piso,
    capacidad: m.cap.normal,
    capMin: m.cap.min,
    capMax: m.cap.max ?? m.cap.normal,
    online: m.online,
    rasgos: m.rasgos,
    ubicacion: zonaDe(plano, m) || m.nota || (plano.pisos.length > 1 ? pisos.get(m.piso) : null) || 'Salón',
  }))
}

/* ---------- guardar ---------- */

/**
 * Guarda el plano del local. Los locales propios viven en misLocales y los
 * de demo en las "fichas" (cambios encima de locales.json); se escribe en
 * los dos sitios que lee getLocalById para que nunca se contradigan.
 * Devuelve false si el navegador no tiene sitio.
 * (Con backend: PUT /api/local/:id/plano. Ver docs/pendientes-backend.md.)
 */
export function guardarPlano(idLocal, plano) {
  const limpio = validarPlano(plano)
  if (!limpio) return false
  const ok = saveFicha(idLocal, { plano: limpio })
  if (ok && getMiLocal(idLocal)) actualizarMiLocal(idLocal, { plano: limpio })
  return ok
}

/* ---------- borrador mientras se edita ---------- */

const claveBorrador = (id) => `citaly_plano_borrador_${id}`

export function leerBorrador(idLocal) {
  try {
    const raw = JSON.parse(localStorage.getItem(claveBorrador(idLocal)))
    const plano = validarPlano(raw?.plano)
    return plano ? { plano, guardadoEn: raw.guardadoEn ?? null } : null
  } catch {
    return null
  }
}

export function guardarBorrador(idLocal, plano) {
  try {
    localStorage.setItem(claveBorrador(idLocal), JSON.stringify({ plano, guardadoEn: new Date().toISOString() }))
  } catch {
    /* Sin sitio: el borrador es una ayuda, no algo imprescindible. */
  }
}

export function borrarBorrador(idLocal) {
  try {
    localStorage.removeItem(claveBorrador(idLocal))
  } catch {
    /* nada */
  }
}
