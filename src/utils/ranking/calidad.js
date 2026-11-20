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

/** m (media de todos los locales con opiniones) y C (mediana de opiniones). */
export function estadisticasGlobales(locales) {
  const resumenes = locales.map((l) => notaDeComentarios(l))
  const conOpiniones = resumenes.filter((r) => r.cantidad > 0)
  const m = mediaDe(conOpiniones.map((r) => Number(r.nota))) || 4
  const C = medianaDe(resumenes.map((r) => r.cantidad)) || 3
  return { m, C }
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

/** Calidad normalizada a 0-1 (puede pasar un poco de 1 con muchos repetidores). */
export function factorCalidad(local, stats) {
  const base = (notaRanking(local, stats) - 1) / 4
  const repetidores = Number(local.repetidores) || 0
  return base + (K_REPETIDORES * Math.log(1 + repetidores)) / 4
}
