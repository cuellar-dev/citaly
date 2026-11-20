/* Trazo "a pluma" para el plano, del mismo mundo que Taly y el fondo de
   Descubre.

   Las líneas tiemblan un poco, como dibujadas a mano, pero SIEMPRE igual
   para la misma pieza: el temblor sale de una semilla calculada con su id.
   Así no parpadea al repintar ni al arrastrar.

   Se hace con caminos y no con filtros SVG (feTurbulence): los filtros son
   caros en el móvil y, en el editor, se recalcularían en cada movimiento. */

function hash(texto) {
  let h = 2166136261
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Generador con semilla (mulberry32): números entre -1 y 1. */
export function temblor(semilla) {
  let a = hash(String(semilla))
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1
  }
}

const f = (n) => Math.round(n * 100) / 100

/**
 * Rectángulo de esquinas redondeadas con temblor. Coordenadas locales
 * (0,0)–(w,h). `fuerza` en casillas: cuánto puede desviarse el trazo.
 */
export function rectTinta(w, h, r, semilla, fuerza = 0.12) {
  const t = temblor(semilla)
  const j = () => t() * fuerza
  const rr = Math.min(r, w / 2, h / 2)
  /* Cada lado se dibuja como una curva suave con un punto medio que se
     desvía un poco; las esquinas, como cuartos de curva. El final pasa un
     pelín del inicio, como un trazo de verdad que no cierra perfecto. */
  return [
    `M${f(rr + j())} ${f(j())}`,
    `Q${f(w / 2 + j())} ${f(j() * 1.4)} ${f(w - rr + j())} ${f(j())}`,
    `Q${f(w + j())} ${f(j())} ${f(w + j())} ${f(rr + j())}`,
    `Q${f(w + j() * 1.4)} ${f(h / 2 + j())} ${f(w + j())} ${f(h - rr + j())}`,
    `Q${f(w + j())} ${f(h + j())} ${f(w - rr + j())} ${f(h + j())}`,
    `Q${f(w / 2 + j())} ${f(h + j() * 1.4)} ${f(rr + j())} ${f(h + j())}`,
    `Q${f(j())} ${f(h + j())} ${f(j())} ${f(h - rr + j())}`,
    `Q${f(j() * 1.4)} ${f(h / 2 + j())} ${f(j())} ${f(rr + j())}`,
    `Q${f(j())} ${f(j())} ${f(rr + 0.25 + j())} ${f(j())}`,
  ].join(' ')
}

/** Círculo a pluma centrado en (cx, cy): 8 tramos con el radio temblando. */
export function circuloTinta(cx, cy, r, semilla, fuerza = 0.035) {
  const t = temblor(semilla)
  const pasos = 8
  const inicio = t() * Math.PI
  const pts = []
  for (let i = 0; i <= pasos; i++) {
    const a = inicio + (i / pasos) * Math.PI * 2 + (i === pasos ? 0.18 : 0)
    const rad = r * (1 + t() * fuerza)
    pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad])
  }
  /* Curva suave que pasa por los puntos (Catmull-Rom pasado a Bézier). */
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[pts.length - 2]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? pts[1]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`
  }
  return d
}

/** Línea a pluma, ligeramente curvada. */
export function lineaTinta(x1, y1, x2, y2, semilla, fuerza = 0.15) {
  const t = temblor(semilla)
  const mx = (x1 + x2) / 2 + t() * fuerza
  const my = (y1 + y2) / 2 + t() * fuerza
  return `M${f(x1 + t() * fuerza * 0.4)} ${f(y1 + t() * fuerza * 0.4)} Q${f(mx)} ${f(my)} ${f(x2 + t() * fuerza * 0.4)} ${f(y2 + t() * fuerza * 0.4)}`
}

/** Polígono (contorno del local) a pluma: cada lado con una pequeña curva. */
export function poligonoTinta(puntos, semilla, fuerza = 0.18) {
  const t = temblor(semilla)
  let d = `M${f(puntos[0][0])} ${f(puntos[0][1])}`
  for (let i = 1; i <= puntos.length; i++) {
    const [x1, y1] = puntos[i - 1]
    const [x2, y2] = puntos[i % puntos.length]
    d += ` Q${f((x1 + x2) / 2 + t() * fuerza)} ${f((y1 + y2) / 2 + t() * fuerza)} ${f(x2)} ${f(y2)}`
  }
  return `${d} Z`
}
