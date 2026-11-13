import { useEffect, useRef, useState } from 'react'
import { CON_MOVIMIENTO, SplitText, gsap, useGSAP } from './gsapNosotros.js'
import TalyTinta from './TalyTinta.jsx'
import { aletear } from './talyMovimientos.js'
import { TINTA as T, useIdSvg } from './tinta.js'
import { FiltroPulso } from './PiezasTinta.jsx'
import './historiaNosotros.css'

/* Capítulo 01, la historia. Se clava en pantalla mientras:
   - el texto se enciende palabra a palabra (las marcadas con * en mostaza);
   - una línea de tinta se dibuja por debajo, con bucles de pluma;
   - Taly vuela pegado a la punta de esa línea, como si la fuera dibujando;
   - aparecen notas al margen escritas a máquina cuando la línea pasa por ellas. */

const TEXTO =
  'Citaly nació en una libreta llena de *tachones*: citas apuntadas a lápiz, llamadas que nadie cogía y un pájaro garabateado en la esquina. Queríamos que reservar fuera tan *sencillo* como pedirle un favor a un amigo. Ese pájaro se llama *Taly*, y desde entonces no ha dejado de volar.'

/* El trazo, en una caja de 1600 × 900. Ocupa la mitad de abajo para no
   pasar por encima del texto. */
const RUTA =
  'M-80 770 C120 730 220 570 380 610 C520 650 480 810 360 780 C250 750 320 550 520 510 C700 475 820 690 980 650 C1120 615 1070 480 970 520 C870 560 980 740 1160 720 C1330 700 1380 530 1500 490 C1580 465 1640 480 1700 460'

/* En móvil, la misma idea pero en vertical: una ruta pensada para una
   pantalla alta y estrecha, con las notas dentro del lienzo. */
const MOVIL = {
  caja: '0 -30 400 560',
  ruta: 'M-40 90 C60 60 140 40 200 90 C260 140 230 210 170 190 C110 170 150 100 250 120 C340 140 380 230 320 290 C260 350 120 300 90 360 C60 420 160 470 260 450 C340 434 380 400 440 410',
  notas: [
    { x: 24, y: 30, texto: '2025 · una libreta', en: 0.12 },
    { x: 18, y: 262, texto: 'el primer local', en: 0.5 },
    { x: 262, y: 382, texto: 'hoy · tú', en: 0.86 },
  ],
  taly: 120,
  grosor: [3.5, 10, 2],
}

const NOTAS = [
  { x: 300, y: 520, texto: '2025 · una libreta', en: 0.22 },
  { x: 880, y: 440, texto: 'el primer local', en: 0.55 },
  { x: 1290, y: 790, texto: 'hoy · tú', en: 0.86 },
]

