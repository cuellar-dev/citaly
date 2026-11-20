import { mesasDe } from './modelo.js'

/* Qué puede reservar un grupo en un plano, a una hora concreta.

   El cliente solo dice cuántos van. Los rangos de cada mesa (mínimo, normal
   y apretada) los sabe el dueño; el cliente nunca los ve. El orden es el
   acordado, y solo se enseña el primer nivel que tenga algo:

     1. comoda    una mesa sola donde caben cómodos (mínimo ≤ grupo ≤ normal)
     2. apretada  una mesa sola, apretándose (normal < grupo ≤ apretada)
     3. juntas    mesas que el dueño marcó como unibles, todas libres

   Si no hay nada, esa hora no tiene sitio para ese grupo (y la agenda la
   marca así). Ya no existe la "reserva de grupo a cuadrar en el local":
   lo que antes se cuadraba en la puerta, ahora son mesas juntas elegidas. */

export const NIVELES = ['comoda', 'apretada', 'juntas']

const reservable = (m, ocupadas) => m.online && !ocupadas.has(m.id)

/**
 * @param {object} plano
 * @param {number} personas
 * @param {Set<string>} ocupadas  ids de mesas cogidas a esa hora
 * @returns {{ nivel: string | null, mesas: string[], juntas: object[] }}
 */
export function opcionesParaGrupo(plano, personas, ocupadas = new Set()) {
  if (!personas) return { nivel: null, mesas: [], juntas: [] }
  const mesas = mesasDe(plano)

  const comodas = mesas.filter((m) => reservable(m, ocupadas) && m.cap.min <= personas && personas <= m.cap.normal)
  if (comodas.length) return { nivel: 'comoda', mesas: comodas.map((m) => m.id), juntas: [] }

  const apretadas = mesas.filter(
    (m) => reservable(m, ocupadas) && m.cap.max != null && m.cap.normal < personas && personas <= m.cap.max,
  )
  if (apretadas.length) return { nivel: 'apretada', mesas: apretadas.map((m) => m.id), juntas: [] }

  const porId = new Map(mesas.map((m) => [m.id, m]))
  const juntas = plano.juntas.filter(
    (j) =>
      j.mesas.every((id) => porId.get(id) && reservable(porId.get(id), ocupadas)) &&
      j.cap.min <= personas &&
      personas <= (j.cap.max ?? j.cap.normal),
  )
  if (juntas.length) {
    /* Primero las que van más justas: no se gasta una fila de 4 mesas en 5 personas. */
    juntas.sort((a, b) => a.cap.normal - b.cap.normal || a.mesas.length - b.mesas.length)
    return { nivel: 'juntas', mesas: [...new Set(juntas.flatMap((j) => j.mesas))], juntas }
  }

  return { nivel: null, mesas: [], juntas: [] }
}

/** El grupo más grande que se puede reservar en el plano (mesas solas o juntas). */
export function maxPersonas(plano) {
  const mesas = mesasDe(plano).filter((m) => m.online)
  const porId = new Map(mesas.map((m) => [m.id, m]))
  const tope = Math.max(
    1,
    ...mesas.map((m) => m.cap.max ?? m.cap.normal),
    ...plano.juntas.filter((j) => j.mesas.every((id) => porId.has(id))).map((j) => j.cap.max ?? j.cap.normal),
  )
  return Math.min(tope, 40)
}

/**
 * Estado de cada mesa para pintarla, según las opciones del grupo.
 * Sin grupo todavía: todas libres (el plano va apagado de todas formas).
 */
export function estadosMesas(plano, opciones, ocupadas = new Set(), conGrupo = true) {
  const sirven = new Set(opciones.mesas)
  const estados = new Map()
  for (const m of mesasDe(plano)) {
    if (!m.online) estados.set(m.id, 'local')
    else if (ocupadas.has(m.id)) estados.set(m.id, 'ocupada')
    else if (!conGrupo) estados.set(m.id, 'libre')
    else if (sirven.has(m.id)) estados.set(m.id, opciones.nivel === 'juntas' ? 'opcion' : 'libre')
    else estados.set(m.id, 'nocabe')
  }
  return estados
}

/** Ids de mesa que ocupa una reserva (una mesa, o varias si van juntas). */
export function mesasDeReserva(r) {
  if (Array.isArray(r?.mesaIds) && r.mesaIds.length) return r.mesaIds
  if (Array.isArray(r?.mesa?.ids) && r.mesa.ids.length) return r.mesa.ids
  const id = r?.mesaId ?? r?.mesa?.id
  return id ? [id] : []
}

/**
 * Mesas cogidas en una fecha y hora. Junta las reservas del local (hoy, las
 * de demo; con backend, GET /api/local/:id/mesas-ocupadas) y las del propio
 * usuario en ese local.
 */
export function mesasOcupadas(reservas, fecha, horario) {
  const cogidas = new Set()
  for (const r of reservas) {
    if (r.fecha !== fecha || r.horario !== horario || r.estadoReserva === 3) continue
    for (const id of mesasDeReserva(r)) cogidas.add(id)
  }
  return cogidas
}
