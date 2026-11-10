import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import './talyPosado.css'

gsap.registerPlugin(useGSAP)

/* Taly posado en el borde del header, con sus yerbitas.

   No es el Taly de arte.js (ese es una rejilla de bloques animada, demasiado
   para un adorno de 37 px). Este va dibujado a pluma con el mismo temblor que
   el resto de su mundo, y con su paleta.

   Dos capas de transformación a propósito:
   - la de fuera lleva el SALTO al cartel cuando se abre el menú;
   - la de dentro lleva el PASEO (andar, girarse y picotear).
   Si compartieran elemento se pisarían las transformaciones. */

const CUERPO =
  'M27 9 C34 9 38 14 39 20 C42 24 43 30 41 35 C38 40 32 43 27 43 C22 43 16 40 13 35 C11 30 12 24 15 20 C16 14 20 9 27 9 Z'
const BARRIGA = 'M27 24 C33 24 37 29 37 34 C37 39 32 42 27 42 C22 42 17 39 17 34 C17 29 21 24 27 24 Z'
const ALA = 'M19 24 C24 23 28 27 28 32 C28 36 25 39 21 38 C17 37 15 32 16 28 C17 26 18 24 19 24 Z'
const COPETE = 'M20 11 C21 5 23 1 26 0 C27 3 28 6 30 9 C31 4 33 -2 37 -3 C39 1 39 6 38 11 C33 13 25 13 20 11 Z'
const PICO = 'M39 19 C43 19 46 21 46 22 C46 23 43 25 39 25 Z'
const PATAS = 'M22 42 L22 48 M22 48 L19 50 M22 48 L25 50 M32 42 L32 48 M32 48 L29 50 M32 48 L35 50'

/* Mata de yerba: tres o cuatro briznas que salen del mismo punto. */
function mata(x, alto) {
  const a = alto
  return [
    `M${x} 20 C${x - 1} ${20 - a * 0.6} ${x - 3} ${20 - a * 0.85} ${x - 5} ${20 - a}`,
    `M${x} 20 C${x} ${20 - a * 0.7} ${x + 0.5} ${20 - a} ${x + 1} ${20 - a * 1.15}`,
    `M${x} 20 C${x + 1} ${20 - a * 0.6} ${x + 3} ${20 - a * 0.8} ${x + 5} ${20 - a * 0.95}`,
  ]
}

const YERBAS = [
  ...mata(10, 11),
  ...mata(26, 8),
  ...mata(44, 13),
  ...mata(62, 9),
  ...mata(80, 12),
  ...mata(96, 8),
]

/* Hasta dónde llega el paseo y adónde salta cuando se abre el cartel. Los dos
   números son px del header; el salto se ajustó mirando la primera tabla. */
const PASEO_X = 22
const SALTO_X = 95
const SALTO_Y = 14

