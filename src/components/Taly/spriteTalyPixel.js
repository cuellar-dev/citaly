/* =====================================================================
   Taly en pixel art, a lo Clawd (la mascota de Claude Code)
   ---------------------------------------------------------------------
   Plano, sin contorno, pocos colores y píxel gordo: se lee a 30 px.
   Cada letra es UN píxel; la rejilla solo es la forma cómoda de dibujarlo
   a mano (nada de caracteres Unicode). Es el Taly de siempre: pera
   vertical (cabeza estrecha, cuerpo ancho), copete en V de dos plumas
   mostaza, pico triangular, ala de hoja con rayas claras y barriga clara
   abajo a la derecha. Mira a la derecha.

   El dibujo va en capas para animarlo por piezas:
   - CUERPO: todo menos ojo y patas (respira subiendo 1 px);
   - OJO abierto / cerrado (parpadeo y sueño);
   - PATAS: quieto y dos pasos para andar, y recogidas para el salto.
   Paleta de arte.js, sin tocar.
====================================================================== */

export const PALETA_PIXEL = {
  b: '#4FD8C4', // cuerpo
  d: '#2AA795', // ala
  u: '#8FE0D0', // rayas del ala
  l: '#BDF4E8', // barriga
  m: '#FFD166', // copete, pico y patas
  k: '#0E2E2A', // ojo
}

export const ANCHO = 16
export const ALTO = 19

// 16 × 17. El ojo va aparte (col 9, filas 5-6).
export const CUERPO = [
  '......m...m.....', // 0  copete: dos plumas en V
  '......mm.mm.....', // 1
  '.......mmm......', // 2
  '......bbbbb.....', // 3  cabeza estrecha
  '.....bbbbbbb....', // 4
  '.....bbbb.bbmm..', // 5  ojo · pico
  '.....bbbb.bbmmm.', // 6
  '.....bbbbbbbmm..', // 7
  '....bbbbbbbbb...', // 8  se ensancha
  '...bbbbbbbbbbb..', // 9
  '..bbdddbbbblllb.', // 10 ala · barriga
  '.bbdudddbblllllb', // 11
  '.bdddudddbllllb.', // 12
  '.bbddddddbllllb.', // 13
  '..bbbddbbllllb..', // 14
  '...bbbbbblllb...', // 15
  '....bbbbbbbb....', // 16 base redonda
]

export const OJO_ABIERTO = [
  { x: 9, y: 5, c: 'k' },
  { x: 9, y: 6, c: 'k' },
]
// Cerrado: una raya de tinta abajo y el hueco de arriba, cuerpo.
export const OJO_CERRADO = [
  { x: 9, y: 5, c: 'b' },
  { x: 8, y: 6, c: 'k' },
  { x: 9, y: 6, c: 'k' },
]

/* Las patas nacen una fila por dentro del cuerpo (fila 16): así, cuando el
   cuerpo sube 1 px al respirar, se ve la pata y no un hueco. */
const pata = (puntos) => puntos.map(([x, y]) => ({ x, y, c: 'm' }))
export const PATAS = {
  quieto: pata([[5, 16], [5, 17], [5, 18], [6, 18], [9, 16], [9, 17], [9, 18], [10, 18]]),
  pasoA: pata([[5, 16], [5, 17], [5, 18], [6, 18], [9, 16], [10, 17], [11, 17]]),
  pasoB: pata([[5, 16], [6, 17], [7, 17], [9, 16], [9, 17], [9, 18], [10, 18]]),
  recogidas: pata([[5, 16], [6, 17], [9, 16], [10, 17]]),
}

/** Rejilla → rectángulos, juntando píxeles seguidos del mismo color por fila. */
export function rectsDe(filas) {
  const rects = []
  filas.forEach((fila, y) => {
    let x = 0
    while (x < fila.length) {
      const c = fila[x]
      if (c === '.') {
        x++
        continue
      }
      let fin = x
      while (fila[fin + 1] === c) fin++
      rects.push({ x, y, w: fin - x + 1, c })
      x = fin + 1
    }
  })
  return rects
}
