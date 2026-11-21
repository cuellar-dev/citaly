import { notaDeComentarios } from '../fichaLocal.js'

/* Paso 1 — Nota bayesiana (docs/descubre-implementacion.md, sección 5).

   La nota que VE el usuario no cambia (notaLocal en utils/descubre.js). Esta
   es solo la que ORDENA: tira hacia la media general cuando hay pocas
   opiniones, para que 1 opinión de 5★ no gane a 40 de 4,7. */

const mediaDe = (lista) => (lista.length ? lista.reduce((a, b) => a + b, 0) / lista.length : 0)

function medianaDe(lista) {
  if (!lista.length) return 0
  const orden = [...lista].sort((a, b) => a - b)
  const mitad = Math.floor(orden.length / 2)
  return orden.length % 2 ? orden[mitad] : (orden[mitad - 1] + orden[mitad]) / 2
}

/* Rango mínimo que se considera "toda la escala" al estirar la calidad: si
   todos los locales tienen casi la misma nota, no se amplifican diferencias
   que no existen. */
const RANGO_MINIMO = 0.6

/**
 * m (media de todos los locales con opiniones), C (mediana de opiniones) y
 * `min`/`max`: la nota bayesiana más baja y más alta que hay AHORA. La calidad
 * se mide entre esos dos extremos (ver factorCalidad).
 */
export function estadisticasGlobales(locales) {
  const resumenes = locales.map((l) => notaDeComentarios(l))
  const conOpiniones = resumenes.filter((r) => r.cantidad > 0)
  const m = mediaDe(conOpiniones.map((r) => Number(r.nota))) || 4
  const C = medianaDe(resumenes.map((r) => r.cantidad)) || 3
  const notas = locales.map((l) => notaRanking(l, { m, C }))
  let min = notas.length ? Math.min(...notas) : m - 0.5
  let max = notas.length ? Math.max(...notas) : m + 0.5
  if (max - min < RANGO_MINIMO) {
    const centro = (min + max) / 2
    min = centro - RANGO_MINIMO / 2
    max = centro + RANGO_MINIMO / 2
  }
  return { m, C, min, max }
}

export function notaRanking(local, { m, C }) {
  const { nota, cantidad: n } = notaDeComentarios(local)
  const media = n ? Number(nota) : m
  return (C * m + n * media) / (C + n)
}

/* Clientes que repiten: la señal de calidad más fuerte (nadie vuelve dos veces
   a un sitio malo). Necesita las citas de TODOS los usuarios, así que la da el
   backend (`repetidores`). Mientras no exista, vale 0 y no suma nada. */
const K_REPETIDORES = 0.15

/**
 * Calidad de 0 a 1 MEDIDA ENTRE LOS LOCALES QUE HAY: el peor vale 0 y el mejor
 * 1. Antes se medía sobre toda la escala de 1 a 5★, y como casi todos los
 * locales están entre 3,8 y 4,6, 0,15★ de diferencia valían solo 0,04 puntos:
 * menos que el temblor del orden (±0,023 por local), y un 5★ con 3 opiniones
 * podía superar a un 4,6★ con 30 en uno de cada seis días. Estirada entre el
 * peor y el mejor, esa misma diferencia vale unas 4 veces más.
 *
 * Puede pasar un poco de 1 con muchos repetidores.
 */
export function factorCalidad(local, stats) {
  const { min, max } = stats
  const nota = notaRanking(local, stats)
  const base = max > min ? (nota - min) / (max - min) : 0.5
  const repetidores = Number(local.repetidores) || 0
  return Math.max(0, base) + (K_REPETIDORES * Math.log(1 + repetidores)) / 4
}
