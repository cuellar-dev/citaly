import { useEffect, useMemo, useState } from 'react'
import './taly.css'
import {
  CELDA,
  ESCENAS,
  ENCUADRE,
  construirBase,
  construirDetalle,
  listaPatrones,
  saltoEnUnidades,
} from './arte'

// La silueta y los patrones son siempre los mismos, asi que se calculan una
// vez al cargar el modulo y no en cada render.
const BASE = construirBase()
const PATRONES = listaPatrones()

function useMovimientoReducido() {
  const [reducido, setReducido] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const consulta = window.matchMedia('(prefers-reduced-motion: reduce)')
    const alCambiar = (e) => setReducido(e.matches)
    consulta.addEventListener('change', alCambiar)
    return () => consulta.removeEventListener('change', alCambiar)
  }, [])

  return reducido
}

/**
 * Reproduce una escena y devuelve el fotograma actual.
 * Se usa una cadena de setTimeout en vez de un intervalo porque cada
 * fotograma dura lo suyo: el parpadeo 130 ms y la pose de reposo 900.
 */
function useEscena(escena, activa) {
  // El fotograma se guarda junto al nombre de la escena a la que pertenece.
  // Asi, al cambiar de escena, el indice vuelve a cero durante el render, sin
  // tener que reiniciarlo desde el efecto, que dispararia un render de mas.
  const [marca, setMarca] = useState({ escena, indice: 0 })
  const indice = marca.escena === escena ? marca.indice : 0

  useEffect(() => {
    if (!activa || !ESCENAS[escena]) return undefined

    const pasos = ESCENAS[escena]
    let i = 0
    let temporizador
    const siguiente = () => {
      temporizador = setTimeout(() => {
        i = (i + 1) % pasos.length
        setMarca({ escena, indice: i })
        siguiente()
      }, pasos[i].ms)
    }
    siguiente()

    return () => clearTimeout(temporizador)
  }, [escena, activa])

  return indice
}

/**
 * Taly, la mascota de Citaly.
 *
 *   <Taly escena='loader' tamano={28} />
 *   <Taly escena='vacio' tamano={56} />
 *   <Taly escena='confirmacion' tamano={72} brillo />
 *   <Taly pose='dormido' objetos={['sueno']} />        pose fija, sin animar
 *
 * escena:  hero | loader | vacio | confirmacion | recordatorio | mensajero
 * pose:    si se pasa, manda sobre la escena y queda quieto
 * tamano:  alto de celda en px; el ancho sale de la proporcion de la celda
 * brillo:  halo menta alrededor, solo tiene sentido sobre fondo oscuro
 */
function Taly({
  escena = 'hero',
  pose,
  objetos,
  tamano = 40,
  brillo = false,
  animar = true,
  encuadre = 'completo',
  className = '',
  titulo = 'Taly, la mascota de Citaly',
}) {
  const movimientoReducido = useMovimientoReducido()
  // Con una pose fija, o si el sistema pide menos movimiento, no se anima.
  const animando = animar && !pose && !movimientoReducido && Boolean(ESCENAS[escena])
  const indice = useEscena(escena, animando)

  const fotograma = useMemo(() => {
    if (pose) return { pose, bob: 0, objetos }
    const pasos = ESCENAS[escena]
    if (!pasos) return { pose: 'reposo', bob: 0, objetos }
    return pasos[animando ? indice : 0]
  }, [pose, objetos, escena, animando, indice])

  const detalle = useMemo(
    () => construirDetalle(fotograma.pose, fotograma.objetos),
    [fotograma],
  )

  const marco = ENCUADRE[encuadre] || ENCUADRE.completo
  const salto = saltoEnUnidades(fotograma.bob)
  const escala = tamano / CELDA.alto
  const ancho = marco.ancho * escala
  const alto = marco.alto * escala

  return (
    <svg
      className={`taly ${brillo ? 'taly--brillo' : ''} ${className}`.trim()}
      viewBox={`${marco.x} ${marco.y} ${marco.ancho} ${marco.alto}`}
      width={ancho}
      height={alto}
      preserveAspectRatio='xMidYMid meet'
      shapeRendering='crispEdges'
      role='img'
      aria-label={titulo}
      style={{
        width: '100%',
        height: 'auto',
        maxWidth: `${ancho}px`,
        ...(brillo ? { '--taly-halo': `${Math.max(5, tamano * 0.22)}px` } : {}),
      }}
    >
      <title>{titulo}</title>
      <defs>
        {PATRONES.map((p) => (
          <pattern
            key={p.id}
            id={p.id}
            patternUnits='userSpaceOnUse'
            width={p.tile}
            height={p.tile}
          >
            {p.puntos.map((punto, i) => (
              <rect
                key={i}
                x={punto.x}
                y={punto.y}
                width={p.punto}
                height={p.punto}
                fill={p.color}
              />
            ))}
          </pattern>
        ))}
      </defs>

      <g transform={`translate(0,${salto})`}>
        {BASE.map((r, i) => (
          <rect key={`b${i}`} x={r.x} y={r.y} width={r.width} height={r.height} fill={r.fill} />
        ))}
        {detalle.map((r, i) => (
          <rect key={`d${i}`} x={r.x} y={r.y} width={r.width} height={r.height} fill={r.fill} />
        ))}
      </g>
    </svg>
  )
}

export default Taly
