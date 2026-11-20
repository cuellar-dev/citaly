/* El plano de un local de mesas, como DATOS.

   No se guarda ningún SVG: se guarda esta estructura y <Plano> la dibuja en
   vector al vuelo. Así se ve nítido a cualquier tamaño, pesa muy poco, el
   backend lo recibe fácil y se puede cambiar el estilo de todos los planos
   sin tocar los datos de nadie.

   Unidades: todo va en CASILLAS de 25 cm (1 u = 25 cm). Las piezas se
   colocan donde el dueño quiera; al soltarlas se ajustan a la casilla más
   cercana. Por eso todas las coordenadas son enteros.

   plano = {
     version: 1,
     tamano: 'pequeno' | 'mediano' | 'grande',
     forma:  { tipo: 'rect' | 'L' | 'U' | 'T', lado: 'ne'|'no'|'se'|'so' | 'arriba'|'abajo' },
     pisos:  [{ id, nombre }],                 (1 a 3; todos con la misma forma)
     piezas: [{ id, tipo, piso, x, y, w, h, rot, ...datos según el tipo }],
     juntas: [{ id, mesas: [id, id…], cap: { min, normal, max } }],
   }

   SEGURIDAD: un plano nunca se usa tal como llega (localStorage, backend…).
   Pasa siempre por validarPlano(), que descarta lo que no esté en el
   catálogo, recorta números a sus rangos y limita textos. No hay forma de
   colar dibujo libre ni marcado: solo tipos conocidos y números enteros. */

export const VERSION = 1
export const CM_POR_CASILLA = 25

export const TAMANOS = {
  pequeno: { id: 'pequeno', nombre: 'Pequeño', ancho: 32, alto: 24, ejemplo: 'Una cafetería, hasta unas 10 mesas' },
  mediano: { id: 'mediano', nombre: 'Mediano', ancho: 44, alto: 32, ejemplo: 'Un restaurante normal, 10 a 25 mesas' },
  grande: { id: 'grande', nombre: 'Grande', ancho: 60, alto: 44, ejemplo: 'Un salón grande o con terraza, más de 25' },
}

/* Formas del local. Todas parten del rectángulo completo y se les quita un
   trozo (recorte). Lo recortado se dibuja rayado: "aquí no hay local". */
export const FORMAS = {
  rect: { id: 'rect', nombre: 'Rectángulo', lados: [] },
  L: { id: 'L', nombre: 'En L', lados: ['ne', 'no', 'se', 'so'] },
  U: { id: 'U', nombre: 'En U', lados: ['arriba', 'abajo'] },
  T: { id: 'T', nombre: 'En T', lados: ['arriba', 'abajo'] },
}

export const NOMBRE_LADO = {
  ne: 'Falta arriba a la derecha',
  no: 'Falta arriba a la izquierda',
  se: 'Falta abajo a la derecha',
  so: 'Falta abajo a la izquierda',
  arriba: 'Abierta arriba',
  abajo: 'Abierta abajo',
}

export const LIMITES = {
  pisos: 3,
  piezas: 150,
  mesas: 80,
  juntas: 40,
  mesasPorJunta: 4,
  nombre: 24,
  nombrePiso: 16,
  capacidad: 30,
}

/* Catálogo de piezas. `familia`:
     mesa → se reserva (lleva nombre, capacidades, rasgos)
     fija → zona común que no se reserva (barra, baños, entrada…)
     area → rectángulo de color con nombre (Terraza, Salón…): da nombre a la
            zona de las mesas que tiene dentro.
   w/h por defecto en casillas; min/max para el botón de agrandar. */
