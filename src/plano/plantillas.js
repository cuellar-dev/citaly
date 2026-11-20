import { capPorDefecto, nuevoId, validarPlano } from './modelo.js'

/* Salas de partida para el editor. Empezar desde algo que se parece a tu
   local es mucho más fácil que desde cero: se cambia todo lo que haga falta.
   Las posiciones están pensadas para no pisarse y dejar paso entre mesas. */

let n = 0
const mesa = (tipo, x, y, w, extra = {}) => {
  n += 1
  return {
    id: nuevoId('mesa'),
    tipo,
    piso: 'p0',
    x,
    y,
    w,
    h: extra.h ?? w,
    rot: extra.rot ?? 0,
    nombre: `Mesa ${extra.numero ?? n}`,
    cap: extra.cap ?? capPorDefecto(tipo),
    online: true,
    rasgos: extra.rasgos ?? [],
  }
}
const fija = (tipo, x, y, w, h, extra = {}) => ({ id: nuevoId('p'), tipo, piso: 'p0', x, y, w, h, rot: 0, ...extra })

function cafeteria() {
  n = 0
  const piezas = [
    fija('barra', 2, 2, 12, 3),
    mesa('taburetes', 3, 6, 10, { h: 2, cap: { min: 1, normal: 4, max: 5 } }),
    fija('banos', 26, 2, 5, 5),
    fija('entrada', 14, 22, 5, 2),
    mesa('mesa-redonda', 4, 12, 4),
    mesa('mesa-redonda', 11, 12, 4),
    mesa('mesa-cuadrada', 18, 11, 4),
    mesa('mesa-cuadrada', 25, 11, 4),
    mesa('mesa-rect', 4, 18, 8, { h: 4 }),
    mesa('mesa-cuadrada', 22, 18, 4),
    fija('planta', 29, 21, 2, 2),
  ]
  const [, , , , r1, r2, c1, c2] = piezas
  return {
    tamano: 'pequeno',
    forma: { tipo: 'rect' },
    pisos: [{ id: 'p0', nombre: 'Planta baja' }],
    piezas,
    juntas: [{ mesas: [r1.id, r2.id] }, { mesas: [c1.id, c2.id] }],
  }
}

function restaurante() {
  n = 0
  const piezas = [
    fija('zona', 1, 1, 31, 25, { nombre: 'Salón' }),
    fija('entrada', 19, 30, 6, 2),
    fija('caja', 27, 28, 4, 3),
    fija('cocina', 34, 1, 9, 7),
    fija('banos', 38, 24, 5, 5),
    mesa('mesa-cuadrada', 4, 4, 4),
    mesa('mesa-cuadrada', 12, 4, 4),
    mesa('mesa-cuadrada', 20, 4, 4),
    mesa('mesa-rect', 4, 12, 8, { h: 4 }),
    mesa('mesa-rect', 16, 12, 8, { h: 4 }),
    mesa('mesa-rect', 4, 20, 8, { h: 4 }),
    mesa('mesa-rect', 16, 20, 8, { h: 4 }),
    mesa('mesa-redonda', 27, 5, 4),
    mesa('mesa-redonda', 27, 13, 4),
  ]
  const m = piezas.filter((p) => p.cap)
  return {
    tamano: 'mediano',
    forma: { tipo: 'rect' },
    pisos: [{ id: 'p0', nombre: 'Planta baja' }],
    piezas,
    juntas: [{ mesas: [m[0].id, m[1].id] }, { mesas: [m[3].id, m[4].id] }, { mesas: [m[5].id, m[6].id] }],
  }
}

function terraza() {
  n = 0
  const fuera = ['exterior']
  const piezas = [
    fija('zona', 1, 10, 21, 17, { nombre: 'Salón' }),
    fija('zona', 25, 16, 18, 15, { nombre: 'Terraza' }),
    fija('barra', 2, 2, 14, 3),
    mesa('taburetes', 3, 6, 12, { h: 2, cap: { min: 1, normal: 5, max: 6 } }),
    fija('banos', 18, 1, 5, 5),
    fija('entrada', 10, 30, 5, 2),
    mesa('mesa-cuadrada', 4, 13, 4),
    mesa('mesa-cuadrada', 11, 13, 4),
    mesa('mesa-rect', 4, 20, 8, { h: 4 }),
    mesa('mesa-cuadrada', 15, 20, 4),
    mesa('mesa-redonda', 28, 19, 4, { rasgos: fuera }),
    mesa('mesa-redonda', 35, 19, 4, { rasgos: fuera }),
    mesa('mesa-redonda', 28, 25, 4, { rasgos: fuera }),
    mesa('mesa-redonda', 35, 25, 4, { rasgos: fuera }),
    fija('planta', 41, 17, 2, 2),
  ]
  const m = piezas.filter((p) => p.cap && p.tipo !== 'taburetes')
  return {
    tamano: 'mediano',
    forma: { tipo: 'L', lado: 'ne' },
    pisos: [{ id: 'p0', nombre: 'Planta baja' }],
    piezas,
    juntas: [{ mesas: [m[0].id, m[1].id] }, { mesas: [m[4].id, m[5].id] }, { mesas: [m[6].id, m[7].id] }],
  }
}

function enBlanco() {
  return {
    tamano: 'mediano',
    forma: { tipo: 'rect' },
    pisos: [{ id: 'p0', nombre: 'Planta baja' }],
    piezas: [fija('entrada', 19, 30, 6, 2)],
    juntas: [],
  }
}

export const PLANTILLAS = [
  { id: 'cafeteria', nombre: 'Cafetería pequeña', texto: 'Barra con taburetes y unas 6 mesas', crear: cafeteria },
  { id: 'restaurante', nombre: 'Restaurante', texto: 'Salón con 10 mesas, cocina y caja', crear: restaurante },
  { id: 'terraza', nombre: 'Bar con terraza', texto: 'Local en L: barra dentro y mesas fuera', crear: terraza },
  { id: 'blanco', nombre: 'En blanco', texto: 'Solo la entrada. Lo pones todo tú', crear: enBlanco },
]

export function crearPlantilla(id) {
  const p = PLANTILLAS.find((x) => x.id === id) ?? PLANTILLAS[3]
  return validarPlano(p.crear())
}
