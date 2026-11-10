import './fondoDescubre.css'

/* Fondo de Descubre: un cielo a pantalla completa con un árbol en silueta
   dibujado a mano, al estilo de taly-a-mano.svg. Nubes de plumón, estrellitas,
   chispas de mostaza y, en primer plano, un árbol negro como una sombra con
   las ramas peladas abriéndose sobre el cielo.

   No lleva el pájaro ni animación: es ambiente, no ilustración. Ocupa toda la
   ventana (100dvw × 100dvh) y se queda detrás de todo; el tronco baja por
   detrás de las tarjetas y lo que se lee son las ramas de arriba, sobre el
   cielo. Como es estático no cuesta nada: se pinta una vez. */

/* Nubes de plumón: bultos redondos arriba y base casi plana. Grandes para que
   se vean también en móvil. */
const NUBES = [
  'M240 104 C218 104 212 80 234 74 C232 50 270 45 281 63 C296 42 334 49 335 74 C359 70 368 96 344 102 Z',
  'M44 196 C26 196 21 176 39 171 C38 151 69 147 78 162 C91 145 123 150 124 171 C144 168 151 189 130 194 Z',
  'M286 250 C271 250 267 234 282 230 C281 214 307 211 315 223 C326 209 351 215 352 232 C368 229 374 246 356 250 Z',
]

/* Chispas de mostaza, como las de la celebración de Taly. */
const CHISPAS = [
  [150, 66, 1], [312, 150, 0.9], [66, 128, 0.8], [232, 118, 0.95],
  [354, 224, 0.85], [104, 250, 0.8], [196, 196, 0.75],
]

/* Estrellitas: puntos pequeños repartidos por el cielo. */
const ESTRELLAS = [
  [40, 58, 1.5], [118, 38, 1.1], [200, 80, 1.3], [282, 48, 1.1],
  [348, 118, 1.4], [66, 206, 1.1], [172, 158, 1.2], [322, 188, 1.1],
  [252, 236, 1], [92, 104, 1.1], [300, 96, 1],
]

/* El árbol: ramas peladas en silueta casi negra. Cada trazo es una rama; el
   ancho baja del tronco a las ramitas. Nace abajo a la izquierda y abre la
   copa hacia arriba y a la derecha, sobre el cielo. */
const RAMAS = [
  // tronco, de abajo arriba
  { d: 'M34 824 C46 724 40 648 70 566', w: 20 },
  { d: 'M70 566 C84 526 78 476 96 436', w: 15 },
  { d: 'M96 436 C104 406 100 374 112 334', w: 11 },
  // ramas bajas (quedan tras las tarjetas en móvil, se ven en escritorio)
  { d: 'M66 572 C120 544 172 540 234 524', w: 12 },
  { d: 'M234 524 C282 512 318 504 360 490', w: 7 },
  { d: 'M360 490 C376 486 388 484 400 480', w: 3 },
  { d: 'M234 524 C252 526 264 532 278 540', w: 4 },
  { d: 'M86 490 C58 480 42 472 16 456', w: 9 },
  { d: 'M16 456 C8 452 4 448 -2 442', w: 4 },
  { d: 'M96 436 C150 416 198 410 254 394', w: 9 },
  { d: 'M254 394 C294 382 320 372 352 352', w: 5 },
  { d: 'M352 352 C368 344 380 338 394 330', w: 3 },
  { d: 'M254 394 C268 390 278 394 290 390', w: 3 },
  // copa: tres ramas desde la horqueta (112,334) hacia arriba
  { d: 'M112 334 C96 294 82 266 70 224', w: 7 },
  { d: 'M70 224 C62 196 52 174 44 144', w: 4 },
  { d: 'M44 144 C40 126 32 114 26 100', w: 2.5 },
  { d: 'M70 224 C76 204 84 192 94 176', w: 2.5 },
  { d: 'M112 334 C120 290 118 254 126 212', w: 7 },
  { d: 'M126 212 C132 180 140 156 150 126', w: 4 },
  { d: 'M150 126 C154 108 162 96 170 82', w: 2.5 },
  { d: 'M126 212 C120 194 118 180 120 164', w: 2.5 },
  { d: 'M112 334 C150 304 184 290 214 256', w: 7 },
  { d: 'M214 256 C244 224 266 206 292 180', w: 4 },
  { d: 'M292 180 C306 166 318 156 330 144', w: 2.5 },
  { d: 'M214 256 C226 244 238 240 250 232', w: 2.5 },
]

