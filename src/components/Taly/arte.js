/* =====================================================================
   Taly · el arte de la mascota de Citaly
   ---------------------------------------------------------------------
   Nombre:     Taly (de ciTALY)
   Alma:       un pajarito regordete y casero que te trae las citas,
               te avisa cuando toca y se pone contentisimo al confirmar
   Silueta:    huevo de perfil, cabeza estrecha y cuerpo ancho, con
               copete, ala plegada, barriga clara y dos patitas

   Vocabulario de dibujo: Unicode Block Elements (U+2580-U+259F)
   Motor de pintado:      SVG

   Por que el dibujo se autoriza en caracteres pero no se pinta con ellos
   ---------------------------------------------------------------------
   Escribir la mascota como rejilla de caracteres de bloque es comodo de
   leer y de editar, asi que los datos siguen siendo eso. Pero pintarla
   como texto no funciona: de los 32 glifos, solo 8 tienen el ancho de
   avance de la celda (▀ ▄ █ ▌ ▐ ░ ▒ ▓). Los cuartos (▖▗▘▝) y los tres
   cuartos (▙▟▛▜▚▞) miden un 70% mas, porque no estan en las fuentes
   monoespaciadas habituales y el navegador recurre a otra. Un solo glifo
   de esos desplaza a la derecha TODO lo que va detras en su fila y la
   rejilla se descuadra. En una web es peor todavia, porque cada visitante
   tiene fuentes distintas y el resultado seria impredecible.

   Por eso cada glifo se traduce a sus rectangulos (FORMAS) y se pinta en
   SVG: sale exacto, nitido a cualquier tamano, igual en todos los
   navegadores, y las tramas quedan recortadas a la forma del glifo en vez
   de desbordarse del contorno.

   Este archivo es la copia que usa la app. El laboratorio de diseno, con
   las hojas de poses, el visor de escenas y los scripts de auditoria y
   exportacion, esta en brand/mascota/. Si se retoca el dibujo, hay que
   tocar los dos.
====================================================================== */

// ---- paleta --------------------------------------------------------------
// Armonica con Citaly (teal #00C2AD sobre #121413) pero desplazada hacia el
// menta, mas calida y mas de manualidad que el teal de la interfaz.
export const PALETA = {
  b: '#4FD8C4',   // cuerpo
  d: '#2AA795',   // ala y sombra
  l: '#BDF4E8',   // barriga
  tc: '#2FBDA8',  // puntadas sobre el cuerpo
  tb: '#8FE0D0',  // puntadas sobre la barriga
  m: '#FFD166',   // pico, copete y patas
  o: '#0E2E2A',   // ojo
  cr: '#F2EBDD',  // crema, para la tarjeta de cita
}

// ---- rejilla -------------------------------------------------------------
// La celda no es cuadrada. Se dibujo con la proporcion de una celda de texto
// monoespaciado (0.55), pero con esa el pajaro salia mas alto que ancho. Al
// no depender ya de ninguna fuente la proporcion es libre: a 0.72 la silueta
// queda redonda y regordeta sin tocar el dibujo. Las puntadas no se
// deforman, porque su tamano es fijo y no una fraccion de celda.
export const CELDA = { ancho: 72, alto: 100 }
export const ESCENARIO = { filas: 9, columnas: 17 }
const OFFSET = { fila: 1, columna: 3 }

// Silueta base. El pico no esta aqui: va en la capa de detalle, para que las
// poses puedan abrirlo y cerrarlo.
const ROWS = [
  '           ',   // 0 el copete va aparte, necesita otra altura
  '  ▟████▙   ',   // 1 alto de la cabeza
  '  ▐█████   ',   // 2 cabeza (el pico se anade como detalle)
  ' ▐███████▌ ',   // 3 pecho
  ' ▐███████▌ ',   // 4 barriga
  '  ▜█████▛  ',   // 5 base redondeada
  '    ▀ ▀    ',   // 6 patas
]

// El copete se dibuja aparte porque necesita alturas distintas en una misma
// fila para leerse como plumon. Con dos glifos de media altura sale una
// barra plana, que parece la visera de una gorra.
const COPETE = [
  { p: [0, 2], ch: '▄' },
  { p: [0, 3], ch: '█' },
]

