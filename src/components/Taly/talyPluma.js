/* Taly dibujado a pluma: las piezas sueltas del pájaro pequeño.

   Las comparten TalyPosado (el que anda por el header) y TalyPluma (el mismo
   pájaro quieto, para posarlo en otros bordes). Viven aquí para que los dos
   sean literalmente el mismo dibujo. Coordenadas del viewBox "-2 -6 52 58". */

export const TALY_VIEWBOX = '-2 -6 52 58'

export const CUERPO =
  'M27 9 C34 9 38 14 39 20 C42 24 43 30 41 35 C38 40 32 43 27 43 C22 43 16 40 13 35 C11 30 12 24 15 20 C16 14 20 9 27 9 Z'
export const BARRIGA = 'M27 24 C33 24 37 29 37 34 C37 39 32 42 27 42 C22 42 17 39 17 34 C17 29 21 24 27 24 Z'
export const ALA = 'M19 24 C24 23 28 27 28 32 C28 36 25 39 21 38 C17 37 15 32 16 28 C17 26 18 24 19 24 Z'
export const COPETE = 'M20 11 C21 5 23 1 26 0 C27 3 28 6 30 9 C31 4 33 -2 37 -3 C39 1 39 6 38 11 C33 13 25 13 20 11 Z'
export const PICO = 'M39 19 C43 19 46 21 46 22 C46 23 43 25 39 25 Z'
export const PATA_IZQ = 'M22 42 L22 48 M22 48 L19 50 M22 48 L25 50'
export const PATA_DER = 'M32 42 L32 48 M32 48 L29 50 M32 48 L35 50'

/* El copete se salía por la derecha de la cabeza: la base iba de 20 a 38 y
   la cabeza a esa altura solo llega a 35. Más pequeño y corrido a la
   izquierda, nace dentro de la cabeza. */
export const COPETE_AJUSTE = 'translate(-1.5 0) translate(28 12) scale(0.74) translate(-28 -12)'

/* Paleta de Taly (la misma de arte.js). */
export const TALY_COLORES = {
  menta: '#4fd8c4',
  ala: '#2aa795',
  barriga: '#bdf4e8',
  mostaza: '#ffd166',
  tinta: '#0e2e2a',
  crema: '#f2ebdd',
}
