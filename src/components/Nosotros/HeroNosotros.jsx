import { useLayoutEffect, useRef } from 'react'
import { CON_MOVIMIENTO, CON_RATON, gsap, useGSAP } from './gsapNosotros.js'
import TalyTinta from './TalyTinta.jsx'
import IconoTinta from './IconosTinta.jsx'
import { aletear, modoVuelo, parpadear, parte, picotear } from './talyMovimientos.js'
import { TINTA as T } from './tinta.js'
import './heroNosotros.css'

/* Portada de Sobre nosotros: CITALY en grande, rodeado del mundo de la app
   dibujado a tinta, y Taly que llega volando y se posa en la T.

   Al bajar, la portada se queda clavada y explota hacia fuera: los objetos
   salen disparados hacia la cámara (cada uno a su profundidad), las letras se
   abren desde el centro y Taly levanta el vuelo hacia el capítulo siguiente.

   Capas de cada objeto, de fuera adentro, para que nadie pise a nadie:
   [data-orbita] scroll · .orbita-raton ratón · .orbita-in entrada · .orbita-flota CSS */

const LETRAS = ['C', 'I', 'T', 'A', 'L', 'Y']

/* x / y en % de la portada; d = profundidad (cuánto sale disparado). */
const ORBITA = [
  { n: 'calendario', x: 13, y: 22, s: 1.1, r: -10, d: 1.2 },
  { n: 'reloj', x: 84, y: 19, s: 0.95, r: 8, d: 0.95 },
  { n: 'sobre', x: 88, y: 60, s: 1, r: -6, d: 1.3 },
  { n: 'pin', x: 21, y: 74, s: 0.95, r: 6, d: 1 },
  { n: 'tijeras', x: 6, y: 50, s: 0.8, r: -18, d: 0.75 },
  { n: 'taza', x: 71, y: 82, s: 0.9, r: 10, d: 1.1 },
  { n: 'campana', x: 39, y: 13, s: 0.72, r: 12, d: 0.6 },
  { n: 'plato', x: 52, y: 87, s: 0.82, r: -4, d: 0.85 },
  { n: 'pluma', x: 64, y: 11, s: 0.78, r: 24, d: 0.7 },
  { n: 'ticket', x: 34, y: 88, s: 0.78, r: -12, d: 0.9 },
]

