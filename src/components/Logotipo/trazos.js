/* Los trazos del logotipo de Citaly, copiados de brand/logo/generar.mjs
   (la fuente de verdad es ese script: si cambia allí, se cambia aquí).

   Cada letra va por separado para que la portada de Sobre nosotros pueda
   animarlas una a una. `caja` es el trozo de ancho que le toca a cada letra
   (en unidades del viewBox); los trazos se salen un poco de su caja y por eso
   el SVG de cada letra lleva overflow visible. */

export const VIEWBOX = { x: -6, y: -42, ancho: 464, alto: 154 }

/* Alto de la parte de arriba del travesaño de la T, en fracción del alto
   del logotipo. Es donde se posa Taly en la portada. */
export const TOPE_T = (9.5 - VIEWBOX.y) / VIEWBOX.alto

export const LETRAS = [
  {
    id: 'C',
    caja: [-6, 87],
    dx: 0,
    tono: 'tinta',
    trazos: ['M72 24 C60 9 32 8 19 27 C6 46 9 74 25 87 C40 99 62 96 74 81'],
  },
  {
    id: 'I',
    caja: [87, 112],
    dx: 0,
    tono: 'tinta',
    trazos: ['M101 15 C102 41 99 70 101 96'],
    copete: true,
  },
  {
    id: 'T',
    caja: [112, 196],
    dx: 0,
    tono: 'tinta',
    trazos: ['M124 19 C146 15 166 18 189 14', 'M157 18 C155 46 158 72 156 96'],
  },
  {
    id: 'A',
    caja: [196, 296],
    dx: 0,
    tono: 'a',
    trazos: ['M202 97 C214 64 225 37 236 14 C248 41 258 69 271 96', 'M214 67 C227 63 238 65.5 248 64'],
    pico: true,
  },
  {
    id: 'L',
    caja: [296, 362],
    dx: 12,
    tono: 'tinta',
    trazos: ['M293 14 C294 42 291 70 293 94 C309 92 325 96 341 92'],
  },
  {
    id: 'Y',
    caja: [362, 458],
    dx: 12,
    tono: 'y',
    trazos: [
      'M357 15 C366 34 377 48 389 56',
      'M421 13 C407 39 395 52 389 58 C387 70 390 80 388 88',
      'M388 88 C384 94 378 97 369 98',
      'M388 88 C392 94 398 97 407 97',
    ],
  },
]

export const PICO = {
  forma: 'M248 55.5 C262 55 276 58.5 288 64 C276 69 262 72 248 71.5 C251 66 251 60 248 55.5 Z',
  sombra: 'M250 64 L286 64 C276 69 262 71.5 249 71 C251 69 251 66 250 64 Z',
  cera: 'M248 55.5 C251 60 251 66 248 71.5 L251.6 71.3 C255.4 66.4 255.4 60.2 251.6 55.7 Z',
  luz: 'M253 56.3 C264 56 276 59.2 285 63.4',
  contorno: 'M250 71 C262 71.4 275 68.8 287 64.2',
}

export const COPETE = 'M168 92 C156 70 160 52 174 42 C178 58 188 62 192 76 C198 62 206 58 214 56 C214 72 204 84 196 92 Z'

/* Posición de una letra dentro de .logotipo-letras, en %. */
export function cajaLetra(letra) {
  const [x0, x1] = letra.caja
  return {
    left: `${((x0 - VIEWBOX.x) / VIEWBOX.ancho) * 100}%`,
    width: `${((x1 - x0) / VIEWBOX.ancho) * 100}%`,
  }
}