// ---- traduccion de glifo a rectangulos -----------------------------------
// Cada rectangulo es [x, y, ancho, alto] en fraccion de celda.
const FORMAS = {
  '█': [[0, 0, 1, 1]],
  '▀': [[0, 0, 1, 0.5]],
  '▄': [[0, 0.5, 1, 0.5]],
  '▌': [[0, 0, 0.5, 1]],
  '▐': [[0.5, 0, 0.5, 1]],
  '▘': [[0, 0, 0.5, 0.5]],
  '▝': [[0.5, 0, 0.5, 0.5]],
  '▖': [[0, 0.5, 0.5, 0.5]],
  '▗': [[0.5, 0.5, 0.5, 0.5]],
  '▙': [[0, 0, 0.5, 1], [0.5, 0.5, 0.5, 0.5]],
  '▟': [[0.5, 0, 0.5, 1], [0, 0.5, 0.5, 0.5]],
  '▛': [[0, 0, 1, 0.5], [0, 0.5, 0.5, 0.5]],
  '▜': [[0, 0, 1, 0.5], [0.5, 0.5, 0.5, 0.5]],
  '▚': [[0, 0, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]],
  '▞': [[0.5, 0, 0.5, 0.5], [0, 0.5, 0.5, 0.5]],
  '▔': [[0, 0, 1, 0.18]],
  '▁': [[0, 0.82, 1, 0.18]],
  '░': [[0, 0, 1, 1]],
  '▒': [[0, 0, 1, 1]],
  '▓': [[0, 0, 1, 1]],
}

const TRAMAS = { '░': 1, '▒': 2, '▓': 3 }

const PATAS = [[6, 4], [6, 6]]
// [5,8] entra en la barriga: si se queda del color del cuerpo, la esquina
// inferior derecha se lee como un bloque suelto pegado al costado.
const BARRIGA = [[4, 5], [4, 6], [4, 7], [4, 8], [5, 5], [5, 6], [5, 7], [5, 8]]
const BORDE_BARRIGA = [[3, 6], [3, 7], [3, 8]]

const COLOR_BASE = { m: PATAS, l: BARRIGA }

// ---- rasgos --------------------------------------------------------------
const OJO = {
  abierto: { p: [2, 6], ch: '▀', c: 'o' },
  cerrado: { p: [2, 6], ch: '▔', c: 'o' },
  bajo: { p: [2, 6], ch: '▄', c: 'o' },
  atras: { p: [2, 5], ch: '▀', c: 'o' },
  // Para la alegria no sirve el ojo muy abierto: en un pajaro se lee como
  // susto. Un ojo entornado abajo funciona mejor.
  feliz: { p: [2, 6], ch: '▄', c: 'o' },
}

const PICO = {
  // Cerrado apunta hacia abajo; abierto se levanta. El cambio de direccion es
  // lo que hace legible que el pajaro esta cantando.
  cerrado: [{ p: [2, 8], ch: '▙', c: 'm' }, { p: [2, 9], ch: '▖', c: 'm' }],
  abierto: [{ p: [2, 8], ch: '▀', c: 'm' }, { p: [2, 9], ch: '▘', c: 'm' }],
}

// El ala se mueve para aletear. La silueta exterior nunca cambia: lo que se
// mueve es la mancha del ala dentro del cuerpo. Cada celda lleva su forma
// para que el ala salga redondeada en vez de un rectangulo.
const ALA = {
  media: [
    { p: [3, 2], ch: '█' }, { p: [3, 3], ch: '█' }, { p: [3, 4], ch: '▄' },
    { p: [4, 2], ch: '█' }, { p: [4, 3], ch: '▀' },
  ],
  arriba: [
    { p: [2, 3], ch: '▄' }, { p: [2, 4], ch: '▄' },
    { p: [3, 2], ch: '█' }, { p: [3, 3], ch: '█' }, { p: [3, 4], ch: '▀' },
  ],
  abajo: [
    { p: [4, 2], ch: '█' }, { p: [4, 3], ch: '█' }, { p: [4, 4], ch: '▄' },
    { p: [5, 3], ch: '▀' }, { p: [5, 4], ch: '▀' },
  ],
}

const mismaCelda = (a, b) => a[0] === b[0] && a[1] === b[1]
const dentro = (lista, p) => lista.some((x) => mismaCelda(x, p))

