import { useEffect, useMemo, useRef } from 'react'
import './talyPixel.css'

/* Taly en pixel art de bloque, de frente: el del formulario de contacto.

   No es el Taly de punto de cruz (arte.js): este es más chato, de píxel
   cuadrado y color plano, para que se lea a 70 px como un sprite. Tiene tres
   caras, una por tipo de mensaje:

   - sugerencia: levanta un ala como quien pide la palabra, mira a la
     bombilla que se le enciende encima;
   - bien:       ojos de felicidad, alas arriba, pico grande y un corazón;
   - queja:      cejas enfadadas, mofletes rojos, pico abierto gritando,
     patas abiertas y vapor saliendo de la cabeza.

   Se pinta como una rejilla fija de rectángulos (la unión de las tres
   caras). Al cambiar de estado no se cambia de dibujo: cada píxel cambia de
   color, fila a fila de arriba abajo, así que Taly se transforma en vez de
   sustituirse. */

const COLORES = {
  B: '#4FD8C4', // cuerpo
  D: '#2AA795', // alas
  L: '#BDF4E8', // barriga
  M: '#FFD166', // copete, pico, patas, casquillo
  O: '#0E2E2A', // ojos, cejas
  K: '#0E2E2A', // boca abierta
  W: '#FFF4C9', // luz de la bombilla
  S: '#8A9490', // rosca de la bombilla
  H: '#FF6B8A', // corazón
  P: '#FF9DB0', // mofletes contentos
  R: '#FF7A6B', // mofletes de enfado
  G: '#A9B4B0', // vapor
}

const CARAS = {
  sugerencia: [
    '............MM..',
    '...........MWWM.',
    '...........MWWM.',
    '............SS..',
    '......MMM.......',
    '..D.BBBBBBBB....',
    '..DDBBBBBBBBB...',
    '...DBBOBBBBOB...',
    '...BBBBBMMBBB...',
    '...BBBBBBBBBBD..',
    '...BBLLLLLLBBD..',
    '...BBLLLLLLBDD..',
    '...BBBLLLLBBD...',
    '....BBBBBBBB....',
    '.....M....M.....',
  ],
  bien: [
    '..........HH.HH.',
    '..........HHHHH.',
    '...........HHH..',
    '............H...',
    '......MMM.......',
    '.D..BBBBBBBB..D.',
    '.DDBBOBBBBOBBDD.',
    '...BOBOBBOBOB...',
    '...BPBBMMBBPB...',
    '...BBBBMMBBBB...',
    '...BBLLLLLLBB...',
    '....BLLLLLLB....',
    '....BBLLLLBB....',
    '.....BBBBBB.....',
    '.....M....M.....',
  ],
  queja: [
    '..........G..G..',
    '.........G..G...',
    '..........G..G..',
    '.........G..G...',
    '......MMM.......',
    '....BBBBBBBB....',
    '...BOBBBBBBOB...',
    '...BBOBBBBOBB...',
    '...RBBBMMBBBR...',
    '..DBBBBKKBBBBD..',
    '..DBBLLLLLLBBD..',
    '..DDBLLLLLLBDD..',
    '...DBBLLLLBBD...',
    '....BBBBBBBB....',
    '....M......M....',
  ],
}

const FILAS = 15
const COLUMNAS = 16

/* La rejilla común: todas las celdas que alguna cara pinta. Se calcula una
   vez al cargar el módulo. */
const CELDAS = (() => {
  const out = []
  for (let f = 0; f < FILAS; f++) {
    for (let c = 0; c < COLUMNAS; c++) {
      if (Object.values(CARAS).some((cara) => cara[f][c] !== '.')) out.push({ f, c })
    }
  }
  return out
})()

/* Saltito al cambiar de cara: se agacha, salta y cae. Con la API de
   animaciones y no con una key: una key volvería a montar los píxeles y se
   perdería la transición de color, que es justo lo que hace la gracia. */
const SALTO = [
  { transform: 'translateY(0) scale(1, 1)' },
  { transform: 'translateY(0) scale(1.08, 0.88)', offset: 0.2 },
  { transform: 'translateY(-2px) scale(0.95, 1.06)', offset: 0.5 },
  { transform: 'translateY(0) scale(1, 1)' },
]

function TalyPixel({ estado = 'sugerencia', className = '' }) {
  const cara = CARAS[estado] || CARAS.sugerencia
  const cuerpoRef = useRef(null)
  const primeraRef = useRef(true)

  useEffect(() => {
    if (primeraRef.current) {
      primeraRef.current = false
      return
    }
    const g = cuerpoRef.current
    if (!g?.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    g.animate(SALTO, { duration: 460, easing: 'steps(6, end)' })
  }, [estado])

  const pixeles = useMemo(
    () =>
      CELDAS.map(({ f, c }) => {
        const clave = cara[f][c]
        return { f, c, clave, color: COLORES[clave] || 'transparent' }
      }),
    [cara],
  )

  return (
    <svg
      className={`taly-pixel taly-pixel--${estado} ${className}`.trim()}
      viewBox={`0 0 ${COLUMNAS} ${FILAS}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      <g className="taly-pixel-cuerpo" ref={cuerpoRef}>
        {pixeles.map(({ f, c, clave, color }) => (
          <rect
            key={`${f}-${c}`}
            className={`taly-pixel-px taly-pixel-px--${clave === '.' ? 'vacio' : clave}`}
            x={c}
            y={f}
            /* Un pelo más grande que la celda: sin esto, el antialiasing deja
               rendijas entre píxeles vecinos a algunos tamaños. */
            width="1.02"
            height="1.02"
            style={{ fill: color, '--f': f }}
          />
        ))}
      </g>
    </svg>
  )
}

export default TalyPixel
