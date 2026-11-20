import locales from './locales.json'
import { localesDemo, NOMBRES_OPINION, OPINIONES_POR_CATEGORIA } from './localesDemo.js'

/* Opiniones y estrellas variadas para los locales de demo.

   Con los datos originales casi todos tenían 3 o 4 opiniones de 4-5★, así que
   el ranking de Descubre (nota bayesiana, calidad…) no tenía nada que
   distinguir. Aquí cada local recibe un perfil (cuántas opiniones y qué media):
   de 0 a 40 opiniones y de 2,0 a 5,0★, para poder comprobar de verdad que
   1 opinión de 5★ no gana a 30 de 4,6, que un local con mala nota baja, etc.

   Reparto: los 23 perfiles de PERFILES se reparten entre los 69 locales
   (3 locales por perfil) en un orden barajado por el id, siempre el mismo.
   Cada perfil sale 3 veces: así no depende de la categoría.

   Lo que NO se toca:
   - las opiniones con id propio o con respuesta del dueño (p. ej.
     "laura-mendez-1" en Glam Studio, a la que apunta una notificación);
   - las opiniones que ya cuadran con el perfil (4-5★ en un local bien
     valorado): se conservan, con su texto de siempre. */

/* [cuántas opiniones, media objetivo]. */
const PERFILES = [
  [0],
  [1, 5.0],
  [1, 3.0],
  [1, 2.0],
  [2, 4.5],
  [3, 2.7],
  [3, 3.3],
  [4, 3.5],
  [5, 4.2],
  [5, 3.0],
  [6, 4.8],
  [7, 4.0],
  [8, 3.9],
  [9, 2.6],
  [10, 4.4],
  [12, 4.7],
  [14, 3.4],
  [16, 4.1],
  [18, 4.9],
  [22, 4.0],
  [25, 2.9],
  [30, 4.6],
  [40, 4.5],
]

/* Los recién llegados no pueden tener cientos de opiniones: su perfil se fija
   a mano (ver DIAS_DESDE_ALTA en localesDemo.js). */
const NUEVOS = {
  'cuts-kilo-12': [0],
  'bar-la-vega': [0],
  'sala-yaguajay': [1, 4.0],
  'nails-lab': [2, 5.0],
}

const NEUTRAS = [
  'Está bien, sin más.',
  'Cumple, aunque esperaba algo más.',
  'Normal. El precio es razonable.',
  'Bien, pero tardaron un poco en atender.',
]
const NEGATIVAS = [
  'Esperé demasiado y no me dieron explicación.',
  'No era lo que enseñaban las fotos.',
  'El trato no fue bueno, no volvería.',
  'Estaba desordenado y poco limpio.',
  'Mala experiencia, no lo recomiendo.',
]
const POSITIVAS_GENERALES = [
  'Muy recomendable.',
  'Todo perfecto, repetiremos.',
  'Excelente atención de principio a fin.',
]

/* Las mismas caras que ya usaban las opiniones de siempre. */
const FOTOS = [...new Set(locales.flatMap((l) => (l.comentarios ?? []).map((c) => c.imagenPerfil)).filter(Boolean))]

function hash(texto) {
  let h = 2166136261
  for (const c of texto) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

/* id → perfil. Se barajan los ids por su hash y se reparten los perfiles en
   rueda; es siempre el mismo reparto mientras no cambien los ids. */
const PERFIL_DE = (() => {
  const ids = [...locales, ...localesDemo].map((l) => l.id).sort((a, b) => hash(a) - hash(b) || a.localeCompare(b))
  const mapa = new Map(ids.map((id, i) => [id, PERFILES[i % PERFILES.length]]))
  Object.entries(NUEVOS).forEach(([id, perfil]) => mapa.set(id, perfil))
  return mapa
})()

const protegida = (c) => Boolean(c.respuesta) || !/^\d+$/.test(String(c.id))

/* Ratings (1-5) de `k` opiniones nuevas para que la media total se acerque a
   `objetivo`, dada la suma y la cantidad que ya hay fijas. */
function ratingsPara(k, objetivo, sumaFija, nFijas, semilla) {
  const total = nFijas + k
  const salida = []
  let suma = sumaFija
  for (let i = 0; i < k; i++) {
    const quedan = k - i
    const ideal = (objetivo * total - suma) / quedan
    /* Un poco de dispersión: no todas iguales. */
    const ruido = [0, 0, 1, -1][(semilla + i * 7) % 4]
    const r = Math.min(5, Math.max(1, Math.round(ideal + (quedan > 1 ? ruido : 0))))
    salida.push(r)
    suma += r
  }
  return salida
}

function textoPara(categoria, rating, semilla, i) {
  if (rating <= 2) return NEGATIVAS[(semilla + i) % NEGATIVAS.length]
  if (rating === 3) return NEUTRAS[(semilla + i) % NEUTRAS.length]
  const propias = OPINIONES_POR_CATEGORIA[categoria] ?? []
  const todas = [...propias, ...POSITIVAS_GENERALES]
  return todas[(semilla + i) % todas.length]
}

/* Del 19 de noviembre hacia atrás, la más nueva primero. */
function fechaDe(i, semilla) {
  const d = new Date(2026, 10, 19)
  d.setDate(d.getDate() - (i * 4 + ((semilla + i) % 4)))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function conOpinionesVariadas(local) {
  const perfil = PERFIL_DE.get(local.id)
  if (!perfil) return local

  const semilla = hash(local.id)
  const [n, objetivo = 0] = perfil
  const originales = local.comentarios ?? []
  const fijas = originales.filter(protegida)
  const sueltas = originales.filter((c) => !protegida(c))

  /* Con la nota objetivo alta (≥ 4) se conservan las opiniones de 4-5★ que ya
     tenía; si no, se rehacen todas (un texto entusiasta con 2★ no tiene sentido). */
  const conservar = objetivo >= 4 ? sueltas.filter((c) => Number(c.calificacion) >= 4) : []
  const tope = Math.max(n, fijas.length)
  const mantenidas = [...fijas, ...conservar].slice(0, tope)
  const faltan = tope - mantenidas.length

  const sumaFija = mantenidas.reduce((t, c) => t + (Number(c.calificacion) || 0), 0)
  const nuevas = ratingsPara(faltan, objetivo, sumaFija, mantenidas.length, semilla).map((calificacion, i) => ({
    id: `${local.id}-op-${i + 1}`,
    nombre: NOMBRES_OPINION[(semilla + i * 3) % NOMBRES_OPINION.length],
    fecha: '',
    calificacion,
    comentario: textoPara(local.categoria, calificacion, semilla, i),
    imagenPerfil: FOTOS[(semilla + i) % FOTOS.length] ?? null,
  }))

  const comentarios = [...mantenidas, ...nuevas].map((c, i) => ({ ...c, fecha: c.fecha || fechaDe(i, semilla) }))
  return { ...local, comentarios, opiniones: comentarios.length }
}
