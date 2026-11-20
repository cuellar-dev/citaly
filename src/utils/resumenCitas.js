import { CANCELADA, CONFIRMADA } from './estadosCita.js'
import { esCitaPasada } from './citasVista.js'

/* Lo que Mis Citas cuenta debajo de la lista: números del año, los sitios
   fijos del cliente y sus últimas citas para preguntarle cómo le fue.

   Todo sale de las citas reales del cliente (useCitas), nada es mock. */

/* Modo «confianza» de docs/descubre-ranking.md: se busca uno y se queda.
   Interno, nunca se enseña esta palabra al usuario. */
const CATEGORIAS_CONFIANZA = new Set(['Peluquería', 'Barbería', 'Uñas'])

const DIAS = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados']

function instante(cita) {
  return new Date(`${cita.fecha}T${cita.horario || '12:00'}:00`)
}

/** Fue de verdad: confirmada, ya pasó y no dijo que faltó. */
export function esIda(cita, ahora = new Date()) {
  return cita.estadoReserva === CONFIRMADA && esCitaPasada(cita, ahora) && cita.asistencia !== 'no'
}

function gastoDe(cita) {
  if (cita.esLugar) return Number(cita.precioReserva) || 0
  return Number(cita.precioTotal) || 0
}

export function estadisticasCliente(citas, ahora = new Date()) {
  const haceUnAnio = new Date(ahora)
  haceUnAnio.setFullYear(haceUnAnio.getFullYear() - 1)
  const idas = citas.filter((c) => esIda(c, ahora) && instante(c) >= haceUnAnio)
  const canceladas = citas.filter((c) => c.estadoReserva === CANCELADA && instante(c) >= haceUnAnio)

  /* El día de la semana que más se repite, si se repite de verdad. */
  const porDia = new Array(7).fill(0)
  idas.forEach((c) => porDia[instante(c).getDay()]++)
  const maxDia = Math.max(...porDia)
  const diaFavorito = maxDia >= 2 ? DIAS[porDia.indexOf(maxDia)] : null

  const porLocal = new Map()
  idas.forEach((c) => {
    const actual = porLocal.get(c.localId) ?? { id: c.localId, nombre: c.localNombre, veces: 0 }
    porLocal.set(c.localId, { ...actual, veces: actual.veces + 1 })
  })
  const masVisitado = [...porLocal.values()].sort((a, b) => b.veces - a.veces)[0] ?? null

  return {
    idas: idas.length,
    canceladas: canceladas.length,
    gastado: idas.reduce((t, c) => t + gastoDe(c), 0),
    diaFavorito,
    masVisitado,
  }
}

/* Un sitio es «fijo» (docs/descubre-ranking.md, 7.3): dos idas al mismo
   local de confianza. La nota manda: si lo valoró con 1–3 no es su sitio
   aunque haya vuelto. 4, 5 o sin nota cuentan como fijo. */
export function sitiosFijos(citas, getLocal, ahora = new Date()) {
  const porLocal = new Map()
  citas
    .filter((c) => !c.esLugar && esIda(c, ahora))
    .sort((a, b) => instante(a) - instante(b))
    .forEach((c) => {
      const lista = porLocal.get(c.localId) ?? []
      porLocal.set(c.localId, [...lista, c])
    })

  const fijos = []
  porLocal.forEach((idas, localId) => {
    if (idas.length < 2) return
    const local = getLocal(localId)
    if (!local || !CATEGORIAS_CONFIANZA.has(local.categoria)) return
    const notas = idas.map((c) => c.opinion?.puntuacion).filter(Boolean)
    const ultimaNota = notas[notas.length - 1]
    if (ultimaNota && ultimaNota <= 3) return
    const ultima = idas[idas.length - 1]
    /* «Lo de siempre»: lo que se hizo la última vez y el local sigue ofreciendo. */
    const ofrece = new Set((local.servicios ?? []).map((s) => s.id))
    const deSiempre = (ultima.servicios ?? []).filter((s) => ofrece.has(s.id))
    fijos.push({ local, veces: idas.length, ultima, deSiempre, idas })
  })
  return fijos.sort((a, b) => instante(b.ultima) - instante(a.ultima))
}

/** Las últimas citas que ya pasaron y no se cancelaron, la más reciente primero. */
export function ultimasCitas(citas, cuantas = 3, ahora = new Date()) {
  return citas
    .filter((c) => esCitaPasada(c, ahora) && c.estadoReserva !== CANCELADA)
    .sort((a, b) => instante(b) - instante(a))
    .slice(0, cuantas)
}
