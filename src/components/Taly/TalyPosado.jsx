import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import RinconTaly, { YerbaDelante } from './RinconTaly.jsx'
import './talyPosado.css'

gsap.registerPlugin(useGSAP)

/* Taly posado en el borde del header, en su rincón.

   No es el Taly de arte.js (ese es una rejilla de bloques animada, demasiado
   para un adorno de 37 px). Este va dibujado a pluma con el mismo temblor que
   el resto de su mundo, y con su paleta.

   El dibujo va en piezas para poder moverlas por separado, como un pájaro de
   verdad:
   - las dos patas, que dan pasos al andar y se recogen al volar;
   - el torso (cuerpo, cabeza, copete, pico), que es lo que se inclina al
     picotear mientras las patas siguen plantadas;
   - el ala, que aletea en el salto.

   Y dos capas de transformación por fuera:
   - la de fuera lleva el SALTO al cartel cuando se abre el menú;
   - la de dentro lleva el PASEO (avanzar y girarse).
   Si compartieran elemento se pisarían las transformaciones. */

const CUERPO =
  'M27 9 C34 9 38 14 39 20 C42 24 43 30 41 35 C38 40 32 43 27 43 C22 43 16 40 13 35 C11 30 12 24 15 20 C16 14 20 9 27 9 Z'
const BARRIGA = 'M27 24 C33 24 37 29 37 34 C37 39 32 42 27 42 C22 42 17 39 17 34 C17 29 21 24 27 24 Z'
const ALA = 'M19 24 C24 23 28 27 28 32 C28 36 25 39 21 38 C17 37 15 32 16 28 C17 26 18 24 19 24 Z'
const COPETE = 'M20 11 C21 5 23 1 26 0 C27 3 28 6 30 9 C31 4 33 -2 37 -3 C39 1 39 6 38 11 C33 13 25 13 20 11 Z'
const PICO = 'M39 19 C43 19 46 21 46 22 C46 23 43 25 39 25 Z'
const PATA_IZQ = 'M22 42 L22 48 M22 48 L19 50 M22 48 L25 50'
const PATA_DER = 'M32 42 L32 48 M32 48 L29 50 M32 48 L35 50'

/* El copete se salía por la derecha de la cabeza: la base iba de 20 a 38 y
   la cabeza a esa altura solo llega a 35. Más pequeño y corrido a la
   izquierda, nace dentro de la cabeza. */
const COPETE_AJUSTE = 'translate(-1.5 0) translate(28 12) scale(0.74) translate(-28 -12)'

/* Puntos de giro, en coordenadas del dibujo (svgOrigin). */
const CADERA_IZQ = '22 42'
const CADERA_DER = '32 42'
const CADERA = '28 41'
const HOMBRO = '25 26'

/* Hasta dónde llega el paseo, en px del header. */
const PASEO_X = 22
const PASEO_DURACION = 2.6
/* Lo que tarda una pata en pasar de atrás a delante (un paso). */
const PASO = 0.38
/* Cuánto se adelanta o se atrasa cada pata desde la vertical. En el dibujo,
   girar en negativo lleva el pie hacia el pico: hacia delante. */
const ZANCADA = 24
/* El salto cae sobre la primera tabla, a esta distancia de su borde
   izquierdo y esta altura por debajo del borde del header. */
const ATERRIZA_X = 125
const ATERRIZA_Y = 5