export const CATALOGO = {
  'mesa-redonda': { familia: 'mesa', nombre: 'Mesa redonda', w: 4, h: 4, min: 3, max: 8, cuadrada: true, cap: [1, 2, 3] },
  'mesa-cuadrada': { familia: 'mesa', nombre: 'Mesa cuadrada', w: 4, h: 4, min: 3, max: 8, cuadrada: true, cap: [2, 4, 5] },
  'mesa-rect': { familia: 'mesa', nombre: 'Mesa larga', w: 8, h: 4, min: 3, max: 16, cap: [3, 6, 8] },
  sofa: { familia: 'mesa', nombre: 'Reservado', w: 7, h: 5, min: 5, max: 12, cap: [2, 4, 6] },
  taburetes: { familia: 'mesa', nombre: 'Taburetes de barra', w: 8, h: 2, min: 4, max: 20, alto: 2, cap: [1, 3, 4] },

  entrada: { familia: 'fija', nombre: 'Entrada', w: 4, h: 2, min: 3, max: 10, alto: 2 },
  barra: { familia: 'fija', nombre: 'Barra', w: 12, h: 3, min: 4, max: 40, alto: 3 },
  banos: { familia: 'fija', nombre: 'Baños', w: 5, h: 5, min: 3, max: 12, cuadrada: true },
  cocina: { familia: 'fija', nombre: 'Cocina', w: 8, h: 6, min: 4, max: 20 },
  caja: { familia: 'fija', nombre: 'Caja', w: 4, h: 3, min: 3, max: 8 },
  escalera: { familia: 'fija', nombre: 'Escalera', w: 4, h: 6, min: 3, max: 10 },
  escenario: { familia: 'fija', nombre: 'Escenario', w: 10, h: 5, min: 4, max: 24 },
  ventana: { familia: 'fija', nombre: 'Ventana', w: 6, h: 1, min: 2, max: 30, alto: 1 },
  tabique: { familia: 'fija', nombre: 'Pared', w: 8, h: 1, min: 2, max: 60, alto: 1 },
  planta: { familia: 'fija', nombre: 'Planta', w: 2, h: 2, min: 2, max: 4, cuadrada: true },
  rampa: { familia: 'fija', nombre: 'Rampa', w: 4, h: 3, min: 3, max: 8 },

  zona: { familia: 'area', nombre: 'Zona', w: 14, h: 10, min: 4, max: 60, libre: true },
}

export const RASGOS = [
  { id: 'ventana', nombre: 'Junto a la ventana' },
  { id: 'exterior', nombre: 'Al aire libre' },
  { id: 'accesible', nombre: 'Accesible en silla de ruedas' },
  { id: 'ninos', nombre: 'Trona para niños' },
  { id: 'enchufe', nombre: 'Con enchufe' },
  { id: 'fumadores', nombre: 'Zona de fumadores' },
  { id: 'vista', nombre: 'Con vista' },
  { id: 'privado', nombre: 'Reservado privado' },
]

export const NOMBRES_ZONA = ['Salón', 'Terraza', 'Barra', 'Reservado', 'Patio', 'Planta alta']
export const NOMBRES_PISO = ['Planta baja', 'Arriba', 'Azotea']

const TIPOS = new Set(Object.keys(CATALOGO))
const RASGOS_IDS = new Set(RASGOS.map((r) => r.id))
const ROTACIONES = [0, 45, 90, 135, 180, 225, 270, 315]

/* ---------- utilidades ---------- */

const entero = (v, min, max, porDefecto) => {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return porDefecto
  return Math.min(max, Math.max(min, n))
}

