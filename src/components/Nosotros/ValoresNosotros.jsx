import { useRef } from 'react'
import { animate, createDrawable, stagger } from 'animejs'
import { CON_MOVIMIENTO, CON_RATON, ScrollTrigger, gsap, useGSAP } from './gsapNosotros.js'
import IconoTinta from './IconosTinta.jsx'
import { TINTA as T, useIdSvg } from './tinta.js'
import { FiltroPulso } from './PiezasTinta.jsx'
import './valoresNosotros.css'

/* Capítulo 03, lo que nos mueve.
   - Las tarjetas caen como papeles sobre la mesa (ScrollTrigger.batch), con
     su borde a tinta dibujándose, y se inclinan en 3D bajo el ratón.
   - Las cifras cuentan con anime.js y se subrayan a mano (createDrawable). */

const VALORES = [
  { icono: 'pluma', titulo: 'Hecho a mano', texto: 'Texto de ejemplo: cuidamos cada detalle como si lo dibujáramos con pluma.' },
  { icono: 'reloj', titulo: 'Tu tiempo vale', texto: 'Texto de ejemplo: menos esperas, menos llamadas, más tarde libre.' },
  { icono: 'campana', titulo: 'Siempre a tiempo', texto: 'Texto de ejemplo: te avisamos antes de cada cita para que no se te pase.' },
  { icono: 'sobre', titulo: 'Sin letra pequeña', texto: 'Texto de ejemplo: lo que ves es lo que hay, para ti y para el local.' },
]

const CIFRAS = [
  { valor: 1200, prefijo: '+', etiqueta: 'locales (placeholder)' },
  { valor: 48000, prefijo: '', etiqueta: 'citas reservadas (placeholder)' },
  { valor: 32, prefijo: '', etiqueta: 'ciudades (placeholder)' },
]

const formato = (n) => Math.round(n).toLocaleString('es-ES')

/* Rectángulo torcido a mano, en una caja de 300 × 360 estirada a la tarjeta. */
const BORDE = 'M14 10 C90 6 210 12 288 8 C292 90 286 250 291 350 C200 354 90 348 10 352 C6 260 12 110 14 10 Z'

