/* =====================================================================
   Escena del pie: Taly descansa junto a la hoguera, en medio del bosque
   ---------------------------------------------------------------------
   Pixel art pintado en vivo en un <canvas> pequeño (unos 130 píxeles de
   ancho en el móvil y unos 250 en PC) que el navegador agranda con el
   píxel nítido (image-rendering: pixelated). Así pesa unos KB, se ve
   igual de limpio en cualquier pantalla y nada se repite exactamente:
   las hojas, las pavesas y el humo salen al azar.

   Hay dos encuadres: vertical (móvil, el principal) y panorámico (PC). No
   es la misma imagen recortada: el bosque se genera para el tamaño que
   toca, con la fogata, Taly y la laptop siempre en el sitio que deja
   libre el texto del pie.

   Capas, de atrás adelante:
     fondo    cielo de anochecer, luna, pinos lejanos, troncos y suelo
     vivo     niebla, luz del fuego, Taly, laptop, hoguera, humo, pavesas
     frente   los dos árboles que enmarcan, la copa de arriba, arbustos
     aire     hojas que caen y las zetas de Taly cuando se duerme

   El fondo y el frente se pintan una sola vez (y otra si cambia el
   tamaño); cada fotograma solo los copia y dibuja lo vivo encima.

   La paleta es fija, como la de Taly: la escena es siempre de noche, en
   los dos temas de la app. El único color que comparte con el CSS es el
   del suelo (--pie-suelo), que el pie usa para fundir la escena con el
   texto: se lee del CSS para que coincidan siempre.
====================================================================== */

import {
  ESPADA,
  LAPTOP,
  LAPTOP_PANTALLA,
  PALETA_ESPADA,
  PALETA_LAPTOP,
  PALETA_MADERA,
  PALETA_TALY,
  TALY,
  TALY_OJOS_CERRADOS,
  TALY_PICO,
  TOCON,
  TRONCO,
} from './spritesFogata.js'

// ---- paleta de la escena -----------------------------------------------
// Anochecer verde azulado: el teal de Citaly hundido en la noche, con el
// horizonte encendido de un verde raro, como en las tardes de tormenta.
const C = {
  cielo: ['#0f3536', '#133f3e', '#174946', '#1c544e', '#226057', '#2a6d60', '#357b69', '#438a73', '#529679'],
  luna: '#d6e3d6',
  lunaSombra: '#a9bfb3',
  lunaHalo: '#2c6a5f',
  lejos1: '#1f5550',
  lejos2: '#163f3b',
  tronco: '#10302d',
  troncoLuz: '#2a6a61',
  troncoSombra: '#0a2422',
  marco: '#071918',
  marcoLuz: '#2b6c62',
  copa: '#0a2120',
  copaLuz: '#2a675d',
  copaMota: '#123532',
  hierba: '#143528',
  hierbaLuz: '#1e4a3a',
  sueloAlto: '#0f2823',
  tierra: '#2a2119',
  tierraLuz: '#3a2c1f',
  arbusto: '#08191a',
  arbustoLuz: '#15393a',
  piedra: '#3a4542',
  piedraLuz: '#5b6864',
  ceniza: '#1c1916',
  brasa: '#ff7a3a',
  niebla: '#86c4b6',
  humo: '#5d7a74',
  hojas: ['#2aa795', '#1f7d70', '#b8943f', '#8f7233', '#3fbfa9'],
  zeta: '#cfe9e2',
  // pantalla de la laptop
  pantalla: '#06463d',
  pantallaLuz: '#0a5a4f',
  teal: '#00C2AD',
  gris: '#5f8a82',
  mostaza: '#FFD166',
  crema: '#F2EBDD',
}

// Fuego: niveles de calor, de la punta roja al corazón casi blanco.
const FUEGO_COLORES = [
  null, null, null, null,
  '#b23c28', '#cf4d2c', '#e8622f', '#f27a3a',
  '#ff9a45', '#ffb553', '#FFD166', '#ffe7a3', '#fff6d8',
]
const NIVEL_MAX = FUEGO_COLORES.length - 1
const FUEGO_ANCHO = 21
const FUEGO_ALTO = 26

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]

// ---- utilidades --------------------------------------------------------