/** Texto plano, sin saltos ni caracteres de control, recortado. */
export function textoLimpio(v, max) {
  return [...String(v ?? '')]
    /* Fuera caracteres de control y < > (nunca se pinta como HTML, pero así
       tampoco viaja nada raro al backend). */
    .filter((c) => c.charCodeAt(0) >= 32 && c.charCodeAt(0) !== 127 && c !== '<' && c !== '>')
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

let contador = 0
/** Id corto y único dentro del plano. */
export function nuevoId(prefijo = 'p') {
  contador = (contador + 1) % 1e6
  return `${prefijo}-${Date.now().toString(36)}${contador.toString(36)}`
}

export const familiaDe = (tipo) => CATALOGO[tipo]?.familia ?? null
export const esMesa = (pieza) => familiaDe(pieza?.tipo) === 'mesa'

export function dimensiones(plano) {
  return TAMANOS[plano?.tamano] ?? TAMANOS.mediano
}

/** Capacidad por defecto de una mesa según su tipo: { min, normal, max }. */
export function capPorDefecto(tipo) {
  const [min, normal, max] = CATALOGO[tipo]?.cap ?? [1, 4, 4]
  return { min, normal, max }
}

/* ---------- forma del local ---------- */

/** Los trozos del rectángulo que NO son local (se pintan rayados). */
export function recortes(plano) {
  const { ancho, alto } = dimensiones(plano)
  const { tipo, lado } = plano?.forma ?? { tipo: 'rect' }
  const cx = Math.round(ancho * 0.45)
  const cy = Math.round(alto * 0.45)
  if (tipo === 'L') {
    const x = lado === 'no' || lado === 'so' ? 0 : ancho - cx
    const y = lado === 'no' || lado === 'ne' ? 0 : alto - cy
    return [{ x, y, w: cx, h: cy }]
  }
  if (tipo === 'U') {
    const w = Math.round(ancho * 0.34)
    const h = Math.round(alto * 0.4)
    return [{ x: Math.round((ancho - w) / 2), y: lado === 'abajo' ? alto - h : 0, w, h }]
  }
  if (tipo === 'T') {
    const w = Math.round(ancho * 0.3)
    const h = Math.round(alto * 0.5)
    const y = lado === 'abajo' ? 0 : alto - h
    return [
      { x: 0, y, w, h },
      { x: ancho - w, y, w, h },
    ]
  }
  return []
}

/** Contorno del local como lista de puntos (polígono rectilíneo). */
export function contorno(plano) {
  const { ancho: W, alto: H } = dimensiones(plano)
  const { tipo, lado } = plano?.forma ?? { tipo: 'rect' }
  const [r1, r2] = recortes(plano)
  if (tipo === 'L') {
    const { x, y, w, h } = r1
    if (lado === 'ne') return [[0, 0], [x, 0], [x, h], [W, h], [W, H], [0, H]]
    if (lado === 'no') return [[w, 0], [W, 0], [W, H], [0, H], [0, h], [w, h]]
    if (lado === 'se') return [[0, 0], [W, 0], [W, y], [x, y], [x, H], [0, H]]
    return [[0, 0], [W, 0], [W, H], [w, H], [w, y], [0, y]]
  }
  if (tipo === 'U') {
    const { x, y, w, h } = r1
    if (lado === 'abajo') return [[0, 0], [W, 0], [W, H], [x + w, H], [x + w, y], [x, y], [x, H], [0, H]]
    return [[0, 0], [x, 0], [x, h], [x + w, h], [x + w, 0], [W, 0], [W, H], [0, H]]
  }
  if (tipo === 'T') {
    const { w, h } = r1
    if (lado === 'abajo') return [[w, 0], [W - w, 0], [W - w, h], [W, h], [W, H], [0, H], [0, h], [w, h]]
    return [[0, 0], [W, 0], [W, H - h], [W - w, H - h], [W - w, H], [w, H], [w, H - h], [0, H - h]]
  }
  void r2
  return [[0, 0], [W, 0], [W, H], [0, H]]
}

/* ---------- geometría de piezas ---------- */

/** Caja que ocupa la pieza en el plano (contando el giro). */
export function caja(p) {
  const rot = ((p.rot ?? 0) % 180 + 180) % 180
  if (rot === 0) return { x: p.x, y: p.y, w: p.w, h: p.h }
  if (rot === 90) {
    const cx = p.x + p.w / 2
    const cy = p.y + p.h / 2
    return { x: cx - p.h / 2, y: cy - p.w / 2, w: p.h, h: p.w }
  }
  /* 45°: la caja del rombo. Aproximada, sirve para avisar de choques. */
  const lado = (p.w + p.h) / Math.SQRT2
  const cx = p.x + p.w / 2
  const cy = p.y + p.h / 2
  return { x: cx - lado / 2, y: cy - lado / 2, w: lado, h: lado }
}

const seCruzan = (a, b, margen = 0) =>
  a.x < b.x + b.w - margen && b.x < a.x + a.w - margen && a.y < b.y + b.h - margen && b.y < a.y + a.h - margen

/** ¿La pieza cae fuera del local (bordes o zona rayada)? */
export function fueraDelLocal(plano, p) {
  const { ancho, alto } = dimensiones(plano)
  const c = caja(p)
  if (c.x < -0.01 || c.y < -0.01 || c.x + c.w > ancho + 0.01 || c.y + c.h > alto + 0.01) return true
  return recortes(plano).some((r) => seCruzan(c, r, 0.01))
}

/* Las paredes, ventanas y entradas van pegadas al borde o encima de otras
   piezas; las zonas son fondo. No cuentan para "se pisan". */
const NO_CHOCAN = new Set(['zona', 'tabique', 'ventana', 'entrada'])

/** Pares de piezas del mismo piso que se pisan. */
export function choques(plano) {
  const piezas = plano.piezas.filter((p) => !NO_CHOCAN.has(p.tipo))
  const pares = []
  for (let i = 0; i < piezas.length; i++) {
    for (let j = i + 1; j < piezas.length; j++) {
      const a = piezas[i]
      const b = piezas[j]
      if (a.piso === b.piso && seCruzan(caja(a), caja(b), 0.2)) pares.push([a.id, b.id])
    }
  }
  return pares
}

/** Distancia entre los bordes de dos piezas (0 si se tocan). */
export function distancia(a, b) {
  const A = caja(a)
  const B = caja(b)
  const dx = Math.max(0, Math.max(A.x - (B.x + B.w), B.x - (A.x + A.w)))
  const dy = Math.max(0, Math.max(A.y - (B.y + B.h), B.y - (A.y + A.h)))
  return Math.hypot(dx, dy)
}

/** Primer hueco libre cerca de un punto para una pieza nueva. */
export function huecoLibre(plano, pieza) {
  const { ancho, alto } = dimensiones(plano)
  const ocupado = plano.piezas.filter((p) => p.piso === pieza.piso && !NO_CHOCAN.has(p.tipo))
  const cx = Math.round(ancho / 2 - pieza.w / 2)
  const cy = Math.round(alto / 2 - pieza.h / 2)
  for (let radio = 0; radio < Math.max(ancho, alto); radio += 1) {
    for (let dx = -radio; dx <= radio; dx++) {
      for (let dy = -radio; dy <= radio; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== radio) continue
        const prueba = { ...pieza, x: cx + dx, y: cy + dy }
        if (fueraDelLocal(plano, prueba)) continue
        if (NO_CHOCAN.has(pieza.tipo) || !ocupado.some((o) => seCruzan(caja(o), caja(prueba), 0.2))) return prueba
      }
    }
  }
  return { ...pieza, x: Math.max(0, cx), y: Math.max(0, cy) }
}