function HistoriaNosotros() {
  const raizRef = useRef(null)
  const rutaRef = useRef(null)
  const viajeroRef = useRef(null)
  const tituloRef = useRef(null)
  const filtro = useIdSvg('historia-pulso')
  /* En vertical, "meet" deja el dibujo diminuto: ahí se recorta por los
     lados y se queda con todo el alto de su franja. */
  const [estrecho, setEstrecho] = useState(() => window.matchMedia('(max-width: 700px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px)')
    const cambio = (e) => setEstrecho(e.matches)
    mq.addEventListener('change', cambio)
    return () => mq.removeEventListener('change', cambio)
  }, [])

  const D = estrecho
    ? MOVIL
    : { caja: '0 340 1600 560', ruta: RUTA, notas: NOTAS, taly: 180, grosor: [7, 18, 3] }

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(CON_MOVIMIENTO, () => {
        const palabras = gsap.utils.toArray('[data-palabra]')
        const destacadas = gsap.utils.toArray('[data-palabra].es-destacada')
        const titulo = SplitText.create(tituloRef.current, { type: 'chars,words', mask: 'chars' })
        const svgTaly = viajeroRef.current.querySelector('svg')
        const aleteo = aletear(svgTaly, { medio: 0.13 })

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: raizRef.current,
            start: 'top top',
            end: '+=260%',
            pin: true,
            scrub: 1,
            onToggle: (self) => (self.isActive ? aleteo.play() : aleteo.pause()),
          },
        })

        tl.from('[data-etiqueta]', { autoAlpha: 0, x: -30, duration: 0.06, ease: 'power2.out' }, 0)
          .from(titulo.chars, { yPercent: 110, duration: 0.12, ease: 'power3.out', stagger: 0.006 }, 0)
          .fromTo(palabras, { opacity: 0.12 }, { opacity: 1, duration: 0.05, stagger: 0.5 / palabras.length }, 0.12)
          .fromTo(destacadas, { color: '#f0f0f0' }, { color: T.mostaza, duration: 0.04, stagger: 0.12 }, 0.3)
          .fromTo([rutaRef.current, '[data-ruta-sombra]'], { drawSVG: '0%' }, { drawSVG: '100%', duration: 1 }, 0)
          .to(
            viajeroRef.current,
            {
              motionPath: { path: rutaRef.current, align: rutaRef.current, alignOrigin: [0.5, 0.62], autoRotate: false },
              duration: 1,
            },
            0,
          )

        /* El pájaro se inclina según sube o baja la línea. */
        tl.fromTo('[data-inclina]', { rotation: -6 }, { rotation: 8, duration: 0.25, yoyo: true, repeat: 3, ease: 'sine.inOut', svgOrigin: '0 0' }, 0)

        D.notas.forEach((n, i) => {
          tl.from(`[data-nota="${i}"]`, { autoAlpha: 0, y: 24, duration: 0.06, ease: 'back.out(2)' }, n.en - 0.04)
        })

        return () => {
          aleteo.kill()
          titulo.revert()
        }
      })
      return () => mm.revert()
    },
    /* Al cruzar el corte de móvil cambia la ruta: se rehace todo. */
    { scope: raizRef, dependencies: [estrecho], revertOnUpdate: true },
  )

  return (
    <section className="nos-historia" ref={raizRef} aria-labelledby="nos-historia-titulo">
      {/* El dibujo vive en su propia franja, debajo del texto: con "meet" y
          una caja recortada a lo que ocupa la ruta, nunca se mete en el párrafo. */}
      <div className="nos-historia-dibujo">
      <svg className="nos-historia-lienzo" viewBox={D.caja} preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
        <defs>
          <FiltroPulso id={filtro} escala={6} frecuencia={0.02} semilla={4} />
        </defs>
        <g filter={`url(#${filtro})`} fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* La guía a lápiz: por dónde va a pasar la tinta. */}
          <path d={D.ruta} stroke={T.barriga} strokeOpacity=".1" strokeWidth={D.grosor[2]} strokeDasharray="2 14" />
          <path data-ruta-sombra d={D.ruta} stroke={T.tinta} strokeWidth={D.grosor[1]} opacity=".7" />
          <path ref={rutaRef} d={D.ruta} stroke={T.menta} strokeWidth={D.grosor[0]} />
        </g>

        {D.notas.map((n, i) => (
          <g key={n.texto} transform={`translate(${n.x} ${n.y})`}>
            <g data-nota={i}>
            <path d="M0 18 C30 30 70 26 100 14" stroke={T.mostaza} strokeWidth="3" fill="none" strokeLinecap="round" />
            <text className="nos-historia-nota" x="0" y="0">
              {n.texto}
            </text>
            </g>
          </g>
        ))}

        <g ref={viajeroRef}>
          <g data-inclina>
            <TalyTinta pose="volando" x={-D.taly / 2} y={-D.taly / 2} width={D.taly} height={D.taly} semilla={9} />
          </g>
        </g>
      </svg>
      </div>

      <div className="nos-historia-texto">
        <p className="nos-etiqueta" data-etiqueta>
          <span>01</span> La historia
        </p>
        <h2 className="nos-historia-titulo" id="nos-historia-titulo" ref={tituloRef}>
          Empezó con un garabato
        </h2>
        <p className="nos-historia-parrafo">
          {TEXTO.split(' ').map((palabra, i) => {
            const destacada = palabra.startsWith('*')
            const limpia = palabra.replace(/\*/g, '')
            return (
              <span key={i} data-palabra className={destacada ? 'es-destacada' : undefined}>
                {limpia}{' '}
              </span>
            )
          })}
        </p>
      </div>
    </section>
  )
}

export default HistoriaNosotros
