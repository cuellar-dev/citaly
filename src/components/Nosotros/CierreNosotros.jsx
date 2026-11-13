import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { CON_MOVIMIENTO, gsap, useGSAP } from './gsapNosotros.js'
import TalyTinta from './TalyTinta.jsx'
import { aletear, modoVuelo, parte } from './talyMovimientos.js'
import './cierreNosotros.css'

/* Cierre. Un círculo de papel crema se abre desde el centro y se come la
   noche: el mundo de tinta se vuelve una hoja. Taly duerme en su nido; al
   llegar al final se despierta, se sacude y da un saltito, y aparece la
   invitación a reservar. */

function CierreNosotros() {
  const raizRef = useRef(null)
  const talyRef = useRef(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(CON_MOVIMIENTO, () => {
        const svg = talyRef.current.querySelector('svg')
        const zz = svg.querySelectorAll('[data-z]')

        /* Los zz suben y se desvanecen mientras duerme. */
        const ronquido = gsap.timeline({ repeat: -1 })
        ronquido.fromTo(
          zz,
          { y: 10, x: -6, autoAlpha: 0 },
          { y: -26, x: 8, autoAlpha: 1, duration: 1.3, ease: 'sine.out', stagger: 0.45, yoyo: false },
        ).to(zz, { autoAlpha: 0, duration: 0.4, stagger: 0.45 }, 0.9)
        const respira = gsap.to(parte(svg, 'torso'), { scaleY: 1.03, scaleX: 0.985, svgOrigin: '200 330', duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1 })

        /* Despertar: ojo abierto, se estira, aletea dos veces y salta. */
        const aleteo = aletear(svg, { veces: 1, medio: 0.1 })
        const estado = { despierto: false }
        const despertar = gsap
          .timeline({
            paused: true,
            /* Si vuelves a subir, se vuelve a dormir. */
            onReverseComplete: () => {
              ronquido.play()
              respira.play()
            },
          })
          .add(() => {
            ronquido.pause()
            respira.pause()
          })
          .to(parte(svg, 'zz'), { autoAlpha: 0, duration: 0.15 }, 0)
          .to(parte(svg, 'ojo-cerrado'), { autoAlpha: 0, duration: 0.05 }, 0.12)
          .to(parte(svg, 'ojo'), { autoAlpha: 1, duration: 0.05 }, 0.12)
          .to(parte(svg, 'torso'), { scaleY: 1.08, scaleX: 0.95, svgOrigin: '200 330', duration: 0.18, ease: 'power2.out' }, 0.15)
          .add(modoVuelo(svg, true, 0.15), 0.3)
          .add(() => aleteo.restart(), 0.3)
          .to(talyRef.current, { y: -70, duration: 0.32, ease: 'power2.out' }, 0.3)
          .to(parte(svg, 'torso'), { scaleY: 1, scaleX: 1, duration: 0.2 }, 0.3)
          .to(talyRef.current, { y: 0, duration: 0.3, ease: 'bounce.out' }, 0.62)
          .add(modoVuelo(svg, false, 0.12), 0.62)
          .from('[data-cierre-texto] > *', { y: 40, autoAlpha: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08 }, 0.45)

        gsap
          .timeline({
            scrollTrigger: {
              trigger: raizRef.current,
              start: 'top top',
              end: '+=130%',
              pin: true,
              scrub: 1,
              onUpdate: (self) => {
                const despierto = self.progress > 0.72
                if (despierto === estado.despierto) return
                estado.despierto = despierto
                if (despierto) despertar.play()
                else despertar.reverse()
              },
            },
          })
          .fromTo('[data-papel]', { clipPath: 'circle(0% at 50% 55%)' }, { clipPath: 'circle(80% at 50% 55%)', ease: 'power2.inOut', duration: 0.6 }, 0)
          .from(talyRef.current, { scale: 0.6, autoAlpha: 0, y: 60, ease: 'back.out(1.6)', duration: 0.25 }, 0.35)
          .to({}, { duration: 0.4 })
      })
      return () => mm.revert()
    },
    { scope: raizRef },
  )

  return (
    <section className="nos-cierre" ref={raizRef} aria-labelledby="nos-cierre-titulo">
      <div className="nos-cierre-papel" data-papel>
        <div className="nos-cierre-contenido">
          <div className="nos-cierre-taly" ref={talyRef}>
            <TalyTinta pose="dormido" extras={['zz', 'nido']} semilla={15} />
          </div>
          <div className="nos-cierre-texto" data-cierre-texto>
            <h2 id="nos-cierre-titulo">¿Nos vemos en tu próxima cita?</h2>
            <p>Texto de ejemplo: Taly ya está despierto y con ganas de llevarte a algún sitio bonito.</p>
            <Link to="/" className="nos-cta">
              Descubrir locales
              <ArrowRight size={20} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CierreNosotros