/**
 * Tras cambiar el tamaño o la forma: lo que quedó fuera vuelve dentro.
 * Primero se arrima al borde (se queda cerca de donde estaba); si aun así cae
 * en la parte que no es local, busca el hueco libre más cercano al centro.
 */
export function reubicar(plano) {
  const { ancho, alto } = dimensiones(plano)
  const piezas = []
  for (const p of plano.piezas) {
    if (!fueraDelLocal(plano, p)) {
      piezas.push(p)
      continue
    }
    const c = caja(p)
    const dx = c.x < 0 ? -c.x : c.x + c.w > ancho ? ancho - (c.x + c.w) : 0
    const dy = c.y < 0 ? -c.y : c.y + c.h > alto ? alto - (c.y + c.h) : 0
    const arrimada = { ...p, x: Math.round(p.x + dx), y: Math.round(p.y + dy) }
    if (!fueraDelLocal(plano, arrimada)) piezas.push(arrimada)
    else piezas.push(huecoLibre({ ...plano, piezas: [...piezas, ...plano.piezas.filter((o) => o.id !== p.id && !piezas.some((q) => q.id === o.id))] }, p))
  }
  return { ...plano, piezas }
}

/* ---------- mesas, zonas y juntas ---------- */

/** Nombre de la zona en la que cae el centro de una pieza (o null). */
export function zonaDe(plano, p) {
  const c = caja(p)
  const cx = c.x + c.w / 2
  const cy = c.y + c.h / 2
  const zona = plano.piezas.find(
    (z) => z.tipo === 'zona' && z.piso === p.piso && cx >= z.x && cx <= z.x + z.w && cy >= z.y && cy <= z.y + z.h,
  )
  return zona?.nombre || null
}