function TalyPosado({ menuAbierto = false }) {
  const saltoRef = useRef(null)
  const cuerpoRef = useRef(null)
  const paseoRef = useRef(null)

  const suave = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /* El paseo: anda, picotea, se da la vuelta y vuelve. Vive en su propia
     línea de tiempo para poder pausarlo mientras el cartel está abierto. */
  useGSAP(() => {
    const cuerpo = cuerpoRef.current
    if (!cuerpo || suave()) return undefined

    const picotazo = (tl) =>
      tl
        .to(cuerpo, { rotation: 17, duration: 0.2, ease: 'power2.in' })
        .to(cuerpo, { rotation: 0, duration: 0.28, ease: 'power2.out' })

    const tl = gsap.timeline({ repeat: -1, defaults: { transformOrigin: '50% 96%' } })
    tl.to(cuerpo, { x: PASEO_X, duration: 2.6, ease: 'none' })
    picotazo(tl)
    picotazo(tl)
    tl.to(cuerpo, { scaleX: -1, duration: 0.26, ease: 'power2.inOut' })
    tl.to(cuerpo, { x: 0, duration: 2.6, ease: 'none' })
    picotazo(tl)
    tl.to(cuerpo, { scaleX: 1, duration: 0.26, ease: 'power2.inOut' })
    tl.to(cuerpo, { duration: 0.9 })

    paseoRef.current = tl
    return () => {
      tl.kill()
      paseoRef.current = null
    }
  }, [])

  /* Un pájaro andando sin parar en un header fijo gasta batería a cambio de
     nada cuando nadie mira. Si la pestaña se va al fondo, se queda quieto. */
  useEffect(() => {
    const alCambiar = () => {
      const tl = paseoRef.current
      if (!tl) return
      if (document.hidden) tl.pause()
      else if (!menuAbierto) tl.play()
    }
    document.addEventListener('visibilitychange', alCambiar)
    return () => document.removeEventListener('visibilitychange', alCambiar)
  }, [menuAbierto])

  /* El salto al cartel. Dos tramos para que describa un arco: sube con
     ease-out y cae con ease-in, que es como cae algo de verdad. */
  useGSAP(
    () => {
      const el = saltoRef.current
      const cuerpo = cuerpoRef.current
      if (!el || !cuerpo) return

      if (menuAbierto) {
        paseoRef.current?.pause()
        if (suave()) {
          gsap.set(el, { x: SALTO_X, y: SALTO_Y })
          return
        }
        gsap
          .timeline()
          /* Se endereza antes de saltar: si sale girado o mirando al revés,
             aterriza raro sobre la tabla. */
          .to(cuerpo, { x: 0, scaleX: 1, rotation: 0, duration: 0.14, ease: 'power2.out' }, 0)
          .to(el, { x: SALTO_X * 0.52, y: -15, duration: 0.18, ease: 'power2.out' }, 0.04)
          .to(el, { x: SALTO_X, y: SALTO_Y, duration: 0.2, ease: 'power2.in' })
        return
      }

      if (suave()) {
        gsap.set(el, { x: 0, y: 0 })
        paseoRef.current?.play()
        return
      }

      gsap
        .timeline({ onComplete: () => paseoRef.current?.play() })
        .to(el, { x: SALTO_X * 0.48, y: -13, duration: 0.17, ease: 'power2.out' })
        .to(el, { x: 0, y: 0, duration: 0.19, ease: 'power2.in' })
    },
    { dependencies: [menuAbierto] },
  )

  return (
    <div className="taly-rincon" aria-hidden="true">
      <svg className="taly-yerba" viewBox="0 0 106 20" focusable="false">
        <defs>
          <filter id="taly-yerba-pulso" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="5" result="r" />
            <feDisplacementMap in="SourceGraphic" in2="r" scale="1.4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g
          filter="url(#taly-yerba-pulso)"
          fill="none"
          stroke="var(--ink-light, #2aa795)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.42"
        >
          {YERBAS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </svg>

      <span className="taly-posado" ref={saltoRef}>
        <span className="taly-posado-cuerpo" ref={cuerpoRef}>
          <svg viewBox="-2 -6 52 58" focusable="false">
            <defs>
              <filter id="taly-posado-pulso" x="-15%" y="-15%" width="130%" height="130%">
                <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="23" result="r" />
                <feDisplacementMap in="SourceGraphic" in2="r" scale="1.6" xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>

            <g filter="url(#taly-posado-pulso)">
              <path d={PATAS} stroke="#ffd166" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d={COPETE} fill="#ffd166" />
              <path d={CUERPO} fill="#4fd8c4" />
              <path d={BARRIGA} fill="#bdf4e8" />
              <path d={ALA} fill="#2aa795" />
              <path d={PICO} fill="#ffd166" />
              <circle cx="33" cy="19" r="2.4" fill="#0e2e2a" />
              <circle cx="33.8" cy="18.2" r="0.7" fill="#f2ebdd" />
            </g>
          </svg>
        </span>
      </span>
    </div>
  )
}

export default TalyPosado