function azarConSemilla(semilla) {
  let a = semilla >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const cacheRgb = new Map()
function rgb(hex) {
  let v = cacheRgb.get(hex)
  if (!v) {
    const n = parseInt(hex.slice(1), 16)
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    cacheRgb.set(hex, v)
  }
  return v
}

/* Un lienzo de píxeles sueltos: se escribe en un ImageData (rápido) y al
   final se vuelca a un canvas fuera de pantalla. */
function lienzo(W, H) {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')
  const img = ctx.createImageData(W, H)
  const d = img.data
  return {
    c,
    W,
    H,
    set(x, y, col, a = 255) {
      x = Math.round(x)
      y = Math.round(y)
      if (x < 0 || y < 0 || x >= W || y >= H) return
      const i = (y * W + x) * 4
      const [r, g, b] = rgb(col)
      d[i] = r
      d[i + 1] = g
      d[i + 2] = b
      d[i + 3] = a
    },
    lleno(x, y) {
      if (x < 0 || y < 0 || x >= W || y >= H) return false
      return d[(y * W + x) * 4 + 3] > 0
    },
    color(x, y) {
      const i = (y * W + x) * 4
      return [d[i], d[i + 1], d[i + 2]]
    },
    fin() {
      ctx.putImageData(img, 0, 0)
      return c
    },
  }
}

function disco(set, cx, cy, r, col) {
  for (let dy = -r; dy <= r; dy++) {
    const m = Math.floor(Math.sqrt(r * r - dy * dy))
    for (let dx = -m; dx <= m; dx++) set(cx + dx, cy + dy, col)
  }
}

// Ruido suave en una dimensión (valores al azar unidos con coseno).
function ruido1D(azar, paso) {
  const puntos = []
  return (x) => {
    const i = Math.floor(x / paso)
    while (puntos.length <= i + 1) puntos.push(azar())
    const f = x / paso - i
    const s = (1 - Math.cos(f * Math.PI)) / 2
    return puntos[i] * (1 - s) + puntos[i + 1] * s
  }
}

function pintarSprite(ctx, filas, paleta, x, y, voltear = false) {
  const ancho = filas[0].length
  for (let fy = 0; fy < filas.length; fy++) {
    const fila = filas[fy]
    for (let fx = 0; fx < fila.length; fx++) {
      const col = paleta[fila[fx]]
      if (!col) continue
      ctx.fillStyle = col
      ctx.fillRect(x + (voltear ? ancho - 1 - fx : fx), y + fy, 1, 1)
    }
  }
}

// ---- composición -------------------------------------------------------

/* Dónde va cada cosa según el tamaño. Las proporciones verticales van de
   la mano del CSS del pie (pie.css): el texto empieza por debajo de la
   fogata, así que la fogata nunca queda tapada. */
function componer(W, H, ancho) {
  const pc = ancho >= 900
  const suelo = Math.round(H * (pc ? 0.47 : 0.4))
  const base = Math.round(H * (pc ? 0.585 : 0.535))
  const centro = Math.round(W * 0.5)
  return {
    pc,
    W,
    H,
    suelo, // línea del horizonte del claro (donde acaba el bosque)
    base, // donde apoya la hoguera
    centro,
    taly: { x: centro - 41, y: base - 3 - TALY.length },
    tronco: { x: centro - 44, y: base - 4 },
    tocon: { x: centro + 17, y: base - 8 },
    laptop: { x: centro + 16, y: base - 8 - LAPTOP.length + 1 },
  }
}

// ---- capa de fondo -----------------------------------------------------

function pintarFondo(L, azar) {
  const { W, H, suelo, base, centro, pc } = L
  const p = lienzo(W, H)

  // Cielo con tramado ordenado entre bandas: el degradado de pixel art.
  const bandas = C.cielo.length - 1
  for (let y = 0; y < suelo + 4; y++) {
    const t = Math.min(1, y / (suelo - 2)) * bandas
    const i = Math.floor(t)
    const f = t - i
    for (let x = 0; x < W; x++) {
      const umbral = BAYER[(y % 4) * 4 + (x % 4)] / 16
      p.set(x, y, C.cielo[Math.min(bandas, f > umbral ? i + 1 : i)])
    }
  }

  // Luna grande y apagada, medio escondida tras la copa.
  const luna = { x: Math.round(W * (pc ? 0.7 : 0.72)), y: Math.round(H * (pc ? 0.2 : 0.12)), r: pc ? 8 : 7 }
  for (let dy = -luna.r - 4; dy <= luna.r + 4; dy++) {
    for (let dx = -luna.r - 4; dx <= luna.r + 4; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy)
      const x = luna.x + dx
      const y = luna.y + dy
      if (d <= luna.r) {
        const sombra = dx + dy * 0.4 < -luna.r * 0.35
        p.set(x, y, sombra ? C.lunaSombra : C.luna)
      } else if (d <= luna.r + 4 && BAYER[((y + 400) % 4) * 4 + ((x + 400) % 4)] < (luna.r + 4 - d) * 4) {
        p.set(x, y, C.lunaHalo)
      }
    }
  }
  // Un par de cráteres para que no sea un círculo plano.
  p.set(luna.x + 2, luna.y - 2, C.lunaSombra)
  p.set(luna.x + 3, luna.y - 2, C.lunaSombra)
  p.set(luna.x - 1, luna.y + 3, C.lunaSombra)

  // Pinos lejanos: dos filas de siluetas dentadas.
  const pinos = (color, alturaMin, alturaMax, separacion, desfase) => {
    for (let x0 = -6 + desfase; x0 < W + 6; x0 += separacion + Math.floor(azar() * separacion)) {
      const alto = alturaMin + Math.floor(azar() * (alturaMax - alturaMin))
      const cima = suelo - alto
      for (let y = cima; y <= suelo + 2; y++) {
        const prof = y - cima
        let medio = Math.floor(prof / 2.2) + 1
        if (prof % 5 === 4) medio -= 1 // dientes de las ramas
        for (let dx = -medio; dx <= medio; dx++) p.set(x0 + dx, y, color)
      }
    }
  }
  const escala = pc ? 1 : 0.8
  pinos(C.lejos1, Math.round(26 * escala), Math.round(44 * escala), 6, 0)
  pinos(C.lejos2, Math.round(14 * escala), Math.round(28 * escala), 5, 3)

  // Troncos del bosque medio, con algunas horquetas que suben a la copa.
  const cuantos = Math.round(W / (pc ? 16 : 21))
  for (let n = 0; n < cuantos; n++) {
    const x0 = Math.round(((n + 0.2 + azar() * 0.6) / cuantos) * W)
    // Junto a la fogata se aclara el bosque, para que se lea el grupo.
    if (Math.abs(x0 - centro) < 30 && azar() < 0.7) continue
    // Ningún tronco tapa la luna: cortada en vertical parece un error.
    if (Math.abs(x0 - luna.x) < luna.r + 7) continue
    const ancho = 3 + Math.floor(azar() * (pc ? 6 : 3))
    const pie = suelo + 1 + Math.floor(azar() * 4)
    const curva = (azar() - 0.5) * 6
    for (let y = -2; y <= pie; y++) {
      const t = y / pie
      const x = Math.round(x0 + Math.sin(t * Math.PI) * curva)
      const extra = y > pie - 3 ? pie - y === 0 ? 2 : 1 : 0 // raíces
      for (let dx = -extra; dx < ancho + extra; dx++) {
        const col = dx <= 0 ? C.troncoLuz : dx >= ancho - 1 ? C.troncoSombra : C.tronco
        p.set(x + dx, y, col)
      }
    }
    // Horqueta: una rama que sale en diagonal hacia arriba.
    if (azar() < 0.65) {
      const desde = Math.round(H * (0.06 + azar() * 0.12))
      const lado = azar() < 0.5 ? -1 : 1
      const largo = 8 + Math.floor(azar() * 10)
      for (let i = 0; i < largo; i++) {
        const gx = x0 + Math.round(ancho / 2) + lado * i
        const gy = desde - Math.round(i * 1.3)
        for (let g = 0; g < 2; g++) p.set(gx, gy + g, i < 2 ? C.tronco : C.troncoSombra)
        p.set(gx - lado, gy, C.troncoLuz)
      }
    }
  }

  // Suelo: hierba oscura que baja hacia el color del pie.
  const sueloCss = L.colorSuelo
  for (let y = suelo; y < H; y++) {
    const t = (y - suelo) / Math.max(1, H - suelo)
    for (let x = 0; x < W; x++) {
      const umbral = BAYER[(y % 4) * 4 + (x % 4)] / 16
      p.set(x, y, t * 1.6 > umbral ? sueloCss : C.sueloAlto)
    }
  }
  // Briznas de hierba: el borde del claro se dibuja con mechones.
  for (let x = 0; x < W; x++) {
    if (azar() < 0.55) {
      const alto = 1 + Math.floor(azar() * 3)
      for (let i = 0; i < alto; i++) p.set(x, suelo - i, i === alto - 1 ? C.hierbaLuz : C.hierba)
    }
  }
  for (let i = 0; i < W * 1.4; i++) {
    const x = Math.floor(azar() * W)
    const y = suelo + 2 + Math.floor(azar() * (H - suelo) * 0.5)
    p.set(x, y, C.hierba)
    if (azar() < 0.4) p.set(x, y - 1, C.hierbaLuz)
  }

  // El claro de tierra alrededor de la hoguera.
  const rx = pc ? 40 : 30
  const ry = pc ? 8 : 7
  for (let dy = -ry; dy <= ry; dy++) {
    for (let dx = -rx; dx <= rx; dx++) {
      const d = (dx / rx) ** 2 + (dy / ry) ** 2
      const x = centro + dx
      const y = base + 1 + dy
      const umbral = BAYER[((y + 64) % 4) * 4 + ((x + 64) % 4)] / 16
      if (d < 0.55) p.set(x, y, d < 0.25 && umbral > 0.5 ? C.tierraLuz : C.tierra)
      else if (d < 1 && umbral > (d - 0.55) / 0.45) p.set(x, y, C.tierra)
    }
  }

  return p.fin()
}

