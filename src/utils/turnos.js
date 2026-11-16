import { aMinutos } from './fichaLocal.js'

/* Turnos de un local de suscripción (sobre todo gimnasios): el día se parte
   en tandas de la misma duración, desde que abre hasta que cierra, y cada
   socio tiene la suya. Así el dueño sabe cuánta gente va a haber a cada hora
   y puede poner un tope por tanda.

   En el local: turnos = { activo, duracion, cupo, cupos }
     duracion: minutos de cada turno (90 = hora y media)
     cupo:     personas por turno, el mismo para todos
     cupos:    { '07:30': 12 } excepciones por turno (si una hora es más floja)
   En el socio: turno = '07:30' (la hora a la que empieza). */

export const DURACIONES_TURNO = [
  { minutos: 60, label: '1 h' },
  { minutos: 90, label: '1 h 30' },
  { minutos: 120, label: '2 h' },
]

export const CUPO_MIN = 1
export const CUPO_MAX = 99

/* Un último turno más corto solo se ofrece si dura al menos esto. */
const RESTO_MINIMO = 45

/** Los gimnasios usan turnos por defecto; el resto, si el dueño los activa. */
export function turnosDe(local) {
  const propios = local?.turnos ?? {}
  return {
    activo: propios.activo ?? /gimnasio|gym|crossfit/i.test(local?.categoria ?? ''),
    duracion: Number(propios.duracion) || 90,
    cupo: Number(propios.cupo) || 15,
    cupos: { ...(propios.cupos ?? {}) },
  }
}

export function hhmm(minutos) {
  const h = Math.floor(minutos / 60) % 24
  return `${String(h).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`
}

/** "7:30" sin AM/PM. */
function horaSuelta(minutos) {
  const h = Math.floor(minutos / 60) % 24
  return `${h % 12 || 12}:${String(minutos % 60).padStart(2, '0')}`
}

const sufijo = (minutos) => (Math.floor(minutos / 60) % 24 >= 12 ? 'PM' : 'AM')

/** "7:30 – 9:00 AM", o "10:30 AM – 12:00 PM" si cambia de mitad del día. */
export function textoRango(inicio, fin) {
  const a = sufijo(inicio)
  const b = sufijo(fin)
  return a === b ? `${horaSuelta(inicio)} – ${horaSuelta(fin)} ${b}` : `${horaSuelta(inicio)} ${a} – ${horaSuelta(fin)} ${b}`
}

export function textoInicio(inicio) {
  return `${horaSuelta(inicio)} ${sufijo(inicio)}`
}

export function franjaDelDia(minutos) {
  if (minutos < 12 * 60) return 'Mañana'
  if (minutos < 18 * 60) return 'Tarde'
  return 'Noche'
}

/** Los turnos del día, en orden. */
export function listaTurnos(local, config = turnosDe(local)) {
  const apertura = aMinutos(local?.horarioApertura)
  let cierre = aMinutos(local?.horarioCierre)
  if (cierre <= apertura) cierre += 24 * 60
  const lista = []
  for (let inicio = apertura; inicio < cierre; inicio += config.duracion) {
    const fin = Math.min(inicio + config.duracion, cierre)
    const corto = fin - inicio < config.duracion
    if (corto && fin - inicio < RESTO_MINIMO) break
    const id = hhmm(inicio)
    lista.push({
      id,
      inicio,
      fin,
      corto,
      texto: textoRango(inicio, fin),
      franja: franjaDelDia(inicio % 1440),
      cupo: Number(config.cupos[id]) || config.cupo,
    })
  }
  return lista
}

/** Turno al que va un socio. Si su hora ya no existe (cambió la duración),
    el turno que la contiene. */
export function turnoDeSocio(lista, socio) {
  if (!socio?.turno) return null
  const exacto = lista.find((t) => t.id === socio.turno)
  if (exacto) return exacto
  const min = aMinutos(socio.turno)
  return lista.find((t) => min >= t.inicio && min < t.fin) ?? null
}

/** Cuántos socios activos hay en cada turno: { '07:30': 12 }. Las
    solicitudes van aparte: todavía no ocupan sitio. */
export function ocupacionTurnos(lista, socios) {
  const cuenta = Object.fromEntries(lista.map((t) => [t.id, 0]))
  const pedidos = Object.fromEntries(lista.map((t) => [t.id, 0]))
  for (const s of socios) {
    const t = turnoDeSocio(lista, s)
    if (!t) continue
    if (s.estado === 'activo') cuenta[t.id] += 1
    else if (s.estado === 'solicitud') pedidos[t.id] += 1
  }
  return { cuenta, pedidos }
}

/** 'libre' | 'casi' | 'lleno' según lo que queda. */
export function estadoTurno(ocupados, cupo) {
  if (ocupados >= cupo) return 'lleno'
  if (cupo - ocupados <= Math.max(2, Math.ceil(cupo * 0.2))) return 'casi'
  return 'libre'
}