function TalyPosado({ menuAbierto = false }) {
  const saltoRef = useRef(null)
  const cuerpoRef = useRef(null)
  const torsoRef = useRef(null)
  const alaRef = useRef(null)
  const pataIzqRef = useRef(null)
  const pataDerRef = useRef(null)
  const paseoRef = useRef(null)
  /* El salto en curso. Cada vez que el menú cambia se cancela y se sale
     desde donde esté Taly en ese momento, sea en el suelo, en el aire o en
     la tabla. Sin esto, abrir y cerrar muy rápido lo dejaba en el cartel. */
  const saltoTlRef = useRef(null)

  const suave = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /* El paseo: anda, picotea, se da la vuelta y vuelve. Vive en su propia
     línea de tiempo para poder pausarlo mientras el cartel está abierto. */
  useGSAP(() => {
    const cuerpo = cuerpoRef.current
    const torso = torsoRef.current
    const patas = [pataIzqRef.current, pataDerRef.current]
    if (!cuerpo || !torso || patas.some((p) => !p) || suave()) return undefined

    /* Andar de verdad: mientras una pata va hacia delante la otra va hacia
       atrás, y se cruzan. Sale primero la de delante (la más cercana al
       pico), así que andando a la derecha arranca la derecha. Al girarse,
       el cuerpo entero se voltea y la de delante pasa a ser la izquierda:
       andando a la izquierda arranca la izquierda, sin código aparte.

       Cada pata: medio paso hasta su primer extremo, varios pasos completos
       de un extremo al otro, y medio paso de vuelta a la vertical. */
    const andar = (tl, x) => {
      const pasos = Math.max(2, Math.round(PASEO_DURACION / PASO) - 1)
      const paso = PASEO_DURACION / (pasos + 1)
      /* Con un número par de pasos cada pata acaba en el mismo extremo en
         el que empezó, y de ahí vuelve a cero. */
      const n = pasos % 2 ? pasos - 1 : pasos
      const resto = PASEO_DURACION - paso * n
      const pata = (el, origen, primero) =>
        tl
          .to(el, { rotation: primero, svgOrigin: origen, duration: resto / 2, ease: 'sine.out' }, 'paso')
          .to(el, { rotation: -primero, svgOrigin: origen, duration: paso, ease: 'sine.inOut', repeat: n - 1, yoyo: true }, `paso+=${resto / 2}`)
          .to(el, { rotation: 0, svgOrigin: origen, duration: resto / 2, ease: 'sine.in' }, `paso+=${resto / 2 + paso * n}`)

      tl.addLabel('paso').to(cuerpo, { x, duration: PASEO_DURACION, ease: 'none' }, 'paso')
      pata(patas[1], CADERA_DER, -ZANCADA)
      pata(patas[0], CADERA_IZQ, ZANCADA)
      /* El cuerpo sube un pelo en cada paso (dos veces por ciclo de patas):
         sin esto parece que flota. */
      const botes = 2 * (n + 1)
      tl.to(torso, { y: -1.1, duration: PASEO_DURACION / botes, ease: 'sine.inOut', repeat: botes - 1, yoyo: true }, 'paso')
    }

    /* Picotazo de ave: se inclina todo el torso desde la cadera, rápido al
       bajar y algo más lento al subir. Las patas no se mueven. */
    const picotazo = (tl) =>
      tl
        .to(torso, { rotation: 42, svgOrigin: CADERA, duration: 0.17, ease: 'power2.in' })
        .to(torso, { rotation: 36, svgOrigin: CADERA, duration: 0.06, ease: 'none' })
        .to(torso, { rotation: 0, svgOrigin: CADERA, duration: 0.3, ease: 'power2.out' })

    const tl = gsap.timeline({ repeat: -1 })
    andar(tl, PASEO_X)
    picotazo(tl)
    tl.to({}, { duration: 0.18 })
    picotazo(tl)
    tl.to(cuerpo, { scaleX: -1, transformOrigin: '50% 96%', duration: 0.26, ease: 'power2.inOut' })
    andar(tl, 0)
    picotazo(tl)
    tl.to(cuerpo, { scaleX: 1, transformOrigin: '50% 96%', duration: 0.26, ease: 'power2.inOut' })
    tl.to({}, { duration: 0.9 })

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

  /* El salto al cartel, con aleteo. */
  useGSAP(
    () => {
      const el = saltoRef.current
      const cuerpo = cuerpoRef.current
      const torso = torsoRef.current
      const ala = alaRef.current
      const patas = [pataIzqRef.current, pataDerRef.current]
      if (!el || !cuerpo || !torso || !ala) return

      /* Dónde cae: medido en vivo, porque el rincón se recoloca según los
         iconos de cada pestaña y no hay un número fijo que valga para todas. */
      const destino = () => {
        const cartel = document.querySelector('.menu-tablas')?.getBoundingClientRect()
        const header = el.closest('.app-header')?.getBoundingClientRect()
        const bordeCartel = cartel ? cartel.left : (header?.right ?? 0) - 238
        const base = el.getBoundingClientRect().left - Number(gsap.getProperty(el, 'x'))
        return bordeCartel + ATERRIZA_X - base
      }

      /* Dos aleteos suaves: el ala sube hacia atrás desde el hombro y vuelve.
         Cuatro medias batidas acaban con el ala recogida. */
      const aletear = (tl, en) =>
        tl.to(ala, { rotation: 82, svgOrigin: HOMBRO, duration: 0.13, ease: 'sine.inOut', repeat: 3, yoyo: true }, en)

      /* Las patas se recogen hacia atrás en el aire y se estiran para tocar
         suelo. */
      const recogerPatas = (tl, en) =>
        tl
          .to(patas, { rotation: 30, svgOrigin: (i) => (i ? CADERA_DER : CADERA_IZQ), duration: 0.14, ease: 'power2.out' }, en)
          .to(patas, { rotation: 0, svgOrigin: (i) => (i ? CADERA_DER : CADERA_IZQ), duration: 0.14, ease: 'power2.in' }, `${en}+=0.34`)

      /* Antes de saltar se endereza y se agacha un pelo (anticipación); al
         caer, amortigua. */
      const prepararse = (tl) =>
        tl
          .to(cuerpo, { x: 0, scaleX: 1, duration: 0.14, ease: 'power2.out' }, 0)
          .to(patas, { rotation: 0, duration: 0.1 }, 0)
          .to(torso, { rotation: 0, y: 1.6, duration: 0.12, ease: 'power2.out' }, 0)

      const caer = (tl) =>
        tl.to(torso, { y: 1.4, duration: 0.08, ease: 'power2.out' }).to(torso, { y: 0, duration: 0.2, ease: 'power2.out' })

      /* Ala, patas y torso a su postura de reposo. Si el salto anterior se
         cortó a mitad de aleteo, sin esto el ala se quedaría levantada. */
      const reposo = (tl, en) =>
        tl
          .to(ala, { rotation: 0, svgOrigin: HOMBRO, duration: 0.12, ease: 'power2.out' }, en)
          .to(patas, { rotation: 0, duration: 0.12, ease: 'power2.out' }, en)
          .to(torso, { rotation: 0, y: 0, duration: 0.12, ease: 'power2.out' }, en)

      saltoTlRef.current?.kill()
      saltoTlRef.current = null

      if (menuAbierto) {
        paseoRef.current?.pause()
        const x = destino()
        if (suave()) {
          gsap.set(el, { x, y: ATERRIZA_Y })
          return
        }
        const tl = gsap.timeline()
        saltoTlRef.current = tl
        prepararse(tl)
        tl.addLabel('vuelo', 0.12)
          .to(torso, { y: 0, duration: 0.12 }, 'vuelo')
          .to(el, { x: x * 0.52, y: -17, duration: 0.27, ease: 'power2.out' }, 'vuelo')
          .to(el, { x, y: ATERRIZA_Y, duration: 0.25, ease: 'power1.in' })
        aletear(tl, 'vuelo')
        recogerPatas(tl, 'vuelo')
        caer(tl)
        tl.to(ala, { rotation: 0, duration: 0.1 })
        return
      }

      /* Vuelve a andar desde el principio del paseo: el cuerpo ya está
         derecho y en su sitio, así que no hay salto de postura. */
      const seguirPaseando = () => paseoRef.current?.restart()

      if (suave()) {
        gsap.set(el, { x: 0, y: 0 })
        gsap.set([ala, ...patas, torso], { rotation: 0, y: 0 })
        seguirPaseando()
        return
      }

      const x0 = Number(gsap.getProperty(el, 'x'))
      const y0 = Number(gsap.getProperty(el, 'y'))
      const tl = gsap.timeline({ onComplete: seguirPaseando })
      saltoTlRef.current = tl

      /* Se cerró antes de que despegara (o casi): no hay vuelo que hacer,
         solo volver a su sitio y a su postura. */
      if (Math.abs(x0) < 6) {
        tl.to(el, { x: 0, y: 0, duration: 0.18, ease: 'power2.out' }, 0)
        reposo(tl, 0)
        return
      }

      reposo(tl, 0)
      tl.to(torso, { y: 1.4, duration: 0.1, ease: 'power2.out' })
        .addLabel('vuelo')
        .to(torso, { y: 0, duration: 0.12 }, 'vuelo')
        .to(el, { x: x0 * 0.48, y: Math.min(y0, 0) - 14, duration: 0.25, ease: 'power2.out' }, 'vuelo')
        .to(el, { x: 0, y: 0, duration: 0.24, ease: 'power1.in' })
      aletear(tl, 'vuelo')
      recogerPatas(tl, 'vuelo')
      caer(tl)
      tl.to(ala, { rotation: 0, duration: 0.1 })
    },
    { dependencies: [menuAbierto] },
  )

  return (
    <div className="taly-rincon" aria-hidden="true">
      <RinconTaly />

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
              <g fill="none" stroke="#ffd166" strokeWidth="2" strokeLinecap="round">
                <path ref={pataIzqRef} d={PATA_IZQ} />
                <path ref={pataDerRef} d={PATA_DER} />
              </g>
              <g ref={torsoRef}>
                <path d={COPETE} fill="#ffd166" transform={COPETE_AJUSTE} />
                <path d={CUERPO} fill="#4fd8c4" />
                <path d={BARRIGA} fill="#bdf4e8" />
                <path ref={alaRef} d={ALA} fill="#2aa795" />
                <path d={PICO} fill="#ffd166" />
                <circle cx="33" cy="19" r="2.4" fill="#0e2e2a" />
                <circle cx="33.8" cy="18.2" r="0.7" fill="#f2ebdd" />
              </g>
            </g>
          </svg>
        </span>
      </span>

      <YerbaDelante />
    </div>
  )
}

export default TalyPosado