// ---- capa de delante ---------------------------------------------------

function pintarFrente(L, azar) {
  const { W, H, suelo, base, pc } = L
  const p = lienzo(W, H)

  // Copa de arriba: arco de hojas que baja por los lados, borde dentado.
  const onda = ruido1D(azar, pc ? 14 : 9)
  const bordeCopa = []
  for (let x = 0; x < W; x++) {
    const lado = Math.abs(x / W - 0.5) * 2 // 0 en el centro, 1 en los lados
    const hondo = H * (pc ? 0.05 : 0.045) + lado ** 2.4 * H * (pc ? 0.3 : 0.22) + onda(x) * (pc ? 9 : 6)
    const diente = (x % 4 < 2 ? x % 4 : 4 - (x % 4)) * (pc ? 1.5 : 1)
    bordeCopa[x] = Math.round(hondo + diente)
    for (let y = 0; y <= bordeCopa[x]; y++) p.set(x, y, C.copa)
  }
  // Textura de hojas dentro de la copa: matas algo más claras, para que no
  // sea una mancha plana.
  for (let i = 0; i < W * (pc ? 1.6 : 1.2); i++) {
    const x = Math.floor(azar() * W)
    const y = Math.floor(azar() * (bordeCopa[x] - 2))
    if (y < 1) continue
    const ancho = 2 + Math.floor(azar() * 4)
    for (let dx = 0; dx < ancho; dx++) {
      if (y < bordeCopa[x + dx] - 1) p.set(x + dx, y, C.copaMota)
      if (dx > 0 && dx < ancho - 1 && y + 1 < bordeCopa[x + dx] - 1) p.set(x + dx, y + 1, C.copaMota)
    }
    if (azar() < 0.25) p.set(x + 1, y - 1, C.copaLuz)
  }
  // Filo de luz en la parte baja de la copa (la luna por detrás).
  for (let x = 0; x < W; x++) {
    const y = bordeCopa[x]
    p.set(x, y, C.copaLuz)
    if (azar() < 0.3) p.set(x, y - 1, C.copaLuz)
  }
  // Huecos en la copa: se cuela el cielo, como en un bosque de verdad.
  for (let i = 0; i < (pc ? 16 : 8); i++) {
    const hx = Math.floor(azar() * W)
    const hy = Math.floor(azar() * bordeCopa[hx] * 0.7)
    const hr = 1 + Math.floor(azar() * 2)
    for (let dy = -hr; dy <= hr; dy++) {
      for (let dx = -hr - 1; dx <= hr + 1; dx++) {
        if (dx * dx * 0.6 + dy * dy <= hr * hr) {
          const x = hx + dx
          const y = hy + dy
          if (x >= 0 && x < W && y >= 0 && y < bordeCopa[x] - 2) p.set(x, y, C.copa, 0)
        }
      }
    }
  }

  // Árboles que enmarcan: troncos gruesos en los lados que se curvan hacia
  // dentro y sostienen la copa.
  const arbol = (desdeX, haciaX, grosor, lado) => {
    const pasos = 260
    const x0 = desdeX
    const y0 = base + (pc ? 26 : 30)
    const x1 = desdeX + lado * grosor * 0.4
    const y1 = H * 0.3
    const x2 = haciaX
    const y2 = -6
    for (let i = 0; i <= pasos; i++) {
      const t = i / pasos
      const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * x1 + t * t * x2
      const y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * y1 + t * t * y2
      const r = Math.max(2, Math.round(grosor * (1 - t * 0.55)))
      disco((px, py) => p.set(px, py, C.marco), Math.round(x), Math.round(y), r)
    }
    // Rama baja que sale hacia el claro.
    const ramaY = Math.round(H * (pc ? 0.26 : 0.24))
    const ramaX = Math.round(x0 + lado * grosor * 0.5)
    for (let i = 0; i < (pc ? 34 : 18); i++) {
      const rx = ramaX - lado * i
      const ry = ramaY - Math.round(Math.sin((i / 30) * Math.PI * 0.8) * 8)
      const r = Math.max(1, Math.round(3 - i / 10))
      disco((px, py) => p.set(px, py, C.marco), rx, ry, r)
    }
  }
  if (pc) {
    arbol(Math.round(W * 0.03), Math.round(W * 0.2), 13, -1)
    arbol(Math.round(W * 0.97), Math.round(W * 0.8), 15, 1)
  } else {
    arbol(-4, Math.round(W * 0.24), 7, -1)
    arbol(W + 3, Math.round(W * 0.78), 8, 1)
  }
  // Filo de luz en el lado de dentro de los troncos.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!p.lleno(x, y)) continue
      const [r] = p.color(x, y)
      if (r !== rgb(C.marco)[0]) continue
      const izq = x < W / 2
      const fuera = izq ? !p.lleno(x + 1, y) : !p.lleno(x - 1, y)
      if (fuera && y > 4) p.set(x, y, C.marcoLuz)
    }
  }

  // Arbustos a los lados del claro, con el borde redondeado y dentado.
  const arbusto = (cx, ancho, alto, y0) => {
    const forma = ruido1D(azar, 5)
    for (let dx = -ancho; dx <= ancho; dx++) {
      const t = dx / ancho
      const cima = Math.round(y0 - Math.sqrt(Math.max(0, 1 - t * t)) * alto - forma(dx + ancho) * 4 + (dx % 3 === 0 ? 1 : 0))
      for (let y = cima; y < H; y++) p.set(cx + dx, y, y === cima ? C.arbustoLuz : C.arbusto)
      if (azar() < 0.35) p.set(cx + dx, cima + 1, C.arbustoLuz)
    }
  }
  if (pc) {
    arbusto(Math.round(W * 0.06), 34, 12, base + 10)
    arbusto(Math.round(W * 0.22), 18, 7, base + 16)
    arbusto(Math.round(W * 0.95), 38, 14, base + 8)
    arbusto(Math.round(W * 0.78), 16, 6, base + 18)
  } else {
    arbusto(4, 18, 8, base + 14)
    arbusto(W - 4, 20, 9, base + 12)
  }
  // Sombras de los árboles lejanos sobre el claro no hacen falta: el pie
  // funde el suelo con el texto desde CSS.
  void suelo

  return { lienzo: p.fin(), bordeCopa }
}

