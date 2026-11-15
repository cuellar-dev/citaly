/* =====================================================================
   Sprites del pie de página: Taly en la fogata
   ---------------------------------------------------------------------
   Pixel art de verdad: cada letra es UN píxel del lienzo y se pinta con
   un rectángulo en canvas. No se pinta como texto ni con caracteres de
   bloque: las rejillas de abajo son solo la forma cómoda de escribir y
   retocar el dibujo a mano.

   Taly es el mismo personaje de siempre (pera vertical, cabeza estrecha,
   copete en V mostaza, pico triangular, ala de hoja con rayas claras y
   barriga clara abajo a la derecha), dibujado sentado y mirando a la
   derecha, hacia el fuego. Su paleta es la de src/components/Taly/arte.js,
   sin tocar. El filo claro del lado derecho es la luz de la fogata.
====================================================================== */

// Leyenda de Taly (paleta exacta de arte.js)
export const PALETA_TALY = {
  o: '#0E2E2A', // tinta: contorno
  k: '#0E2E2A', // tinta: ojo
  b: '#4FD8C4', // cuerpo
  t: '#2FBDA8', // puntadas y sombra del cuerpo
  d: '#2AA795', // ala
  l: '#BDF4E8', // barriga y filo de luz
  u: '#8FE0D0', // sombra de la barriga y rayas del ala
  m: '#FFD166', // copete, pico y patas
  c: '#F2EBDD', // brillo del ojo
}

// 26 × 29. Sentado: las patas asoman bajo el cuerpo, sobre el tronco.
export const TALY = [
  '..........m....m..........',
  '..........mm..mm..........',
  '...........mmmm...........',
  '..........oommoo..........',
  '.........obbbbbbo.........',
  '........obbbbbbbbo........',
  '........otbbbbbbbo........',
  '.......otbbbbbbkcbooo.....',
  '.......otbbbbbbkkbommo....',
  '.......otbbbbbbbblmmmmo...',
  '.......otbbbbbbbblommo....',
  '......otbbbbbbbbbloo......',
  '.....otbbbbbbbbbbblo......',
  '.....otbbbttbbbbbblo......',
  '....otbbbbbbbbbbbbblo.....',
  '...otbbbbbbbbbbbbbbblo....',
  '...otbbbooooobbbbbbblo....',
  '..otbbooddddoobbbbllllo...',
  '..otbodduuuddobbblllllo...',
  '..otoddddduuudobllllllo...',
  '..otodduuuddddoullllllo...',
  '..otbodddddddoulllllluo...',
  '..otbbooooooouullllluuo...',
  '...otbbbbbbbuulllllluo....',
  '...otttbbbbbuullllluuo....',
  '....ottttttuuuuuuuuo......',
  '......oottttttuuuoo.......',
  '........ooooooooo.........',
  '........mmm..mmm..........',
]

// Mismo dibujo con los ojos cerrados: el ojo pasa a una raya de tinta.
export const TALY_OJOS_CERRADOS = TALY.map((fila, y) => {
  if (y === 7) return fila.slice(0, 15) + 'bb' + fila.slice(17)
  if (y === 8) return fila.slice(0, 15) + 'oo' + fila.slice(17)
  return fila
})

// Dónde está el pico (para que las zetas del sueño salgan de ahí).
export const TALY_PICO = { x: 21, y: 8 }

/* La espada clavada en la hoguera: pomo mostaza, mango teal de Citaly
   envuelto en dos tonos, guarda de acero y hoja que se hunde en las
   brasas. Se dibuja recta y el motor la inclina un poco al pintarla. */
export const PALETA_ESPADA = {
  o: '#0b1716',
  m: '#FFD166', // pomo
  n: '#c99a3a', // pomo en sombra
  P: '#00C2AD', // mango (teal de la marca)
  T: '#077a6f', // mango, vuelta de la cinta en sombra
  g: '#c3cfcc', // guarda
  G: '#6c7b78', // guarda en sombra
  w: '#dfe8e5', // filo de la hoja
  h: '#8a9b97', // hoja en sombra
}

export const ESPADA = [
  '..ooo..',
  '.ommno.',
  '.omnno.',
  '..ooo..',
  '..oPo..',
  '..oTo..',
  '..oPo..',
  '..oTo..',
  '..oPo..',
  'ooooooo',
  'ogggggo',
  'oGGGGGo',
  'ooowooo',
  '..owho.',
  '..owho.',
  '..owho.',
  '..owho.',
  '..owho.',
  '..owho.',
  '..owho.',
  '..owho.',
  '..owho.',
  '..owho.',
  '...wh..',
  '...w...',
]

/* Laptop abierta de frente, con la pantalla hacia la cámara. La pantalla
   (S) se pinta aparte en cada fotograma: ahí va la agenda. */
export const PALETA_LAPTOP = {
  o: '#0b1514',
  f: '#2b3331', // marco de la pantalla
  F: '#3c4644', // marco con luz
  K: '#4d5856', // teclado
  k: '#323b39', // teclado en sombra
}

export const LAPTOP = [
  '.ooooooooooooooo.',
  '.oFFFFFFFFFFFFFo.',
  '.ofSSSSSSSSSSSfo.',
  '.ofSSSSSSSSSSSfo.',
  '.ofSSSSSSSSSSSfo.',
  '.ofSSSSSSSSSSSfo.',
  '.ofSSSSSSSSSSSfo.',
  '.ofSSSSSSSSSSSfo.',
  '.offfffffffffffo.',
  'ooooooooooooooooo',
  'oKKKKKKKKKKKKKKKo',
  '.okkkkkkkkkkkkko.',
  '..ooooooooooooo..',
]
// Hueco de la pantalla dentro del sprite.
export const LAPTOP_PANTALLA = { x: 3, y: 2, ancho: 11, alto: 6 }

// Madera: el tronco donde se sienta Taly y el tocón de la laptop.
export const PALETA_MADERA = {
  o: '#140d08',
  a: '#5a412b', // corteza
  A: '#3b2a1c', // corteza en sombra
  r: '#8a6a45', // anillo del corte
  R: '#a98457', // anillo con luz
  c: '#6e5034', // centro del corte
}

// Tronco tumbado. El corte (anillos) mira a la fogata, a la derecha.
export const TRONCO = [
  '..oooooooooooooooooooooooo..',
  '.oaaaaaAaaaaaaaAaaaaaaaoRRo.',
  'oaaAaaaaaaaaAaaaaaaaAaaoRcRo',
  'oAaaaaAaaaaaaaaaaAaaaaaoRcRo',
  'oAAAAAAAAAAAAAAAAAAAAAAoRRro',
  '.oooooooooooooooooooooooooo.',
]

// Tocón de pie, visto un poco desde arriba.
export const TOCON = [
  '..ooooooooooo..',
  '.oRRRRRRRRRRRo.',
  'orrrcccccccrrro',
  '.oRRRRRRRRRRRo.',
  '.oaaAaaaaAaaao.',
  '.oaAaaaAaaaaAo.',
  '.oAaaaaaaAaaAo.',
  'oAAaAAAAAAaAAAo',
  '.ooooooooooooo.',
]
