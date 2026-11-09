import { useEffect, useMemo, useState } from 'react'
import './cieloDescubre.css'

/* Fondo de Descubre: el mismo cielo del TimelineTurno de Mi Negocio, pero
   atado a la hora real del día en vez de al turno de un local.
   Es estático: solo se repinta cuando cambia la hora, así que no cuesta nada.
   El SVG no se ve como una ilustración, se ve como ambiente detrás de todo. */

const SIERRA = 'M0 150 L0 112 Q 34 92 70 106 T 138 98 Q 168 90 196 100 T 262 92 Q 300 82 330 98 T 360 96 L360 150 Z'
const LOMA = 'M0 150 Q 60 126 132 138 Q 216 152 288 132 Q 330 120 360 128 L360 170 L0 170 Z'

const ESTRELLAS = [
  [28, 20, 1.1], [63, 44, 0.8], [96, 13, 1], [131, 33, 0.7], [160, 9, 0.85],
  [208, 17, 1.15], [247, 43, 0.8], [279, 11, 0.9], [312, 35, 1.05], [341, 19, 0.7],
  [14, 58, 0.7], [352, 62, 0.85], [186, 52, 0.65], [120, 62, 0.75],
]

/* Las mismas paradas de color que TimelineTurno, repartidas en el día entero. */
const CIELO = [
  { h: 0, color: '#0e171a' },
  { h: 6, color: '#13302f' },
  { h: 9, color: '#0d3d37' },
  { h: 13, color: '#35311f' },
  { h: 18, color: '#3b1828' },
  { h: 21, color: '#0e171a' },
  { h: 24, color: '#0e171a' },
]

function hexARgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function mezclar(a, b, t) {
  const ca = hexARgb(a)
  const cb = hexARgb(b)
  return `rgb(${ca.map((v, i) => Math.round(v + (cb[i] - v) * t)).join(', ')})`
}

function colorDelCielo(hora) {
  for (let i = 0; i < CIELO.length - 1; i++) {
    const a = CIELO[i]
    const b = CIELO[i + 1]
    if (hora <= b.h) return mezclar(a.color, b.color, (hora - a.h) / (b.h - a.h || 1))
  }
  return CIELO[CIELO.length - 1].color
}

const limitar = (v, min = 0, max = 1) => Math.min(Math.max(v, min), max)

function CieloDescubre() {
  const [hora, setHora] = useState(() => {
    const d = new Date()
    return d.getHours() + d.getMinutes() / 60
  })

  /* Un repintado cada cinco minutos basta para que el cielo acompañe al día. */
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date()
      setHora(d.getHours() + d.getMinutes() / 60)
    }, 300000)
    return () => clearInterval(id)
  }, [])

  const escena = useMemo(() => {
    /* De noche (antes de las 6, después de las 20) sale la luna. */
    const esNoche = hora < 6 || hora >= 20
    /* El astro recorre el arco entre su salida y su puesta. */
    const inicio = esNoche ? 20 : 6
    const largo = esNoche ? 10 : 14
    const t = limitar(((hora - inicio + 24) % 24) / largo)
    return {
      esNoche,
      /* Arco: sale por la izquierda, culmina arriba y se pone por la derecha. */
      x: 30 + t * 300,
      y: 118 - Math.sin(t * Math.PI) * 82,
      noche: esNoche ? 1 : limitar((hora - 18) / 2) || limitar((7 - hora) / 2),
      cielo: colorDelCielo(hora),
    }
  }, [hora])

  return (
    <div className="cielo-descubre" aria-hidden="true">
      <svg viewBox="0 0 360 170" preserveAspectRatio="xMidYMax slice" focusable="false">
        <defs>
          <linearGradient id="cielo-descubre-fondo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={escena.cielo} />
            <stop offset="0.82" stopColor="#121413" />
          </linearGradient>
          <radialGradient id="cielo-descubre-halo">
            <stop offset="0" stopColor={escena.esNoche ? '#7fd8ce' : '#ffd166'} stopOpacity="0.4" />
            <stop offset="1" stopColor={escena.esNoche ? '#7fd8ce' : '#ffd166'} stopOpacity="0" />
          </radialGradient>
          <mask id="cielo-descubre-luna" maskUnits="userSpaceOnUse" x="-20" y="-20" width="40" height="40">
            <rect x="-20" y="-20" width="40" height="40" fill="white" />
            <circle cx={escena.esNoche ? 7 : 24} cy="-4" r="8.5" fill="black" />
          </mask>
        </defs>

        <rect width="360" height="170" fill="url(#cielo-descubre-fondo)" />

        <g className="cielo-descubre-estrellas" opacity={escena.noche.toFixed(2)}>
          {ESTRELLAS.map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
          ))}
        </g>

        <g className="cielo-descubre-nubes" opacity={escena.esNoche ? 0.25 : 0.5}>
          <g transform="translate(74 34)">
            <ellipse cx="0" cy="0" rx="19" ry="5" />
            <ellipse cx="9" cy="-4" rx="11" ry="5" />
          </g>
          <g transform="translate(282 56)">
            <ellipse cx="0" cy="0" rx="15" ry="4" />
            <ellipse cx="-7" cy="-3" rx="9" ry="4" />
          </g>
        </g>

        <g transform={`translate(${escena.x.toFixed(1)} ${escena.y.toFixed(1)})`}>
          <circle r="30" fill="url(#cielo-descubre-halo)" />
          {!escena.esNoche && (
            <g className="cielo-descubre-rayos">
              {Array.from({ length: 8 }, (_, i) => {
                const a = (i * Math.PI) / 4
                return (
                  <line
                    key={i}
                    x1={(Math.cos(a) * 12).toFixed(2)}
                    y1={(Math.sin(a) * 12).toFixed(2)}
                    x2={(Math.cos(a) * 17).toFixed(2)}
                    y2={(Math.sin(a) * 17).toFixed(2)}
                  />
                )
              })}
            </g>
          )}
          <circle
            r="8.5"
            fill={escena.esNoche ? '#ece9df' : '#ffd166'}
            mask={escena.esNoche ? 'url(#cielo-descubre-luna)' : undefined}
          />
        </g>

        <path d={SIERRA} className="cielo-descubre-sierra" />
        <path d={LOMA} className="cielo-descubre-loma" />

        <g transform="translate(46 140) scale(0.8)">
          <g className="cielo-descubre-palma">
            <path d="M0 0 Q 3 -13 1 -27" className="cielo-descubre-tronco" />
            <path d="M1 -27 Q 10 -31 17 -24 M1 -27 Q -8 -32 -15 -25 M1 -27 Q 8 -36 14 -37 M1 -27 Q -5 -36 -12 -36 M1 -27 Q 2 -34 0 -40" />
          </g>
        </g>
        <g transform="translate(318 146) scale(0.62)">
          <g className="cielo-descubre-palma">
            <path d="M0 0 Q -3 -13 -1 -27" className="cielo-descubre-tronco" />
            <path d="M-1 -27 Q -10 -31 -17 -24 M-1 -27 Q 8 -32 15 -25 M-1 -27 Q -8 -36 -14 -37 M-1 -27 Q 5 -36 12 -36" />
          </g>
        </g>
      </svg>
    </div>
  )
}

export default CieloDescubre
