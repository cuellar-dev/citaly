import { useId, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import './timelineTurno.css'

gsap.registerPlugin(useGSAP)

/* La loma por donde camina el astro. Inicio y fin a la misma altura: el turno sale y se pone. */
const RUTA = 'M24 136 C 92 136, 110 40, 180 40 S 268 136, 336 136'
const MACIZO = 'M0 150 Q 12 138 24 136 C 92 136, 110 40, 180 40 S 268 136, 336 136 Q 348 138 360 150 L360 170 L0 170 Z'
const SIERRA_FONDO =
  'M0 150 L0 112 Q 34 92 70 106 T 138 98 Q 168 90 196 100 T 262 92 Q 300 82 330 98 T 360 96 L360 150 Z'

const ESTRELLAS = [
  [34, 22, 1.1], [62, 48, 0.8], [90, 14, 1], [124, 34, 0.7], [152, 10, 0.8], [212, 18, 1.2],
  [244, 46, 0.8], [276, 12, 0.9], [304, 36, 1.1], [336, 20, 0.7], [16, 60, 0.7], [350, 64, 0.9],
]

const AVES = [
  { y: 54, escala: 1, duracion: 21, inicio: 0.15 },
  { y: 40, escala: 0.75, duracion: 26, inicio: 0.55 },
  { y: 66, escala: 0.6, duracion: 31, inicio: 0.85 },
]

/* Tinte del cielo según avanza el turno: mañana verde agua, mediodía cálido, tarde rosa, noche. */
const CIELO = [
  { p: 0, color: '#0d3d37' },
  { p: 45, color: '#35311f' },
  { p: 76, color: '#3b1828' },
  { p: 100, color: '#0e171a' },
]

const SOL = '#ffd166'
const LUNA = '#ece9df'
const HALO_SOL = '#ffd166'
const HALO_LUNA = '#7fd8ce'
const ESTELA = [
  { p: 0, color: '#00c2ad' },
  { p: 50, color: '#ffd166' },
  { p: 100, color: '#ef476f' },
]

const limitar = (v, min = 0, max = 1) => Math.min(Math.max(v, min), max)

function hexARgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function mezclar(a, b, t) {
  const ca = hexARgb(a)
  const cb = hexARgb(b)
  const c = ca.map((v, i) => Math.round(v + (cb[i] - v) * t))
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
}

function colorEn(paradas, p) {
  for (let i = 0; i < paradas.length - 1; i++) {
    const a = paradas[i]
    const b = paradas[i + 1]
    if (p <= b.p) return mezclar(a.color, b.color, (p - a.p) / (b.p - a.p || 1))
  }
  return paradas[paradas.length - 1].color
}

/* Cuánto es luna (0 sol pleno, 1 luna creciente) y cuánta noche hay en el cielo. */
const faseLuna = (p) => limitar((p - 60) / 28)
const faseNoche = (p) => limitar((p - 55) / 35)
const faseDia = (p) => 1 - limitar((p - 62) / 20)

function TimelineTurno({ porcentaje, inicioMin, finMin, enCurso, horaTexto, aperturaTexto, cierreTexto, mitadTexto }) {
  const id = useId().replace(/:/g, '')
  const raizRef = useRef(null)
  const rutaRef = useRef(null)
  const estelaRef = useRef(null)
  const astroRef = useRef(null)
  const nucleoRef = useRef(null)
  const sombraRef = useRef(null)
  const rayosRef = useRef(null)
  const haloRef = useRef(null)
  const haloColorRef = useRef(null)
  const craterRef = useRef(null)
  const cieloRef = useRef(null)
  const estrellasRef = useRef(null)
  const avesRef = useRef(null)
  const nubesRef = useRef(null)
  const etiquetaRef = useRef(null)
  const etiquetaFondoRef = useRef(null)
  const marcasRef = useRef([])

  const total = Math.max(finMin - inicioMin, 1)
  const marcas = []
  for (let m = Math.ceil(inicioMin / 60) * 60; m < finMin; m += 60) {
    if (m > inicioMin) marcas.push(((m - inicioMin) / total) * 100)
  }

  useGSAP(
    () => {
      const ruta = rutaRef.current
      if (!ruta) return
      const largo = ruta.getTotalLength()
      const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      marcasRef.current.forEach((marca, i) => {
        if (!marca) return
        const pt = ruta.getPointAtLength((largo * marcas[i]) / 100)
        marca.setAttribute('cx', pt.x.toFixed(2))
        marca.setAttribute('cy', pt.y.toFixed(2))
      })

      const pintar = (p) => {
        const pt = ruta.getPointAtLength((largo * p) / 100)
        const luna = faseLuna(p)
        gsap.set(astroRef.current, { x: pt.x, y: pt.y })
        estelaRef.current.style.strokeDasharray = `${p} 100`
        nucleoRef.current.setAttribute('fill', mezclar(SOL, LUNA, luna))
        sombraRef.current.setAttribute('cx', (24 - luna * 17).toFixed(2))
        gsap.set(rayosRef.current, { opacity: 1 - luna, scale: 1 - luna * 0.5, transformOrigin: '50% 50%' })
        craterRef.current.setAttribute('opacity', (luna * 0.55).toFixed(2))
        haloColorRef.current.setAttribute('stop-color', mezclar(HALO_SOL, HALO_LUNA, luna))
        cieloRef.current.setAttribute('stop-color', colorEn(CIELO, p))
        estrellasRef.current.setAttribute('opacity', faseNoche(p).toFixed(2))
        avesRef.current.setAttribute('opacity', faseDia(p).toFixed(2))
        nubesRef.current.setAttribute('opacity', (0.35 + faseDia(p) * 0.4).toFixed(2))

        const colorEstela = colorEn(ESTELA, p)
        etiquetaFondoRef.current.setAttribute('stroke', colorEstela)
        gsap.set(etiquetaRef.current, { x: limitar(pt.x, 52, 308), y: pt.y - 30, color: colorEstela })
        marcasRef.current.forEach((marca, i) => {
          marca?.classList.toggle('timeline-turno-marca--pasada', marcas[i] <= p)
        })
      }

      if (reducir) {
        pintar(porcentaje)
        return
      }

      pintar(0)
      const proxy = { p: 0 }
      gsap.to(proxy, {
        p: porcentaje,
        duration: 1.9,
        delay: 0.3,
        ease: 'power2.inOut',
        onUpdate: () => pintar(proxy.p),
      })

      gsap.to(rayosRef.current, { rotation: 360, transformOrigin: '50% 50%', duration: 48, repeat: -1, ease: 'none' })
      gsap.to(haloRef.current, {
        scale: 1.14,
        transformOrigin: '50% 50%',
        duration: 2.6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.utils.toArray('.timeline-turno-ave', avesRef.current).forEach((ave, i) => {
        const datos = AVES[i]
        gsap.set(ave, { y: datos.y, scale: datos.escala })
        gsap
          .fromTo(ave, { x: -24 }, { x: 384, duration: datos.duracion, repeat: -1, ease: 'none' })
          .progress(datos.inicio)
        gsap.to(ave, { y: datos.y - 6, duration: 2.2 + i, repeat: -1, yoyo: true, ease: 'sine.inOut' })
        gsap.to(ave.querySelector('path'), {
          scaleY: -0.55,
          transformOrigin: '50% 50%',
          duration: 0.26 + i * 0.05,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      })

      gsap.utils.toArray('.timeline-turno-nube', nubesRef.current).forEach((nube, i) => {
        gsap.to(nube, { x: i ? -22 : 26, duration: 16 + i * 6, repeat: -1, yoyo: true, ease: 'sine.inOut' })
      })

      gsap.to(estrellasRef.current.children, {
        opacity: 0.25,
        duration: 1.4,
        ease: 'sine.inOut',
        stagger: { each: 0.35, repeat: -1, yoyo: true },
      })

      gsap.to('.timeline-turno-palma', {
        rotation: 3,
        transformOrigin: '50% 100%',
        duration: 3.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })
    },
    { scope: raizRef, dependencies: [porcentaje, inicioMin, finMin] }
  )

  return (
    <div className="timeline-turno" ref={raizRef}>
      <svg
        className="timeline-turno-svg"
        viewBox="0 0 360 170"
        role="img"
        aria-label={`Turno de ${aperturaTexto} a ${cierreTexto}. ${Math.round(porcentaje)}% recorrido.`}
      >
        <defs>
          <linearGradient id={`${id}-cielo`} x1="0" y1="0" x2="0" y2="1">
            <stop ref={cieloRef} offset="0" stopColor={CIELO[0].color} />
            <stop offset="0.85" stopColor="#121413" />
          </linearGradient>
          <linearGradient id={`${id}-estela`} gradientUnits="userSpaceOnUse" x1="24" y1="0" x2="336" y2="0">
            <stop offset="0" stopColor="#00c2ad" />
            <stop offset="0.5" stopColor="#ffd166" />
            <stop offset="1" stopColor="#ef476f" />
          </linearGradient>
          <linearGradient id={`${id}-macizo`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1d2725" />
            <stop offset="0.7" stopColor="#141817" />
          </linearGradient>
          <radialGradient id={`${id}-halo`}>
            <stop ref={haloColorRef} offset="0" stopColor={HALO_SOL} stopOpacity="0.5" />
            <stop offset="1" stopColor={HALO_SOL} stopOpacity="0" />
          </radialGradient>
          <mask id={`${id}-luna`} maskUnits="userSpaceOnUse" x="-20" y="-20" width="40" height="40">
            <rect x="-20" y="-20" width="40" height="40" fill="white" />
            <circle ref={sombraRef} cx="24" cy="-4" r="9.5" fill="black" />
          </mask>
        </defs>

        <rect width="360" height="170" fill={`url(#${id}-cielo)`} />

        <g ref={estrellasRef} opacity="0">
          {ESTRELLAS.map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} className="timeline-turno-estrella" />
          ))}
        </g>

        <g ref={nubesRef} opacity="0.7">
          <g className="timeline-turno-nube" transform="translate(70 30)">
            <ellipse cx="0" cy="0" rx="18" ry="5" />
            <ellipse cx="8" cy="-4" rx="10" ry="5" />
          </g>
          <g className="timeline-turno-nube" transform="translate(268 58)">
            <ellipse cx="0" cy="0" rx="14" ry="4" />
            <ellipse cx="-6" cy="-3" rx="8" ry="4" />
          </g>
        </g>

        <g ref={avesRef}>
          {AVES.map((ave) => (
            <g key={ave.y} className="timeline-turno-ave">
              <path d="M-7 -3 Q-3.5 -1 0 1 Q3.5 -1 7 -3" />
            </g>
          ))}
        </g>

        <path d={SIERRA_FONDO} className="timeline-turno-sierra" />
        <path d={MACIZO} fill={`url(#${id}-macizo)`} />

        <text x="180" y="62" textAnchor="middle" className="timeline-turno-cima">
          {mitadTexto}
        </text>

        <path ref={rutaRef} d={RUTA} pathLength="100" className="timeline-turno-pista" />
        {marcas.map((m, i) => (
          <circle
            key={m}
            r="1.7"
            className="timeline-turno-marca"
            ref={(el) => {
              marcasRef.current[i] = el
            }}
          />
        ))}
        <path
          ref={estelaRef}
          d={RUTA}
          pathLength="100"
          stroke={`url(#${id}-estela)`}
          className="timeline-turno-estela"
          style={{ strokeDasharray: `${porcentaje} 100` }}
        />

        <circle cx="24" cy="136" r="3.5" className="timeline-turno-base timeline-turno-base--abre" />
        <circle cx="336" cy="136" r="3.5" className="timeline-turno-base timeline-turno-base--cierra" />

        <path d="M0 170 L0 156 Q 46 144 98 156 Q 124 162 150 170 Z" className="timeline-turno-loma" />
        <path d="M232 170 Q 284 150 360 154 L360 170 Z" className="timeline-turno-loma" />
        <g transform="translate(104 159) scale(0.78)">
          <g className="timeline-turno-palma">
            <path d="M0 0 Q 3 -12 1 -25" className="timeline-turno-palma-tronco" />
            <path d="M1 -25 Q 9 -29 16 -22 M1 -25 Q -7 -30 -14 -23 M1 -25 Q 7 -34 13 -35 M1 -25 Q -4 -34 -11 -34 M1 -25 Q 2 -32 0 -38" />
          </g>
        </g>
        <g transform="translate(266 160) scale(0.62)">
          <g className="timeline-turno-palma">
            <path d="M0 0 Q -3 -12 -1 -25" className="timeline-turno-palma-tronco" />
            <path d="M-1 -25 Q -9 -29 -16 -22 M-1 -25 Q 7 -30 14 -23 M-1 -25 Q -7 -34 -13 -35 M-1 -25 Q 4 -34 11 -34" />
          </g>
        </g>

        <g ref={astroRef} transform="translate(24 136)">
          <circle ref={haloRef} r="30" fill={`url(#${id}-halo)`} />
          <g ref={rayosRef} className="timeline-turno-rayos">
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i * Math.PI) / 4
              return (
                <line
                  key={i}
                  x1={(Math.cos(a) * 13).toFixed(2)}
                  y1={(Math.sin(a) * 13).toFixed(2)}
                  x2={(Math.cos(a) * 18).toFixed(2)}
                  y2={(Math.sin(a) * 18).toFixed(2)}
                />
              )
            })}
          </g>
          <circle ref={nucleoRef} r="9" fill={SOL} mask={`url(#${id}-luna)`} />
          <g ref={craterRef} opacity="0" className="timeline-turno-crateres" mask={`url(#${id}-luna)`}>
            <circle cx="-4" cy="2" r="1.6" />
            <circle cx="-2" cy="-5" r="1.1" />
            <circle cx="-6" cy="-2" r="0.9" />
          </g>
        </g>

        {enCurso && (
          <g ref={etiquetaRef} className="timeline-turno-ahora">
            <rect ref={etiquetaFondoRef} x="-46" y="-10" width="92" height="18" rx="9" />
            <text x="0" y="2.5" textAnchor="middle">
              Ahora · {horaTexto}
            </text>
          </g>
        )}
        {!enCurso && (
          <g ref={etiquetaRef} className="timeline-turno-ahora timeline-turno-ahora--fuera">
            <rect ref={etiquetaFondoRef} x="-30" y="-10" width="60" height="18" rx="9" />
            <text x="0" y="2.5" textAnchor="middle">
              {horaTexto}
            </text>
          </g>
        )}
      </svg>

      <div className="timeline-turno-horas">
        <span className="timeline-turno-hora timeline-turno-hora--abre">
          <strong>{aperturaTexto}</strong>
          Abre
        </span>
        <span className="timeline-turno-hora timeline-turno-hora--cierra">
          <strong>{cierreTexto}</strong>
          Cierra
        </span>
      </div>
    </div>
  )
}

export default TimelineTurno