/* Unas pocas ramas con un filo de luz teal, como si la luna las rozara. */
const RAMAS_LUZ = [
  'M96 436 C150 416 198 410 254 394',
  'M112 334 C120 290 118 254 126 212',
  'M112 334 C150 304 184 290 214 256',
  'M66 572 C120 544 172 540 234 524',
]

function chispa(x, y, s) {
  return `M${x} ${y - 9 * s} C${x + 1.5 * s} ${y - 2.5 * s} ${x + 2.5 * s} ${y - 1.5 * s} ${x + 9 * s} ${y} C${x + 2.5 * s} ${y + 1.5 * s} ${x + 1.5 * s} ${y + 2.5 * s} ${x} ${y + 9 * s} C${x - 1.5 * s} ${y + 2.5 * s} ${x - 2.5 * s} ${y + 1.5 * s} ${x - 9 * s} ${y} C${x - 2.5 * s} ${y - 1.5 * s} ${x - 1.5 * s} ${y - 2.5 * s} ${x} ${y - 9 * s} Z`
}

function FondoDescubre() {
  return (
    <div className="fondo-descubre" aria-hidden="true">
      <svg viewBox="0 0 400 820" preserveAspectRatio="xMidYMin slice" focusable="false">
        <defs>
          {/* Temblor de pulso: el mismo recurso de taly-a-mano para que el
              trazo no salga de ordenador. */}
          <filter id="fondo-descubre-pulso" x="-6%" y="-6%" width="112%" height="112%">
            <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="2" seed="5" result="r" />
            <feDisplacementMap in="SourceGraphic" in2="r" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>

          {/* El cielo: apenas más claro arriba y se funde con el fondo de la
              app, para que las ramas negras se lean sin encender la pantalla. */}
          <linearGradient id="fondo-descubre-cielo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#17241f" />
            <stop offset="0.34" stopColor="#141b19" />
            <stop offset="0.52" stopColor="#121413" />
            <stop offset="1" stopColor="#121413" />
          </linearGradient>
          <radialGradient id="fondo-descubre-halo" cx="0.42" cy="0.2" r="0.55">
            <stop offset="0" stopColor="#1f4942" stopOpacity="0.4" />
            <stop offset="1" stopColor="#1f4942" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="400" height="820" fill="url(#fondo-descubre-cielo)" />
        <rect width="400" height="820" fill="url(#fondo-descubre-halo)" />

        {/* Estrellitas: puntitos en el cielo. */}
        <g fill="#BDF4E8" fillOpacity="0.55">
          {ESTRELLAS.map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
          ))}
        </g>

        {/* Nubes de plumón, a tinta clara. */}
        <g filter="url(#fondo-descubre-pulso)" strokeLinejoin="round">
          {NUBES.map((d) => (
            <path key={d} d={d} fill="#BDF4E8" fillOpacity="0.07" stroke="#BDF4E8" strokeOpacity="0.5" strokeWidth="2.4" />
          ))}
        </g>

        {/* Chispas de mostaza, el toque cálido de la paleta de Taly. */}
        <g filter="url(#fondo-descubre-pulso)" fill="#FFD166" fillOpacity="0.75">
          {CHISPAS.map(([x, y, s]) => (
            <path key={`${x}-${y}`} d={chispa(x, y, s)} />
          ))}
        </g>

        {/* El árbol, en primer plano. Silueta casi negra + un filo de luz. */}
        <g filter="url(#fondo-descubre-pulso)" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {RAMAS.map((r) => (
            <path key={r.d} d={r.d} stroke="#090f0e" strokeWidth={r.w} />
          ))}
          {RAMAS_LUZ.map((d) => (
            <path key={d} d={d} stroke="#2AA795" strokeOpacity="0.35" strokeWidth="1.6" transform="translate(-1.5 -1.5)" />
          ))}
        </g>
      </svg>
    </div>
  )
}

export default FondoDescubre