function ValoresNosotros() {
  const raizRef = useRef(null)
  const filtro = useIdSvg('valor-pulso')

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add(CON_MOVIMIENTO, () => {
        const tarjetas = gsap.utils.toArray('[data-valor]')
        gsap.set(tarjetas, { y: 140, autoAlpha: 0, rotation: (i) => (i % 2 ? 7 : -6) })
        gsap.set('[data-valor-borde]', { drawSVG: '0%' })

        gsap.from('[data-valores-cabecera] > *', {
          y: 50,
          autoAlpha: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.1,
          scrollTrigger: { trigger: '[data-valores-cabecera]', start: 'top 80%', toggleActions: 'play none none reverse' },
        })

        ScrollTrigger.batch(tarjetas, {
          start: 'top 88%',
          onEnter: (lote) => {
            gsap.to(lote, { y: 0, autoAlpha: 1, rotation: (i) => (i % 2 ? 1.5 : -1.5), duration: 0.9, ease: 'back.out(1.5)', stagger: 0.12, overwrite: true })
            gsap.to(lote.map((t) => t.querySelector('[data-valor-borde]')), { drawSVG: '100%', duration: 1.1, ease: 'power2.inOut', stagger: 0.12, delay: 0.25 })
          },
          onLeaveBack: (lote) => {
            gsap.to(lote, { y: 140, autoAlpha: 0, rotation: (i) => (i % 2 ? 7 : -6), duration: 0.4, ease: 'power2.in', overwrite: true })
            gsap.to(lote.map((t) => t.querySelector('[data-valor-borde]')), { drawSVG: '0%', duration: 0.3 })
          },
        })

        /* Cifras con anime.js: se cuentan una vez, la primera vez que se ven. */
        const nums = gsap.utils.toArray('[data-cifra-num]')
        const lineas = gsap.utils.toArray('[data-cifra-linea]')
        nums.forEach((el, i) => {
          el.textContent = `${CIFRAS[i].prefijo}0`
        })
        const animaciones = []
        /* Nacen sin dibujar (0 0) y se trazan al entrar. */
        const dibujables = createDrawable(lineas, 0, 0)
        gsap.set('[data-cifra]', { opacity: 0 })

        ScrollTrigger.create({
          trigger: '[data-cifras]',
          start: 'top 78%',
          once: true,
          onEnter: () => {
            nums.forEach((el, i) => {
              const cuenta = { v: 0 }
              animaciones.push(
                animate(cuenta, {
                  v: CIFRAS[i].valor,
                  duration: 2200,
                  delay: i * 180,
                  ease: 'outExpo',
                  onUpdate: () => {
                    el.textContent = `${CIFRAS[i].prefijo}${formato(cuenta.v)}`
                  },
                }),
              )
            })
            animaciones.push(
              animate(dibujables, { draw: ['0 0', '0 1'], duration: 1100, delay: stagger(180, { start: 500 }), ease: 'inOutQuad' }),
              animate('[data-cifra]', { translateY: [40, 0], opacity: [0, 1], duration: 900, delay: stagger(120), ease: 'outBack(1.4)' }),
            )
          },
        })

        return () => {
          animaciones.forEach((a) => a.revert())
          nums.forEach((el, i) => {
            el.textContent = `${CIFRAS[i].prefijo}${formato(CIFRAS[i].valor)}`
          })
          lineas.forEach((l) => ['stroke-dasharray', 'stroke-dashoffset', 'pathLength'].forEach((a) => l.removeAttribute(a)))
        }
      })

      /* Inclinación 3D de las tarjetas siguiendo al ratón. */
      mm.add(`${CON_MOVIMIENTO} and ${CON_RATON}`, () => {
        const limpiar = gsap.utils.toArray('[data-valor-inner]').map((inner) => {
          gsap.set(inner, { transformPerspective: 900 })
          const rx = gsap.quickTo(inner, 'rotationX', { duration: 0.5, ease: 'power3.out' })
          const ry = gsap.quickTo(inner, 'rotationY', { duration: 0.5, ease: 'power3.out' })
          const mover = (e) => {
            const r = inner.getBoundingClientRect()
            ry(((e.clientX - r.left) / r.width - 0.5) * 14)
            rx(((e.clientY - r.top) / r.height - 0.5) * -14)
          }
          const salir = () => {
            rx(0)
            ry(0)
          }
          inner.addEventListener('pointermove', mover)
          inner.addEventListener('pointerleave', salir)
          return () => {
            inner.removeEventListener('pointermove', mover)
            inner.removeEventListener('pointerleave', salir)
          }
        })
        return () => limpiar.forEach((f) => f())
      })

      return () => mm.revert()
    },
    { scope: raizRef },
  )

  return (
    <section className="nos-valores" ref={raizRef} aria-labelledby="nos-valores-titulo">
      <header className="nos-valores-cabecera" data-valores-cabecera>
        <p className="nos-etiqueta">
          <span>03</span> Lo que nos mueve
        </p>
        <h2 className="nos-valores-titulo" id="nos-valores-titulo">
          Cuatro cosas que <em>no negociamos</em>
        </h2>
      </header>

      <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
        <defs>
          <FiltroPulso id={filtro} escala={5} frecuencia={0.03} semilla={12} />
        </defs>
      </svg>

      <ul className="nos-valores-lista">
        {VALORES.map((v, i) => (
          <li className="nos-valor" data-valor key={v.titulo}>
            <div className="nos-valor-inner" data-valor-inner>
              <svg className="nos-valor-borde" viewBox="0 0 300 360" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                <path
                  data-valor-borde
                  d={BORDE}
                  fill="none"
                  stroke={i % 2 ? T.mostaza : T.menta}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  filter={`url(#${filtro})`}
                />
              </svg>
              <div className="nos-valor-icono">
                <IconoTinta nombre={v.icono} semilla={i * 7 + 4} />
              </div>
              <h3>{v.titulo}</h3>
              <p>{v.texto}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="nos-cifras" data-cifras>
        {CIFRAS.map((c) => (
          <div className="nos-cifra" data-cifra key={c.etiqueta}>
            <span className="nos-cifra-num" data-cifra-num>
              {c.prefijo}
              {formato(c.valor)}
            </span>
            <svg className="nos-cifra-linea" viewBox="0 0 240 24" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <path data-cifra-linea d="M6 14 C60 4 120 22 170 10 C200 4 220 12 234 8" fill="none" stroke={T.mostaza} strokeWidth="5" strokeLinecap="round" />
            </svg>
            <span className="nos-cifra-etiqueta">{c.etiqueta}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default ValoresNosotros