// El tejido cubre toda la silueta respetando la forma de cada celda. Como el
// SVG recorta la puntada al glifo, el borde tambien se puede tejer y no queda
// el aro macizo que rodeaba al pajaro cuando esto se pintaba con texto.
// La celda del ojo se pasa como parametro: hay poses que lo mueven, y si se
// diera por fija la de reposo, el tejido pintaria puntadas justo debajo del
// ojo desplazado y dejaria sin tejer la celda que abandona.
function tejido(ala, celdaOjo) {
  const out = []
  const celdasAla = ala.map((a) => a.p)
  ROWS.forEach((fila, f) => {
    for (let c = 0; c < fila.length; c++) {
      if (fila[c] === ' ') continue
      const p = [f, c]
      if (mismaCelda(p, celdaOjo)) continue
      if (dentro(celdasAla, p)) continue
      if (dentro(BORDE_BARRIGA, p)) continue
      if (dentro(PATAS, p)) continue           // las patas van lisas
      out.push({ p, ch: fila[c], trama: 1, c: dentro(BARRIGA, p) ? 'tb' : 'tc' })
    }
  })
  return out
}

// ---- poses ---------------------------------------------------------------
// Cada pose cambia un solo rasgo respecto a la de reposo. El orden de la
// lista es el orden de pintado: lo ultimo queda encima.
function componerPose(ojo, pico, ala) {
  return [
    ...tejido(ala, ojo.p),
    ...BORDE_BARRIGA.map((p) => ({ p, ch: '▄', c: 'l' })),
    // El ala va en dos pasadas: primero maciza en el menta oscuro y luego las
    // puntadas claras encima. Solo con trama sobre el cuerpo no se distinguia
    // del tejido general y el ala desaparecia.
    ...ala.map((a) => ({ p: a.p, ch: a.ch, c: 'd' })),
    ...ala.map((a) => ({ p: a.p, ch: a.ch, trama: 1, c: 'b' })),
    ...pico,
    ojo,
  ]
}

export const POSES = {
  reposo: componerPose(OJO.abierto, PICO.cerrado, ALA.media),
  parpadeo: componerPose(OJO.cerrado, PICO.cerrado, ALA.media),
  'mira-atras': componerPose(OJO.atras, PICO.cerrado, ALA.media),
  'mira-abajo': componerPose(OJO.bajo, PICO.cerrado, ALA.media),
  canto: componerPose(OJO.cerrado, PICO.abierto, ALA.media),
  contento: componerPose(OJO.feliz, PICO.abierto, ALA.arriba),
  'ala-arriba': componerPose(OJO.abierto, PICO.cerrado, ALA.arriba),
  'ala-abajo': componerPose(OJO.abierto, PICO.cerrado, ALA.abajo),
  dormido: componerPose(OJO.cerrado, PICO.cerrado, ALA.abajo),
  busca: componerPose(OJO.atras, PICO.abierto, ALA.arriba),
}

// ---- objetos -------------------------------------------------------------
// En coordenadas del escenario, no del pajaro.
export const OBJETOS = {
  // La cita que Taly lleva en el pico: una tarjetita con el talon en mostaza.
  tarjeta: [
    { p: [3, 13], ch: '▄', c: 'm' }, { p: [3, 14], ch: '▄', c: 'cr' },
    { p: [4, 13], ch: '▀', c: 'm' }, { p: [4, 14], ch: '▀', c: 'cr' },
  ],
  // El canto, subiendo en diagonal desde el pico.
  notas: [
    { p: [2, 13], ch: '▘', c: 'm' },
    { p: [1, 14], ch: '▘', c: 'm' },
    { p: [0, 15], ch: '▘', c: 'm' },
  ],
  // La celebracion al confirmar una cita. Pegadas al cuerpo: dispersas por el
  // escenario se leian como suciedad, no como chispas.
  chispas: [
    { p: [1, 2], ch: '▝', c: 'm' },
    { p: [1, 12], ch: '▗', c: 'm' },
    { p: [2, 14], ch: '▘', c: 'm' },
    { p: [7, 3], ch: '▖', c: 'm' },
    { p: [7, 12], ch: '▗', c: 'm' },
  ],
  // Dormido: burbujitas de sueno.
  sueno: [
    { p: [2, 13], ch: '▖', c: 'l' },
    { p: [1, 14], ch: '▖', c: 'l' },
    { p: [0, 15], ch: '▖', c: 'l' },
  ],
}

