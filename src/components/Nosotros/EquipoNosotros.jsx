import { useRef } from 'react'
import { CON_MOVIMIENTO, gsap, useGSAP } from './gsapNosotros.js'
import TalyPluma from '../Taly/TalyPluma.jsx'
import { TINTA as T, useIdSvg } from './tinta.js'
import { FiltroPulso } from './PiezasTinta.jsx'
import './equipoNosotros.css'

/* Capítulo 04, quiénes somos. Retratos de ejemplo dentro de marcos
   redondos trazados a tinta. Al entrar, los marcos se dibujan, la cara cae
   dentro con rebote y el Taly pequeño del header salta a posarse en uno. */

const EQUIPO = [
  { nombre: 'Nombre Apellido', rol: 'Fundación · producto', frase: '“Frase de ejemplo sobre por qué empezó todo.”', color: T.menta, taly: true },
  { nombre: 'Nombre Apellido', rol: 'Diseño', frase: '“Frase de ejemplo sobre dibujar a Taly.”', color: T.mostaza },
  { nombre: 'Nombre Apellido', rol: 'Desarrollo', frase: '“Frase de ejemplo sobre hacer que todo vaya fino.”', color: T.barriga },
  { nombre: 'Nombre Apellido', rol: 'Locales y clientes', frase: '“Frase de ejemplo sobre escuchar a los negocios.”', color: T.ala },
]

const MARCO = 'M100 10 C150 8 192 46 190 100 C188 152 150 192 98 190 C46 188 8 150 10 98 C12 48 52 12 100 10 Z'

const iniciales = (n) =>
  n
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)

function EquipoNosotros() {
  const raizRef = useRef(null)
  const filtro = useIdSvg('equipo-pulso')

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(CON_MOVIMIENTO, () => {
        gsap.from('[data-equipo-cabecera] > *', {
          y: 50,
          autoAlpha: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.1,
          scrollTrigger: { trigger: '[data-equipo-cabecera]', start: 'top 80%', toggleActions: 'play none none reverse' },
        })

        gsap
          .timeline({
            scrollTrigger: { trigger: '[data-equipo-lista]', start: 'top 75%', toggleActions: 'play none none reverse' },
          })
          .fromTo('[data-marco]', { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.9, ease: 'power2.inOut', stagger: 0.12 })
          .from('[data-cara]', { scale: 0.4, autoAlpha: 0, rotation: -25, duration: 0.7, ease: 'back.out(2)', stagger: 0.12 }, 0.25)
          .from('[data-miembro-texto]', { y: 26, autoAlpha: 0, duration: 0.5, ease: 'power3.out', stagger: 0.06 }, 0.45)
          .from('[data-equipo-taly]', { y: -120, x: 60, rotation: -30, autoAlpha: 0, duration: 0.7, ease: 'bounce.out' }, 0.9)
      })
      return () => mm.revert()
    },
    { scope: raizRef },
  )

  return (
    <section className="nos-equipo" ref={raizRef} aria-labelledby="nos-equipo-titulo">
      <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
        <defs>
          <FiltroPulso id={filtro} escala={5} frecuencia={0.04} semilla={21} />
        </defs>
      </svg>

      <header className="nos-equipo-cabecera" data-equipo-cabecera>
        <p className="nos-etiqueta">
          <span>04</span> Quiénes somos
        </p>
        <h2 className="nos-equipo-titulo" id="nos-equipo-titulo">
          Las manos detrás <em>de Taly</em>
        </h2>
      </header>

      <ul className="nos-equipo-lista" data-equipo-lista>
        {EQUIPO.map((m, i) => (
          <li className="nos-miembro" key={i}>
            <div className="nos-retrato" style={{ '--c': m.color, '--giro': `${(i % 2 ? 1 : -1) * (2 + i)}deg` }}>
              <div className="nos-retrato-cara" data-cara>
                {/* Placeholder: aquí irá la foto. */}
                <span>{iniciales(m.nombre)}</span>
              </div>
              <svg className="nos-retrato-marco" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
                <g filter={`url(#${filtro})`} fill="none" strokeLinecap="round">
                  <path data-marco d={MARCO} stroke={T.tinta} strokeWidth="9" />
                  <path data-marco d={MARCO} stroke={m.color} strokeWidth="3.5" transform="rotate(4 100 100)" />
                </g>
              </svg>
              {m.taly && (
                <div className="nos-retrato-taly" data-equipo-taly>
                  <TalyPluma tamano={44} />
                </div>
              )}
            </div>
            <h3 data-miembro-texto>{m.nombre}</h3>
            <p className="nos-miembro-rol" data-miembro-texto>
              {m.rol}
            </p>
            <p className="nos-miembro-frase" data-miembro-texto>
              {m.frase}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default EquipoNosotros
