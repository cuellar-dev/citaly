import { useRef } from 'react'
import { CON_MOVIMIENTO, gsap, useGSAP } from './gsapNosotros.js'
import TalyTinta from './TalyTinta.jsx'
import IconoTinta from './IconosTinta.jsx'
import { TINTA as T } from './tinta.js'
import './pasosNosotros.css'

/* Capítulo 02, cómo funciona. Scroll horizontal clavado: bajas y la pista
   corre hacia la izquierda. Una puntada de mostaza se va cosiendo por abajo
   a la vez. Cada paso tiene su Taly:
     01 Descubre  → Taly con lupa entre chinchetas
     02 Reserva   → Taly cartero con la cita en el pico
     03 Disfruta  → Taly feliz con su café */

const PASOS = [
  {
    num: '01',
    titulo: 'Descubre',
    texto: 'Texto de ejemplo: explora los sitios de tu barrio, mira sus fotos, sus horarios y lo que opinan otros clientes.',
    taly: { pose: 'posado', extras: ['lupa'] },
    objetos: [
      { n: 'pin', x: 8, y: 14, s: 0.9 },
      { n: 'pin', x: 78, y: 4, s: 0.7 },
      { n: 'pin', x: 86, y: 62, s: 0.8 },
    ],
  },
  {
    num: '02',
    titulo: 'Reserva',
    texto: 'Texto de ejemplo: elige el día, la hora y hasta la mesa. Sin llamadas, sin esperas y sin perder la tarde.',
    taly: { pose: 'posado', extras: ['sobre'] },
    objetos: [
      { n: 'calendario', x: 2, y: 8, s: 1 },
      { n: 'reloj', x: 82, y: 70, s: 0.8 },
      { n: 'ticket', x: 76, y: 4, s: 0.75 },
    ],
  },
  {
    num: '03',
    titulo: 'Disfruta',
    texto: 'Texto de ejemplo: ve a tu cita tranquilo. Te avisamos antes y, si algo cambia, lo mueves en dos toques.',
    taly: { pose: 'feliz', extras: [] },
    objetos: [
      { n: 'taza', x: 80, y: 60, s: 0.9 },
      { n: 'tijeras', x: 4, y: 10, s: 0.8 },
      { n: 'plato', x: 78, y: 2, s: 0.8 },
    ],
  },
]

/* La puntada: colinas suaves a lo largo de toda la pista. */
const HILO = (() => {
  let d = 'M0 120'
  for (let i = 0; i < 16; i++) {
    const x = i * 250
    const y = i % 2 ? 150 : 80
    d += ` C${x + 80} ${y} ${x + 170} ${y} ${x + 250} 120`
  }
  return d
})()

function PasosNosotros() {
  const raizRef = useRef(null)
  const pistaRef = useRef(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(CON_MOVIMIENTO, () => {
        const pista = pistaRef.current
        const distancia = () => pista.scrollWidth - window.innerWidth

        /* El desplazamiento horizontal: lineal, o el scroll y la pista
           dejarían de ir a la par. */
        const correr = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: raizRef.current,
            start: 'top top',
            end: () => `+=${distancia()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        })
        correr
          .to(pista, { x: () => -distancia(), duration: 1 }, 0)
          .fromTo('[data-hilo-mascara]', { drawSVG: '0%' }, { drawSVG: '100%', duration: 1 }, 0)

        /* Lo de dentro de cada panel reacciona al avance horizontal. */
        gsap.utils.toArray('[data-paso]').forEach((panel) => {
          const ilus = panel.querySelector('[data-paso-ilus]')
          const textos = panel.querySelectorAll('[data-paso-texto]')
          const objetos = panel.querySelectorAll('[data-paso-objeto]')
          const num = panel.querySelector('[data-paso-num]')

          gsap
            .timeline({
              scrollTrigger: {
                trigger: panel,
                containerAnimation: correr,
                start: 'left 72%',
                toggleActions: 'play none none reverse',
              },
            })
            .from(ilus, { scale: 0.7, rotation: -10, autoAlpha: 0, duration: 0.7, ease: 'back.out(1.6)' })
            .from(objetos, { scale: 0.2, autoAlpha: 0, rotation: () => gsap.utils.random(-90, 90), duration: 0.55, ease: 'back.out(2)', stagger: 0.08 }, 0.2)
            .from(textos, { y: 40, autoAlpha: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08 }, 0.1)

          /* El número gigante va más despacio que el panel: profundidad. */
          gsap.fromTo(
            num,
            { xPercent: 40 },
            {
              xPercent: -40,
              ease: 'none',
              scrollTrigger: { trigger: panel, containerAnimation: correr, start: 'left right', end: 'right left', scrub: true },
            },
          )
        })

        gsap.from('[data-pasos-intro] > *', {
          y: 50,
          autoAlpha: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.1,
          scrollTrigger: { trigger: raizRef.current, start: 'top 65%', toggleActions: 'play none none reverse' },
        })
      })
      return () => mm.revert()
    },
    { scope: raizRef },
  )

  return (
    <section className="nos-pasos" ref={raizRef} aria-labelledby="nos-pasos-titulo">
      <div className="nos-pasos-pista" ref={pistaRef}>
        <div className="nos-pasos-panel nos-pasos-intro" data-pasos-intro>
          <p className="nos-etiqueta">
            <span>02</span> Cómo funciona
          </p>
          <h2 className="nos-pasos-titulo" id="nos-pasos-titulo">
            Tres pasos.
            <br />
            <em>Ni uno más.</em>
          </h2>
          <p className="nos-pasos-lead">Texto de ejemplo: de las ganas a la cita sin descolgar el teléfono.</p>
        </div>

        {PASOS.map((p) => (
          <article className="nos-pasos-panel nos-paso" data-paso key={p.num}>
            <span className="nos-paso-num" data-paso-num aria-hidden="true">
              {p.num}
            </span>

            <div className="nos-paso-ilus" data-paso-ilus>
              {p.objetos.map((o, i) => (
                <div
                  key={`${o.n}${i}`}
                  className="nos-paso-objeto"
                  data-paso-objeto
                  style={{ left: `${o.x}%`, top: `${o.y}%`, '--s': o.s, '--retraso': `${-i * 1.1}s` }}
                >
                  <IconoTinta nombre={o.n} semilla={i * 3 + 1} />
                </div>
              ))}
              <div className="nos-paso-taly">
                <TalyTinta pose={p.taly.pose} extras={p.taly.extras} semilla={p.num.length + Number(p.num) * 4} />
              </div>
            </div>

            <div className="nos-paso-texto">
              <h3 data-paso-texto>{p.titulo}</h3>
              <p data-paso-texto>{p.texto}</p>
            </div>
          </article>
        ))}

        <svg className="nos-pasos-hilo" viewBox="0 0 4000 200" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <defs>
            <mask id="nos-pasos-hilo-mascara" maskUnits="userSpaceOnUse" x="0" y="0" width="4000" height="200">
              <path data-hilo-mascara d={HILO} stroke="#fff" strokeWidth="40" fill="none" />
            </mask>
          </defs>
          <path d={HILO} stroke={T.barriga} strokeOpacity=".12" strokeWidth="3" fill="none" strokeDasharray="14 12" vectorEffect="non-scaling-stroke" />
          <path
            d={HILO}
            mask="url(#nos-pasos-hilo-mascara)"
            stroke={T.mostaza}
            strokeWidth="4"
            fill="none"
            strokeDasharray="14 12"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </section>
  )
}

export default PasosNosotros