// ---- escenas -------------------------------------------------------------
// La suma de los ms de cada escena es su duracion exacta de bucle: el ultimo
// fotograma enlaza con el primero, asi que se repite sin salto.
export const ESCENAS = {
  // Presentacion y onboarding: se despierta, mira, y se alegra.
  hero: [
    { pose: 'reposo', bob: 0, ms: 900 },
    { pose: 'parpadeo', bob: 0, ms: 130 },
    { pose: 'reposo', bob: 0, ms: 620 },
    { pose: 'mira-atras', bob: -2, ms: 640 },
    { pose: 'reposo', bob: 0, ms: 420 },
    { pose: 'parpadeo', bob: 0, ms: 130 },
    { pose: 'contento', bob: -10, ms: 380, objetos: ['chispas'] },
    { pose: 'contento', bob: -14, ms: 360, objetos: ['chispas'] },
    { pose: 'reposo', bob: 0, ms: 500 },
    { pose: 'reposo', bob: -2, ms: 720 },
  ],
  // Cargando: aletea rapido y va mirando alrededor. Cierra en ala-abajo y
  // arranca en ala-arriba a proposito: es el propio batir del ala. Aqui un
  // cierre con la misma pose cortaria el aleteo.
  loader: [
    { pose: 'ala-arriba', bob: -4, ms: 180 },
    { pose: 'ala-abajo', bob: 0, ms: 180 },
    { pose: 'ala-arriba', bob: -4, ms: 180 },
    { pose: 'ala-abajo', bob: 0, ms: 180 },
    { pose: 'busca', bob: -2, ms: 240 },
    { pose: 'ala-arriba', bob: -4, ms: 180 },
    { pose: 'ala-abajo', bob: 0, ms: 300 },
  ],
  // Sin citas: dormidito, respirando despacio.
  vacio: [
    { pose: 'dormido', bob: 0, ms: 1200, objetos: ['sueno'] },
    { pose: 'dormido', bob: 2, ms: 900, objetos: ['sueno'] },
    { pose: 'dormido', bob: 0, ms: 900, objetos: ['sueno'] },
    { pose: 'parpadeo', bob: 0, ms: 200 },
    { pose: 'dormido', bob: 0, ms: 400, objetos: ['sueno'] },
  ],
  // Cita confirmada: el momento de maxima alegria.
  confirmacion: [
    { pose: 'reposo', bob: 0, ms: 400 },
    { pose: 'contento', bob: -8, ms: 300, objetos: ['chispas'] },
    { pose: 'contento', bob: -14, ms: 300, objetos: ['chispas'] },
    { pose: 'contento', bob: -8, ms: 260, objetos: ['chispas'] },
    { pose: 'reposo', bob: 0, ms: 340 },
    { pose: 'contento', bob: -6, ms: 300, objetos: ['chispas'] },
    { pose: 'reposo', bob: 0, ms: 500 },
  ],
  // Recordatorio: canta para avisarte de que tienes una cita cerca.
  recordatorio: [
    { pose: 'reposo', bob: 0, ms: 600 },
    { pose: 'canto', bob: -4, ms: 320, objetos: ['notas'] },
    { pose: 'reposo', bob: 0, ms: 200 },
    { pose: 'canto', bob: -4, ms: 320, objetos: ['notas'] },
    { pose: 'reposo', bob: 0, ms: 240 },
    { pose: 'canto', bob: -4, ms: 320, objetos: ['notas'] },
    { pose: 'reposo', bob: 0, ms: 800 },
  ],
  // Mensajero: te trae la cita en el pico.
  mensajero: [
    { pose: 'reposo', bob: 0, ms: 700, objetos: ['tarjeta'] },
    { pose: 'ala-arriba', bob: -6, ms: 200, objetos: ['tarjeta'] },
    { pose: 'ala-abajo', bob: -2, ms: 200, objetos: ['tarjeta'] },
    { pose: 'ala-arriba', bob: -8, ms: 200, objetos: ['tarjeta'] },
    { pose: 'ala-abajo', bob: -2, ms: 200, objetos: ['tarjeta'] },
    { pose: 'reposo', bob: 0, ms: 500, objetos: ['tarjeta'] },
    { pose: 'contento', bob: -10, ms: 400, objetos: ['tarjeta', 'chispas'] },
    { pose: 'reposo', bob: 0, ms: 800, objetos: ['tarjeta'] },
  ],
}

export const duracionEscena = (nombre) =>
  ESCENAS[nombre].reduce((total, paso) => total + paso.ms, 0)

export const escenasDisponibles = Object.keys(ESCENAS)
export const posesDisponibles = Object.keys(POSES)

// ---- pintado -------------------------------------------------------------
export const ANCHO_TOTAL = ESCENARIO.columnas * CELDA.ancho
export const ALTO_TOTAL = ESCENARIO.filas * CELDA.alto

