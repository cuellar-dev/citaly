import { useEffect, useMemo, useRef, useState } from 'react'
import { ALTO, ANCHO, CUERPO, OJO_ABIERTO, OJO_CERRADO, PALETA_PIXEL, PATAS, rectsDe } from './spriteTalyPixel.js'
import './talyPixel.css'

/* Taly en pixel art, posado en la barra de reservar. Vive como Clawd:
   - respira (el cuerpo sube 1 píxel y baja) y parpadea cada pocos segundos;
   - de vez en cuando mira atrás, o da un paseíto por el borde y vuelve;
   - salta cuando tocas Reservar (`saltando`);
   - si el local está cerrado (`dormido`), duerme: ojos cerrados, respiración
     lenta y sin pasear.
   Todo va a saltos de píxel (steps), nada de movimiento suave: es pixel art.
   Con «reducir movimiento» se queda quieto, solo con el parpadeo. */

const PIXEL = 2
/* El paseo: hasta dónde llega (en píxeles del sprite) y cada cuánto da un paso. */
const PASEO_MAX = 12
const PASO_MS = 140

const esperar = (min, max) => min + Math.random() * (max - min)

function sinMovimiento() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function TalyPixel({ dormido = false, saltando = false, className = '' }) {
  const [ojos, setOjos] = useState('abiertos')
  const [patas, setPatas] = useState('quieto')
  const [mirando, setMirando] = useState('derecha')
  const [x, setX] = useState(0)
  const vivo = useRef(true)

  const cuerpo = useMemo(() => rectsDe(CUERPO), [])

  /* Parpadeo: cada 2.5-5.5 s cierra los ojos 130 ms (a veces dos seguidos). */
  useEffect(() => {
    if (dormido) return undefined
    let t
    const siguiente = () => {
      t = setTimeout(() => {
        setOjos('cerrados')
        t = setTimeout(() => {
          setOjos('abiertos')
          if (Math.random() < 0.25) {
            t = setTimeout(() => {
              setOjos('cerrados')
              t = setTimeout(() => {
                setOjos('abiertos')
                siguiente()
              }, 110)
            }, 160)
          } else siguiente()
        }, 130)
      }, esperar(2500, 5500))
    }
    siguiente()
    return () => clearTimeout(t)
  }, [dormido])

  /* Lo que hace cuando está despierto y quieto: mirar atrás o pasear. */
  useEffect(() => {
    vivo.current = true
    if (dormido || sinMovimiento()) {
      return () => {
        vivo.current = false
      }
    }
    const timers = new Set()
    const luego = (fn, ms) => {
      const t = setTimeout(() => {
        timers.delete(t)
        if (vivo.current) fn()
      }, ms)
      timers.add(t)
    }

    /* Anda de `desde` a `hasta` a un píxel por paso, alternando patas. */
    const andar = (desde, hasta, alAcabar) => {
      const dir = Math.sign(hasta - desde)
      let pos = desde
      let paso = 0
      const dar = () => {
        pos += dir
        paso++
        setX(pos)
        setPatas(paso % 2 ? 'pasoA' : 'pasoB')
        if (pos === hasta) {
          luego(() => {
            setPatas('quieto')
            alAcabar()
          }, PASO_MS)
        } else luego(dar, PASO_MS)
      }
      luego(dar, PASO_MS)
    }

    const ciclo = () => {
      luego(() => {
        if (Math.random() < 0.5) {
          /* Mira atrás un momento y vuelve. */
          setMirando('izquierda')
          luego(() => {
            setMirando('derecha')
            ciclo()
          }, esperar(900, 1600))
        } else {
          /* Paseíto: va, se da la vuelta, vuelve y mira al frente. */
          const hasta = Math.round(esperar(6, PASEO_MAX))
          andar(0, hasta, () => {
            luego(() => {
              setMirando('izquierda')
              luego(() => {
                andar(hasta, 0, () => {
                  luego(() => {
                    setMirando('derecha')
                    ciclo()
                  }, 300)
                })
              }, 350)
            }, 500)
          })
        }
      }, esperar(3500, 7000))
    }
    ciclo()
    return () => {
      vivo.current = false
      timers.forEach(clearTimeout)
      /* Si se duerme a media vuelta, vuelve a su sitio mirando al frente. */
      setMirando('derecha')
      setPatas('quieto')
      setX(0)
    }
  }, [dormido])

  const ojosCerrados = dormido || ojos === 'cerrados'
  const pose = saltando ? 'recogidas' : patas
  const clases = [
    'taly-pixel',
    dormido ? 'taly-pixel--dormido' : '',
    saltando ? 'taly-pixel--saltando' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span
      className={clases}
      style={{ '--taly-x': `${x * PIXEL}px`, width: ANCHO * PIXEL, height: ALTO * PIXEL }}
      aria-hidden="true"
    >
      <svg
        className="taly-pixel-svg"
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        width={ANCHO * PIXEL}
        height={ALTO * PIXEL}
        shapeRendering="crispEdges"
        style={mirando === 'izquierda' ? { transform: 'scaleX(-1)' } : undefined}
      >
        <g>
          {PATAS[pose].map((p) => (
            <rect key={`p${p.x}-${p.y}`} x={p.x} y={p.y} width="1" height="1" fill={PALETA_PIXEL[p.c]} />
          ))}
        </g>
        <g className="taly-pixel-cuerpo">
          {cuerpo.map((r) => (
            <rect key={`c${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height="1" fill={PALETA_PIXEL[r.c]} />
          ))}
          {(ojosCerrados ? OJO_CERRADO : OJO_ABIERTO).map((p) => (
            <rect key={`o${p.x}-${p.y}`} x={p.x} y={p.y} width="1" height="1" fill={PALETA_PIXEL[p.c]} />
          ))}
        </g>
      </svg>
    </span>
  )
}

export default TalyPixel