export const mesasDe = (plano) => plano.piezas.filter(esMesa)

/** Capacidad por defecto de unas mesas juntas: la suma. */
export function capDeJunta(plano, ids) {
  const mesas = mesasDe(plano).filter((m) => ids.includes(m.id))
  const normal = mesas.reduce((t, m) => t + m.cap.normal, 0)
  const max = mesas.reduce((t, m) => t + (m.cap.max ?? m.cap.normal), 0)
  return { min: Math.max(...mesas.map((m) => m.cap.normal)) + 1, normal, max }
}

/** Mesas del mismo piso, reservables, que están a 3 casillas o menos y aún no forman pareja. */
export function parejasCercanas(plano) {
  const mesas = mesasDe(plano).filter((m) => m.online)
  const yaJuntas = new Set(plano.juntas.filter((j) => j.mesas.length === 2).map((j) => [...j.mesas].sort().join('|')))
  const pares = []
  for (let i = 0; i < mesas.length; i++) {
    for (let j = i + 1; j < mesas.length; j++) {
      const a = mesas[i]
      const b = mesas[j]
      if (a.piso !== b.piso || distancia(a, b) > 3) continue
      if (yaJuntas.has([a.id, b.id].sort().join('|'))) continue
      pares.push([a, b])
    }
  }
  return pares
}

/** Siguiente nombre libre: "Mesa 1", "Mesa 2"… */
export function siguienteNombre(plano, base = 'Mesa') {
  const usados = new Set(mesasDe(plano).map((m) => m.nombre))
  for (let n = 1; n < 999; n++) if (!usados.has(`${base} ${n}`)) return `${base} ${n}`
  return base
}