// Encuadres de cámara. "compacto" recorta el margen muerto del escenario
// para que en la UI el pajaro se vea centrado y a un tamaño razonable.
export const ENCUADRE = {
  completo: { x: 0, y: 0, ancho: ANCHO_TOTAL, alto: ALTO_TOTAL },
  // Centrado en el cuerpo del pajaro (col ~8.5), con aire para objetos pegados.
  compacto: {
    x: 2 * CELDA.ancho,
    y: 0.2 * CELDA.alto,
    ancho: 13 * CELDA.ancho,
    alto: 7.5 * CELDA.alto,
  },
}

// La puntada: una reticula de cuadraditos con hueco entre ellos, que es lo que
// da el aire de punto de cruz. Densidad 1 es suelta, 3 casi maciza.
const PUNTADA = { lado: 13.75, proporcion: 0.42 }

const idPatron = (densidad, clave) => `taly-p${densidad}-${clave}`

/** Los <pattern> que necesita el SVG: una densidad por cada color. */
export function listaPatrones() {
  const salida = []
  Object.entries(TRAMAS).forEach(([, densidad]) => {
    Object.keys(PALETA).forEach((clave) => {
      // Con densidad 1 va una puntada de cada cuatro; con 2, en tresbolillo;
      // con 3, todas menos una.
      const puestos = densidad === 1 ? [[0, 0]]
        : densidad === 2 ? [[0, 0], [1, 1]]
          : [[0, 0], [1, 1], [1, 0]]
      const lado = PUNTADA.lado
      const punto = lado * PUNTADA.proporcion
      const margen = (lado - punto) / 2
      salida.push({
        id: idPatron(densidad, clave),
        tile: lado * 2,
        color: PALETA[clave],
        punto,
        puntos: puestos.map(([i, j]) => ({ x: i * lado + margen, y: j * lado + margen })),
      })
    })
  })
  return salida
}

/**
 * Rectangulos de un glifo en una celda del escenario.
 * La forma la da el glifo y el relleno la trama, y van por separado: asi una
 * zona texturada puede tener forma redondeada (media celda, esquina) en vez
 * de ser siempre un rectangulo completo.
 */
function rectangulos(fila, col, ch, clave, trama) {
  const formas = FORMAS[ch]
  if (!formas) return []
  const densidad = trama || TRAMAS[ch] || 0
  const fill = densidad ? `url(#${idPatron(densidad, clave)})` : PALETA[clave]
  return formas.map(([fx, fy, fw, fh]) => ({
    x: (col + fx) * CELDA.ancho,
    y: (fila + fy) * CELDA.alto,
    width: fw * CELDA.ancho,
    height: fh * CELDA.alto,
    fill,
  }))
}

/** La silueta. No cambia nunca, asi que se calcula una sola vez. */
export function construirBase() {
  const mapa = {}
  Object.entries(COLOR_BASE).forEach(([clave, celdas]) => {
    celdas.forEach(([f, c]) => { mapa[`${f},${c}`] = clave })
  })
  const out = []
  ROWS.forEach((fila, f) => {
    for (let c = 0; c < fila.length; c++) {
      if (fila[c] === ' ') continue
      out.push(...rectangulos(f + OFFSET.fila, c + OFFSET.columna, fila[c],
        mapa[`${f},${c}`] || 'b'))
    }
  })
  COPETE.forEach((d) => {
    out.push(...rectangulos(d.p[0] + OFFSET.fila, d.p[1] + OFFSET.columna, d.ch, 'm'))
  })
  return out
}

/** Lo que cambia entre poses: ojo, pico, ala, tejido y objetos. */
export function construirDetalle(nombrePose, objetos) {
  const pose = POSES[nombrePose] || POSES.reposo
  const out = []
  pose.forEach((d) => {
    out.push(...rectangulos(d.p[0] + OFFSET.fila, d.p[1] + OFFSET.columna, d.ch, d.c, d.trama))
  })
  ;(objetos || []).forEach((nombre) => {
    (OBJETOS[nombre] || []).forEach((d) => {
      out.push(...rectangulos(d.p[0], d.p[1], d.ch, d.c, d.trama))
    })
  })
  return out
}

/** El salto se mide en celdas para que no dependa del tamano de pintado. */
export const saltoEnUnidades = (bob) => (bob || 0) * (CELDA.alto / 40)