// Bandas de niebla: manchas de baja opacidad en tres niveles (pixel art).
function pintarNiebla(W, alto, azar) {
  const ancho = W * 2
  const p = lienzo(ancho, alto)
  const manchas = Math.round(ancho / 7)
  const densidad = new Float32Array(ancho * alto)
  for (let i = 0; i < manchas; i++) {
    const cx = azar() * ancho
    const cy = alto * (0.3 + azar() * 0.4)
    const rx = 6 + azar() * 14
    const ry = 2 + azar() * (alto * 0.3)
    for (let y = 0; y < alto; y++) {
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
        if (d < 1) {
          const xx = (x + ancho) % ancho // se repite sin costura
          densidad[y * ancho + xx] += (1 - d) * 0.8
        }
      }
    }
  }
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const v = densidad[y * ancho + x]
      const umbral = BAYER[(y % 4) * 4 + (x % 4)] / 16
      if (v > 1.1) p.set(x, y, C.niebla, 70)
      else if (v > 0.55 + umbral * 0.4) p.set(x, y, C.niebla, 42)
      else if (v > 0.2 + umbral * 0.5) p.set(x, y, C.niebla, 20)
    }
  }
  return p.fin()
}

// ---- la escena ---------------------------------------------------------

export function crearEscena(canvas, { alEncender, reducido = false } = {}) {
  const ctx = canvas.getContext('2d')
  const contenedor = canvas.parentElement

  let L = null
  let fondo = null
  let frente = null
  let bordeCopa = []
  let nieblas = []

  // Estado vivo
  const fuego = new Uint8Array(FUEGO_ANCHO * FUEGO_ALTO)
  let intensidad = reducido ? 1 : 0.18
  let encendiendo = false
  let encendida = reducido
  let reloj = 0
  let acumFuego = 0
  const pavesas = []
  const humo = []
  const hojas = []
  const zetas = []
  let siguienteHoja = 0.6
  let siguienteHumo = 0
  const taly = {
    estado: 'despierto',
    hasta: 9 + Math.random() * 6,
    parpadeo: 2.5,
    salto: 0,
    siguienteZeta: 0,
  }

  function medir() {
    const ancho = contenedor.clientWidth
    const alto = contenedor.clientHeight
    if (!ancho || !alto) return false
    const pc = ancho >= 900
    const objetivo = pc ? 250 : 130
    const escala = Math.max(2, Math.round(ancho / objetivo))
    const W = Math.ceil(ancho / escala)
    const H = Math.ceil(alto / escala)
    if (L && L.W === W && L.H === H) return false
    canvas.width = W
    canvas.height = H
    canvas.style.width = `${W * escala}px`
    canvas.style.height = `${H * escala}px`
    L = componer(W, H, ancho)
    L.colorSuelo = getComputedStyle(contenedor).getPropertyValue('--pie-suelo').trim() || '#0b1e1a'
    const azar = azarConSemilla(1987 + W * 7 + H)
    fondo = pintarFondo(L, azar)
    const f = pintarFrente(L, azar)
    frente = f.lienzo
    bordeCopa = f.bordeCopa
    nieblas = [
      { lienzo: pintarNiebla(W, 18, azar), y: L.suelo - 14, vel: 2.2, alfa: 0.5 },
      { lienzo: pintarNiebla(W, 14, azar), y: L.suelo + 3, vel: -3.4, alfa: 0.4 },
    ]
    return true
  }

  // ---- fuego (algoritmo clásico de propagación de calor) ----

  function pasoFuego() {
    const medio = (FUEGO_ANCHO - 1) / 2
    const fila = (FUEGO_ALTO - 1) * FUEGO_ANCHO
    for (let x = 0; x < FUEGO_ANCHO; x++) {
      const perfil = Math.cos(((x - medio) / (medio + 1)) * (Math.PI / 2)) ** 1.3
      const v = NIVEL_MAX * intensidad * perfil - Math.random() * 2.2
      fuego[fila + x] = Math.max(0, Math.round(v))
    }
    for (let x = 0; x < FUEGO_ANCHO; x++) {
      for (let y = 1; y < FUEGO_ALTO; y++) {
        const i = y * FUEGO_ANCHO + x
        const calor = fuego[i]
        if (calor === 0) {
          fuego[i - FUEGO_ANCHO] = 0
          continue
        }
        const azarLado = Math.random()
        const dx = azarLado < 0.62 ? x : azarLado < 0.86 ? x - 1 : x + 1
        if (dx < 0 || dx >= FUEGO_ANCHO) continue
        const borde = Math.abs(dx - medio) / medio
        const caida = (Math.random() < 0.37 + borde * 0.34 ? 1 : 0) + (borde > 0.75 && Math.random() < 0.6 ? 1 : 0)
        fuego[(y - 1) * FUEGO_ANCHO + dx] = Math.max(0, calor - caida)
      }
    }
  }

  // ---- partículas ----

  function nacerPavesa() {
    if (pavesas.length > 36) return
    const fx0 = L.centro - Math.floor(FUEGO_ANCHO / 2)
    const x = 4 + Math.floor(Math.random() * (FUEGO_ANCHO - 8))
    let y = 0
    while (y < FUEGO_ALTO && fuego[y * FUEGO_ANCHO + x] < 3) y++
    if (y >= FUEGO_ALTO - 2) return
    pavesas.push({
      x: fx0 + x,
      y: L.base - FUEGO_ALTO + y,
      vx: (Math.random() - 0.4) * 3,
      vy: -(9 + Math.random() * 9),
      fase: Math.random() * 6,
      vida: 0,
      dura: 1 + Math.random() * 1.6,
    })
  }

  function nacerHoja() {
    if (hojas.length > 16) return
    const x = Math.random() * L.W
    const tope = bordeCopa[Math.floor(x)] || 10
    const cerca = Math.random() < 0.3 // las de delante, más grandes
    hojas.push({
      x,
      y: Math.random() * tope,
      vx: 1.5 + Math.random() * 2.5,
      vy: 5 + Math.random() * 5,
      fase: Math.random() * 6,
      giro: 2 + Math.random() * 3,
      col: C.hojas[Math.floor(Math.random() * C.hojas.length)],
      cerca,
      posa: Math.random() < 0.5 ? L.suelo + 2 + Math.random() * (L.base + 14 - L.suelo) : Infinity,
      posada: 0,
    })
  }

  function nacerHumo() {
    if (humo.length > 26) return
    humo.push({
      x: L.centro - 2 + Math.random() * 5,
      y: L.base - 18 - Math.random() * 4,
      vx: 1 + Math.random() * 1.6,
      vy: -(3.5 + Math.random() * 2.5),
      vida: 0,
      dura: 3.5 + Math.random() * 2,
      fase: Math.random() * 6,
    })
  }

  // ---- Taly ----

  function pasoTaly(dt) {
    taly.hasta -= dt
    if (taly.estado === 'despierto') {
      taly.parpadeo -= dt
      if (taly.parpadeo < -0.13) taly.parpadeo = 2.2 + Math.random() * 3.5
      if (taly.hasta <= 0) {
        taly.estado = 'dormido'
        taly.hasta = 6 + Math.random() * 4
        taly.siguienteZeta = 0.8
      }
    } else if (taly.estado === 'dormido') {
      taly.siguienteZeta -= dt
      if (taly.siguienteZeta <= 0) {
        taly.siguienteZeta = 1.3
        const { x, y } = L.taly
        zetas.push({ x: x + TALY_PICO.x + 1, y: y + TALY_PICO.y - 4, vida: 0, grande: zetas.length % 2 === 0 })
      }
      if (taly.hasta <= 0) {
        // Se despierta de golpe: un saltito, como quien da una cabezada.
        taly.estado = 'despierto'
        taly.hasta = 10 + Math.random() * 8
        taly.salto = 0.32
        taly.parpadeo = 1.6
      }
    }
    taly.salto = Math.max(0, taly.salto - dt)
  }

  // ---- pintado ----

  /* El fuego entero, o solo su corazón (lo más caliente de abajo) para
     pintarlo otra vez por encima de la hoja de la espada: así las llamas
     la lamen sin taparle la empuñadura. */
  function pintarFuego(soloNucleo = false) {
    const x0 = L.centro - Math.floor(FUEGO_ANCHO / 2)
    const y0 = L.base - FUEGO_ALTO
    const desde = soloNucleo ? FUEGO_ALTO - 11 : 0
    for (let y = desde; y < FUEGO_ALTO; y++) {
      for (let x = 0; x < FUEGO_ANCHO; x++) {
        const nivel = fuego[y * FUEGO_ANCHO + x]
        if (soloNucleo && nivel < 9) continue
        const col = FUEGO_COLORES[nivel]
        if (!col) continue
        ctx.fillStyle = col
        ctx.fillRect(x0 + x, y0 + y, 1, 1)
      }
    }
  }

  function pintarLecho() {
    const { centro: cx, base } = L
    // Ceniza bajo el fuego
    ctx.fillStyle = C.ceniza
    ctx.fillRect(cx - 10, base - 1, 21, 2)
    // Dos leños cruzados con las puntas en brasa.
    const lenos = [
      [cx - 11, base + 1, cx + 7, base - 4],
      [cx + 11, base + 1, cx - 7, base - 4],
    ]
    for (const [ax, ay, bx, by] of lenos) {
      const pasos = Math.abs(bx - ax)
      for (let i = 0; i <= pasos; i++) {
        const x = Math.round(ax + ((bx - ax) * i) / pasos)
        const y = Math.round(ay + ((by - ay) * i) / pasos)
        ctx.fillStyle = PALETA_MADERA.A
        ctx.fillRect(x, y, 1, 2)
        ctx.fillStyle = PALETA_MADERA.a
        ctx.fillRect(x, y, 1, 1)
      }
      ctx.fillStyle = Math.random() < 0.5 ? C.brasa : FUEGO_COLORES[9]
      ctx.fillRect(ax, ay, 1, 1)
    }
    // Piedras alrededor, por delante.
    const piedras = [-12, -8, -4, 0, 4, 8, 12]
    piedras.forEach((dx, i) => {
      const x = cx + dx - 1
      const y = base + 1 + (Math.abs(dx) < 6 ? 1 : 0)
      ctx.fillStyle = C.piedra
      ctx.fillRect(x, y, 3, 2)
      ctx.fillStyle = C.piedraLuz
      ctx.fillRect(x + (i % 2), y, 2, 1)
    })
  }

  function pintarEspada() {
    // La punta se hunde en las brasas; la empuñadura queda sobre las llamas.
    const x = L.centro - 3
    const y = L.base - ESPADA.length + 1
    // Se inclina un pelo: la parte de arriba va un píxel a la derecha.
    for (let fy = 0; fy < ESPADA.length; fy++) {
      const fila = ESPADA[fy]
      const desvio = fy < 11 ? 1 : 0
      for (let fx = 0; fx < fila.length; fx++) {
        const col = PALETA_ESPADA[fila[fx]]
        if (!col) continue
        ctx.fillStyle = col
        ctx.fillRect(x + fx + desvio, y + fy, 1, 1)
      }
    }
  }

  function pintarPantalla() {
    const { x, y } = L.laptop
    const px = x + LAPTOP_PANTALLA.x
    const py = y + LAPTOP_PANTALLA.y
    const { ancho, alto } = LAPTOP_PANTALLA
    ctx.fillStyle = C.pantalla
    ctx.fillRect(px, py, ancho, alto)
    // Cabecera teal de la app.
    ctx.fillStyle = C.teal
    ctx.fillRect(px, py, ancho, 1)
    ctx.fillStyle = C.crema
    ctx.fillRect(px + 1, py, 2, 1)
    // La agenda: tres citas que entran, quedan pendientes (mostaza) y se
    // confirman (teal). Al terminar la vuelta se limpia y empieza otra.
    const ciclo = reloj % 7
    for (let i = 0; i < 3; i++) {
      const entra = 0.4 + i * 0.9
      if (ciclo < entra || ciclo > 6.3) continue
      const fy = py + 2 + i
      const largo = [6, 4, 5][i]
      ctx.fillStyle = C.gris
      ctx.fillRect(px + 1, fy, largo, 1)
      ctx.fillStyle = ciclo > entra + 1.5 ? C.teal : C.mostaza
      ctx.fillRect(px + ancho - 2, fy, 1, 1)
    }
    // Cursor que parpadea en la última línea.
    if (Math.floor(reloj * 2) % 2 === 0 && ciclo <= 6.3) {
      ctx.fillStyle = C.crema
      ctx.fillRect(px + 1, py + alto - 1, 1, 1)
    }
  }

  // Disco de píxeles (sin suavizado) para las luces.
  function discoPx(cx, cy, r, aplastado = 1) {
    for (let dy = -r; dy <= r; dy++) {
      const m = Math.floor(Math.sqrt(r * r - dy * dy))
      ctx.fillRect(cx - m, Math.round(cy + dy * aplastado), m * 2 + 1, 1)
    }
  }

  function pintarLuz() {
    const { centro: cx, base } = L
    const parpadeo = Math.sin(reloj * 9) * 0.6 + Math.sin(reloj * 23) * 0.4
    const r = Math.round((L.pc ? 46 : 44) * (0.55 + intensidad * 0.45) + parpadeo * 1.5)
    ctx.globalCompositeOperation = 'lighter'
    ctx.fillStyle = `rgba(255, 140, 60, ${0.035 * intensidad})`
    for (let i = 0; i < 5; i++) discoPx(cx, base - 8, Math.round(r * (1 - i * 0.18)))
    // Resplandor teal de la pantalla de la laptop sobre el suelo.
    ctx.fillStyle = 'rgba(0, 194, 173, 0.05)'
    const lx = L.laptop.x + 8
    discoPx(lx, L.base - 4, 9, 0.5)
    discoPx(lx, L.base - 4, 6, 0.5)
    ctx.globalCompositeOperation = 'source-over'
  }

  function pintarSombras() {
    ctx.fillStyle = 'rgba(2, 10, 9, 0.45)'
    // Sombras hacia fuera de la fogata: Taly a la izquierda, laptop a la derecha.
    for (let i = 0; i < 2; i++) {
      ctx.fillRect(L.tronco.x - 6 + i * 2, L.base + 1 + i, 24 - i * 4, 1)
      ctx.fillRect(L.tocon.x + 4 + i * 2, L.base + 1 + i, 16 - i * 4, 1)
    }
  }

  function pintar() {
    if (!L) return
    const { W, H } = L
    ctx.clearRect(0, 0, W, H)
    ctx.drawImage(fondo, 0, 0)

    // Niebla de atrás, entre los troncos.
    const [n1, n2] = nieblas
    const desliza = (n, alfa) => {
      const ancho = n.lienzo.width
      const off = ((((reloj * n.vel) % ancho) + ancho) % ancho) | 0
      ctx.globalAlpha = alfa
      ctx.drawImage(n.lienzo, -off, n.y)
      ctx.drawImage(n.lienzo, ancho - off, n.y)
      ctx.globalAlpha = 1
    }
    desliza(n1, n1.alfa)

    pintarLuz()
    pintarSombras()

    // Asientos: tronco de Taly y tocón de la laptop.
    pintarSprite(ctx, TRONCO, PALETA_MADERA, L.tronco.x, L.tronco.y)
    pintarSprite(ctx, TOCON, PALETA_MADERA, L.tocon.x, L.tocon.y)
    pintarSprite(ctx, LAPTOP, PALETA_LAPTOP, L.laptop.x, L.laptop.y)
    pintarPantalla()

    // Hoguera: fuego, espada delante, el corazón del fuego sobre la hoja,
    // y los leños y las piedras.
    pintarFuego()
    pintarEspada()
    pintarFuego(true)
    pintarLecho()

    // Taly, con su respiración (sube un píxel al tomar aire).
    const ritmo = taly.estado === 'dormido' ? 3.4 : 2.4
    const respira = Math.sin((reloj / ritmo) * Math.PI * 2) > 0.35 ? -1 : 0
    const salta = taly.salto > 0 ? (taly.salto > 0.16 ? -2 : -1) : 0
    const ojosCerrados = taly.estado === 'dormido' || (taly.estado === 'despierto' && taly.parpadeo < 0)
    pintarSprite(ctx, ojosCerrados ? TALY_OJOS_CERRADOS : TALY, PALETA_TALY, L.taly.x, L.taly.y + respira + salta)

    // Humo
    for (const h of humo) {
      const t = h.vida / h.dura
      const lado = t < 0.3 ? 1 : t < 0.7 ? 2 : 3
      ctx.globalAlpha = 0.22 * (1 - t)
      ctx.fillStyle = C.humo
      ctx.fillRect(Math.round(h.x), Math.round(h.y), lado, lado)
    }
    ctx.globalAlpha = 1

    // Pavesas
    for (const p of pavesas) {
      const t = p.vida / p.dura
      ctx.fillStyle = t < 0.3 ? FUEGO_COLORES[11] : t < 0.6 ? FUEGO_COLORES[9] : t < 0.85 ? FUEGO_COLORES[7] : FUEGO_COLORES[4]
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1)
    }

    desliza(n2, n2.alfa)
    ctx.drawImage(frente, 0, 0)

    // Hojas cayendo (por delante de todo).
    for (const h of hojas) {
      const x = Math.round(h.x)
      const y = Math.round(h.y)
      const f = h.posada > 0 ? 0 : Math.floor(reloj * h.giro + h.fase) % 4
      ctx.globalAlpha = h.posada > 2.6 ? Math.max(0, 1 - (h.posada - 2.6) / 1.4) : 1
      ctx.fillStyle = h.col
      if (h.cerca) {
        // Hoja de 3 píxeles con el nervio.
        const formas = [[[0, 0], [1, 0], [2, 1]], [[0, 0], [1, 1], [1, 2]], [[1, 0], [1, 1], [0, 2]], [[0, 1], [1, 1], [2, 0]]]
        for (const [dx, dy] of formas[f]) ctx.fillRect(x + dx, y + dy, 1, 1)
      } else {
        const formas = [[[0, 0], [1, 0]], [[0, 0], [1, 1]], [[0, 0], [0, 1]], [[1, 0], [0, 1]]]
        for (const [dx, dy] of formas[f]) ctx.fillRect(x + dx, y + dy, 1, 1)
      }
    }
    ctx.globalAlpha = 1

    // Zetas del sueño de Taly.
    for (const z of zetas) {
      const t = z.vida / 2.4
      ctx.globalAlpha = Math.max(0, 1 - t)
      ctx.fillStyle = C.zeta
      const x = Math.round(z.x + Math.sin(z.vida * 2.4) * 1.5)
      const y = Math.round(z.y)
      if (z.grande) {
        ctx.fillRect(x, y, 4, 1)
        ctx.fillRect(x + 2, y + 1, 1, 1)
        ctx.fillRect(x + 1, y + 2, 1, 1)
        ctx.fillRect(x, y + 3, 4, 1)
      } else {
        ctx.fillRect(x, y, 3, 1)
        ctx.fillRect(x + 1, y + 1, 1, 1)
        ctx.fillRect(x, y + 2, 3, 1)
      }
    }
    ctx.globalAlpha = 1
  }

  // ---- bucle ----

  function avanzar(dt) {
    reloj += dt

    if (encendiendo && intensidad < 1) {
      intensidad = Math.min(1, intensidad + dt / 1.8)
      if (intensidad >= 1) encendiendo = false
    }

    acumFuego += dt
    while (acumFuego >= 1 / 14) {
      acumFuego -= 1 / 14
      pasoFuego()
      if (Math.random() < 0.35 * intensidad) nacerPavesa()
    }

    siguienteHoja -= dt
    if (siguienteHoja <= 0) {
      nacerHoja()
      siguienteHoja = 0.7 + Math.random() * 1.6
    }

    siguienteHumo -= dt
    if (siguienteHumo <= 0 && intensidad > 0.5) {
      nacerHumo()
      siguienteHumo = 0.28
    }

    for (let i = pavesas.length - 1; i >= 0; i--) {
      const p = pavesas[i]
      p.vida += dt
      p.x += (p.vx + Math.sin(p.vida * 5 + p.fase) * 4) * dt
      p.y += p.vy * dt
      if (p.vida > p.dura) pavesas.splice(i, 1)
    }

    for (let i = humo.length - 1; i >= 0; i--) {
      const h = humo[i]
      h.vida += dt
      h.x += (h.vx + Math.sin(h.vida * 1.4 + h.fase) * 1.2) * dt
      h.y += h.vy * dt
      if (h.vida > h.dura) humo.splice(i, 1)
    }

    for (let i = hojas.length - 1; i >= 0; i--) {
      const h = hojas[i]
      if (h.posada > 0) {
        h.posada += dt
        if (h.posada > 4) hojas.splice(i, 1)
        continue
      }
      h.x += (h.vx + Math.sin(reloj * 1.8 + h.fase) * 5) * dt
      h.y += h.vy * dt
      if (h.y >= h.posa) {
        h.y = h.posa
        h.posada = 0.001
      } else if (h.y > L.H * 0.85 || h.x > L.W + 4) {
        hojas.splice(i, 1)
      }
    }

    for (let i = zetas.length - 1; i >= 0; i--) {
      const z = zetas[i]
      z.vida += dt
      z.y -= 4 * dt
      z.x += 1.5 * dt
      if (z.vida > 2.4) zetas.splice(i, 1)
    }

    pasoTaly(dt)
  }

  let raf = 0
  let ultimo = 0
  let acum = 0
  let visible = false
  let corriendo = false

  function fotograma(ahora) {
    raf = requestAnimationFrame(fotograma)
    const dt = Math.min(0.1, (ahora - (ultimo || ahora)) / 1000)
    ultimo = ahora
    acum += dt
    // A 30 fotogramas por segundo basta: el pixel art no pide más y se
    // ahorra batería.
    if (acum < 1 / 30) return
    avanzar(acum)
    acum = 0
    pintar()
  }

  function arrancar() {
    if (corriendo || reducido) return
    corriendo = true
    ultimo = 0
    raf = requestAnimationFrame(fotograma)
  }

  function parar() {
    corriendo = false
    cancelAnimationFrame(raf)
  }

  function revisar() {
    if (visible && !document.hidden) arrancar()
    else parar()
  }

  function encender() {
    if (encendida) return
    encendida = true
    encendiendo = true
    window.setTimeout(() => alEncender?.(), 900)
  }

  // Primer pintado: con el fuego ya formado, para que nunca se vea vacío.
  medir()
  for (let i = 0; i < 40; i++) pasoFuego()
  if (reducido) {
    // Movimiento reducido: una sola imagen quieta, con la agenda confirmada.
    reloj = 3.6
    pintar()
    alEncender?.()
  } else {
    pintar()
  }

  const alCambiarTamano = new ResizeObserver(() => {
    if (medir()) {
      hojas.length = 0
      pavesas.length = 0
      humo.length = 0
      pintar()
    }
  })
  alCambiarTamano.observe(contenedor)

  const alVer = new IntersectionObserver(
    ([entrada]) => {
      visible = entrada.isIntersecting
      if (visible && entrada.intersectionRatio > 0.25) encender()
      revisar()
    },
    { threshold: [0, 0.25, 0.5] },
  )
  alVer.observe(canvas)

  document.addEventListener('visibilitychange', revisar)

  return {
    destruir() {
      parar()
      alCambiarTamano.disconnect()
      alVer.disconnect()
      document.removeEventListener('visibilitychange', revisar)
    },
  }
}