/** Lo que se ve dentro de la mesa: el número, o unas iniciales. */
export function rotuloCorto(nombre) {
  /* "Mesa 3" → "M3": solo el número se confundía con las personas. */
  const texto = String(nombre ?? '').trim()
  const n = texto.match(/\d+/)
  if (n) return /^\d/.test(texto) ? n[0] : `${texto[0].toUpperCase()}${n[0]}`
  return String(nombre ?? '')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/* ---------- crear y validar ---------- */

/** Pieza nueva de un tipo, con sus datos por defecto. */
export function crearPieza(plano, tipo, piso) {
  const def = CATALOGO[tipo]
  const base = { id: nuevoId(def.familia === 'mesa' ? 'mesa' : 'p'), tipo, piso, x: 0, y: 0, w: def.w, h: def.h, rot: 0 }
  if (def.familia === 'mesa') {
    Object.assign(base, { nombre: siguienteNombre(plano), cap: capPorDefecto(tipo), online: true, rasgos: [] })
  }
  if (def.familia === 'area') base.nombre = NOMBRES_ZONA[0]
  return base
}

function validarCap(cap, tipo) {
  const def = capPorDefecto(tipo)
  const normal = entero(cap?.normal, 1, LIMITES.capacidad, def.normal)
  const min = entero(cap?.min, 1, normal, Math.min(def.min, normal))
  const max = cap?.max == null ? null : entero(cap.max, normal, LIMITES.capacidad, normal)
  return { min, normal, max: max === normal ? null : max }
}

function validarPieza(raw, pisos, { ancho, alto }) {
  if (!raw || typeof raw !== 'object' || !TIPOS.has(raw.tipo)) return null
  const def = CATALOGO[raw.tipo]
  const piso = pisos.has(raw.piso) ? raw.piso : [...pisos][0]
  const maxLado = Math.max(ancho, alto)
  const w = entero(raw.w, 1, Math.min(def.max, maxLado), def.w)
  const h = def.alto ? def.alto : def.cuadrada ? w : entero(raw.h, 1, Math.min(def.libre ? def.max : def.max, maxLado), def.h)
  const p = {
    id: textoLimpio(raw.id, 40) || nuevoId(),
    tipo: raw.tipo,
    piso,
    x: entero(raw.x, -maxLado, maxLado * 2, 0),
    y: entero(raw.y, -maxLado, maxLado * 2, 0),
    w,
    h,
    rot: ROTACIONES.includes(Number(raw.rot)) ? Number(raw.rot) : 0,
  }
  if (def.familia === 'mesa') {
    p.nombre = textoLimpio(raw.nombre, LIMITES.nombre) || 'Mesa'
    p.cap = validarCap(raw.cap, raw.tipo)
    p.online = raw.online !== false
    p.rasgos = Array.isArray(raw.rasgos) ? [...new Set(raw.rasgos.filter((r) => RASGOS_IDS.has(r)))] : []
    if (raw.nota) p.nota = textoLimpio(raw.nota, 40)
  }
  if (def.familia === 'area') p.nombre = textoLimpio(raw.nombre, LIMITES.nombre) || 'Zona'
  return p
}

/**
 * Devuelve un plano limpio y seguro, o null si no se parece a un plano.
 * Todo lo desconocido se descarta; los números se recortan a sus rangos.
 */
export function validarPlano(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.piezas)) return null
  const tamano = TAMANOS[raw.tamano] ? raw.tamano : 'mediano'
  const tipoForma = FORMAS[raw.forma?.tipo] ? raw.forma.tipo : 'rect'
  const lados = FORMAS[tipoForma].lados
  const forma = { tipo: tipoForma, lado: lados.includes(raw.forma?.lado) ? raw.forma.lado : lados[0] ?? null }

  const pisosRaw = Array.isArray(raw.pisos) && raw.pisos.length ? raw.pisos.slice(0, LIMITES.pisos) : [{ id: 'p0' }]
  const pisos = pisosRaw.map((p, i) => ({
    id: textoLimpio(p?.id, 20) || `p${i}`,
    nombre: textoLimpio(p?.nombre, LIMITES.nombrePiso) || NOMBRES_PISO[i] || `Piso ${i + 1}`,
  }))
  const idsPisos = new Set(pisos.map((p) => p.id))
  const dims = TAMANOS[tamano]

  const vistos = new Set()
  const piezas = []
  let mesas = 0
  for (const r of raw.piezas.slice(0, LIMITES.piezas * 2)) {
    const p = validarPieza(r, idsPisos, dims)
    if (!p || vistos.has(p.id)) continue
    if (esMesa(p) && ++mesas > LIMITES.mesas) continue
    vistos.add(p.id)
    piezas.push(p)
    if (piezas.length >= LIMITES.piezas) break
  }

  const plano = { version: VERSION, tamano, forma, pisos, piezas, juntas: [] }
  const porId = new Map(mesasDe(plano).map((m) => [m.id, m]))
  for (const j of (Array.isArray(raw.juntas) ? raw.juntas : []).slice(0, LIMITES.juntas)) {
    const ids = [...new Set((Array.isArray(j?.mesas) ? j.mesas : []).filter((id) => porId.has(id)))].slice(0, LIMITES.mesasPorJunta)
    if (ids.length < 2) continue
    /* Todas del mismo piso. */
    if (new Set(ids.map((id) => porId.get(id).piso)).size !== 1) continue
    const def = capDeJunta(plano, ids)
    const normal = entero(j.cap?.normal, 2, LIMITES.capacidad * 2, def.normal)
    const min = entero(j.cap?.min, 1, normal, Math.min(def.min, normal))
    const max = j.cap?.max == null ? null : entero(j.cap.max, normal, LIMITES.capacidad * 2, normal)
    plano.juntas.push({ id: textoLimpio(j.id, 40) || nuevoId('junta'), mesas: ids, cap: { min, normal, max: max === normal ? null : max } })
  }
  return plano
}