function HeroNosotros() {
  const raizRef = useRef(null)
  const palabraRef = useRef(null)
  const letraTRef = useRef(null)
  const anclaRef = useRef(null)
  const vueloRef = useRef(null)

  /* Taly se posa encima de la T. Se mide con offsetLeft/Top, que no se ven
     afectados por las transformaciones de las letras, y se vuelve a medir si
     cambia la fuente o el tamaño. */
  useLayoutEffect(() => {
    const t = letraTRef.current
    const a = anclaRef.current
    const palabra = palabraRef.current
    if (!t || !a || !palabra) return undefined
    const colocar = () => {
      a.style.left = `${t.offsetLeft + t.offsetWidth / 2}px`
      a.style.top = `${t.offsetTop}px`
    }
    colocar()
    const ro = new ResizeObserver(colocar)
    ro.observe(t)
    ro.observe(palabra)
    return () => ro.disconnect()
  }, [])

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add(CON_MOVIMIENTO, () => {
        const svg = vueloRef.current.querySelector('svg')
        const letras = gsap.utils.toArray('[data-letra]')
        const letrasIn = gsap.utils.toArray('.nos-hero-letra-in')
        const orbita = gsap.utils.toArray('[data-orbita]')
        const orbitaIn = gsap.utils.toArray('.orbita-in')

        const aleteo = aletear(svg)
        const ocioso = gsap.timeline({ repeat: -1, repeatDelay: 4.2, paused: true })
        ocioso.add(picotear(svg)).add(picotear(svg), '+=0.12')
        const parpadeo = parpadear(svg)

        /* ENTRADA: letras que saltan, objetos que brotan desde el centro y
           Taly que entra en picado desde arriba a la derecha. */
        const intro = gsap.timeline({ delay: 0.2 })
        intro
          .from(letrasIn, {
            yPercent: 115,
            rotation: (i) => (i % 2 ? 9 : -9),
            autoAlpha: 0,
            duration: 0.95,
            ease: 'back.out(1.7)',
            stagger: 0.07,
          })
          .from(
            orbitaIn,
            {
              scale: 0.3,
              autoAlpha: 0,
              rotation: () => gsap.utils.random(-70, 70),
              duration: 0.9,
              ease: 'back.out(1.8)',
              stagger: { each: 0.05, from: 'center' },
            },
            0.35,
          )
          .fromTo('[data-subrayado]', { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.9, ease: 'power2.inOut', stagger: 0.15 }, 0.75)
          .from('[data-hero-sub]', { y: 22, autoAlpha: 0, duration: 0.7, ease: 'power3.out' }, 0.9)
          .from('[data-pista]', { autoAlpha: 0, y: -10, duration: 0.6, ease: 'power2.out' }, 1.8)
          .add(modoVuelo(svg, true, 0), 0)
          .fromTo(
            vueloRef.current,
            { x: '55vw', y: '-48vh', rotation: -16, autoAlpha: 0 },
            {
              x: 0,
              y: 0,
              rotation: 0,
              autoAlpha: 1,
              duration: 1.35,
              ease: 'power3.out',
              onStart: () => aleteo.play(),
            },
            0.85,
          )
          /* Aterriza: pliega, amortigua con las patas y se pone a lo suyo. */
          .add(() => aleteo.pause(), 2.05)
          .add(modoVuelo(svg, false, 0.18), 2.05)
          .fromTo(
            parte(svg, 'torso'),
            { scaleY: 1, scaleX: 1 },
            { scaleY: 0.9, scaleX: 1.05, svgOrigin: '200 330', duration: 0.1, ease: 'power2.out', yoyo: true, repeat: 1 },
            2.12,
          )
          .add(() => ocioso.play(), 2.6)

        /* SCROLL: la portada se clava y explota. */
        const estado = { volando: false }
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: raizRef.current,
            start: 'top top',
            end: '+=140%',
            pin: true,
            scrub: 1,
            onUpdate: (self) => {
              const volar = self.progress > 0.08
              if (volar === estado.volando) return
              estado.volando = volar
              modoVuelo(svg, volar)
              if (volar) {
                ocioso.pause(0)
                aleteo.play()
              } else {
                aleteo.pause()
                ocioso.restart(true)
              }
            },
          },
        })

        tl.to(
          orbita,
          {
            x: (i) => `${(ORBITA[i].x - 50) * ORBITA[i].d * 1.8}vw`,
            y: (i) => `${(ORBITA[i].y - 50) * ORBITA[i].d * 1.8}vh`,
            scale: (i) => 1 + ORBITA[i].d * 1.6,
            rotation: (i) => ORBITA[i].r * 5,
            ease: 'power2.in',
            duration: 1,
          },
          0,
        )
          .to(orbita, { autoAlpha: 0, duration: 0.25, ease: 'none' }, 0.72)
          .to(
            letras,
            {
              x: (i) => `${(i - 2.5) * 10}vw`,
              y: (i) => (i % 2 ? -1 : 1) * 60,
              rotation: (i) => (i - 2.5) * 9,
              scale: 1.5,
              autoAlpha: 0,
              ease: 'power2.in',
              duration: 0.8,
              stagger: { each: 0.035, from: 'center' },
            },
            0.08,
          )
          .to('[data-hero-pie]', { autoAlpha: 0, y: -40, duration: 0.3, ease: 'power1.in' }, 0)
          .to(anclaRef.current, { x: '32vw', y: '-75vh', rotation: -14, ease: 'power1.in', duration: 0.8 }, 0.1)

        return () => {
          aleteo.kill()
          ocioso.kill()
          parpadeo.kill()
        }
      })

      /* Con ratón: los objetos se mueven a su profundidad y Taly te sigue
         con la mirada. */
      mm.add(`${CON_MOVIMIENTO} and ${CON_RATON}`, () => {
        const capas = gsap.utils.toArray('.orbita-raton').map((el, i) => ({
          x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3.out' }),
          y: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3.out' }),
          d: ORBITA[i].d,
        }))
        const palabraX = gsap.quickTo(palabraRef.current, 'x', { duration: 1.2, ease: 'power3.out' })
        const palabraY = gsap.quickTo(palabraRef.current, 'y', { duration: 1.2, ease: 'power3.out' })
        const pupila = parte(vueloRef.current.querySelector('svg'), 'pupila')
        const ojoX = gsap.quickTo(pupila, 'x', { duration: 0.35, ease: 'power2.out' })
        const ojoY = gsap.quickTo(pupila, 'y', { duration: 0.35, ease: 'power2.out' })

        const alMover = (e) => {
          const nx = e.clientX / window.innerWidth - 0.5
          const ny = e.clientY / window.innerHeight - 0.5
          capas.forEach((c) => {
            c.x(nx * 70 * c.d)
            c.y(ny * 50 * c.d)
          })
          palabraX(nx * -18)
          palabraY(ny * -12)
          ojoX(gsap.utils.clamp(-3.5, 3.5, nx * 9))
          ojoY(gsap.utils.clamp(-3, 3, ny * 8))
        }
        window.addEventListener('pointermove', alMover, { passive: true })
        return () => window.removeEventListener('pointermove', alMover)
      })

      return () => mm.revert()
    },
    { scope: raizRef },
  )

  return (
    <section className="nos-hero" ref={raizRef} aria-labelledby="nos-hero-titulo">
      <div className="nos-hero-orbita" aria-hidden="true">
        {ORBITA.map((o, i) => (
          <div
            key={o.n}
            className="orbita-item"
            data-orbita
            style={{ left: `${o.x}%`, top: `${o.y}%`, '--s': o.s, '--r': `${o.r}deg`, '--dur': `${5 + (i % 4) * 0.9}s`, '--retraso': `${-i * 0.7}s` }}
          >
            <div className="orbita-raton">
              <div className="orbita-in">
                <div className="orbita-flota">
                  <IconoTinta nombre={o.n} semilla={i * 5 + 2} hervir />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="nos-hero-centro">
        <h1 className="nos-hero-palabra" id="nos-hero-titulo" ref={palabraRef} aria-label="Citaly">
          {LETRAS.map((l, i) => (
            <span className="nos-hero-letra" data-letra key={l + i} ref={l === 'T' ? letraTRef : undefined} aria-hidden="true">
              <span className="nos-hero-letra-in">{l}</span>
            </span>
          ))}
          <span className="nos-hero-taly" ref={anclaRef} aria-hidden="true">
            <span className="nos-hero-taly-vuelo" ref={vueloRef}>
              <TalyTinta pose="posado" />
            </span>
          </span>
        </h1>

        <div className="nos-hero-pie" data-hero-pie>
          <svg className="nos-hero-subrayado" viewBox="0 0 600 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <path data-subrayado d="M14 36 C120 16 240 50 330 30 C420 12 500 40 586 22" stroke={T.mostaza} strokeWidth="7" fill="none" strokeLinecap="round" />
            <path data-subrayado d="M60 50 C170 40 300 56 440 44" stroke={T.menta} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          </svg>
          <p className="nos-hero-sub" data-hero-sub>
            Sobre nosotros <span>·</span> la gente detrás de tus citas
          </p>
          <div className="nos-hero-pista" data-pista>
            <span>Desliza</span>
            <svg viewBox="0 0 24 34" aria-hidden="true" focusable="false">
              <path d="M12 3 C11 12 13 20 12 30 M4 22 L12 30 L20 22" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroNosotros
