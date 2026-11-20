/* Paso 2 — Semilla y jitter (docs/descubre-implementacion.md, sección 6).

   Nunca Math.random(): el orden tiene que ser el mismo cada vez que se repinta
   la pantalla, cambiar de un día a otro y ser distinto para cada usuario. */

/** cyrb53: texto → número, siempre el mismo para el mismo texto. */
export function hashTexto(texto) {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < texto.length; i++) {
    const c = texto.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 2654435761)
    h2 = Math.imul(h2 ^ c, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (h2 >>> 0) * 4294967296 + (h1 >>> 0)
}

/** mulberry32: devuelve una función que da números entre 0 y 1, reproducibles. */
export function aleatorioCon(semilla) {
  let a = semilla >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Un número 0-1 propio de cada local (depende de su id, no de su posición). */
export function azarDe(semilla, clave) {
  return aleatorioCon(semilla ^ hashTexto(String(clave)))()
}

/** Empujón pequeño y acotado: ±amplitud/2. Solo desempata a los casi iguales. */
export function jitter(semilla, idLocal, amplitud) {
  return (azarDe(semilla, idLocal) - 0.5) * amplitud
}

/* El "día" de Descubre empieza a las 5:00, no a medianoche: quien mira a las
   23:59 no ve cómo se le reordena todo de golpe. Fecha LOCAL (no UTC). */
export const HORA_CORTE = 5

export function claveDelDia(ahora) {
  const d = new Date(ahora)
  d.setHours(d.getHours() - HORA_CORTE)
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

/** Instante en que empezó el "día" actual de Descubre (hoy a las 5:00, o ayer). */
export function inicioDelDia(ahora) {
  const d = new Date(ahora)
  if (d.getHours() < HORA_CORTE) d.setDate(d.getDate() - 1)
  d.setHours(HORA_CORTE, 0, 0, 0)
  return d
}

/* Cambiar a "semilla por sesión" (sección 19, punto 6) es cambiar lo que se
   mete aquí dentro. */
export function semillaDelDia(idUsuario, ahora) {
  return hashTexto(`${idUsuario}|${claveDelDia(ahora)}`) % 4294967296
}
