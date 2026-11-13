import { useEffect, useRef } from 'react'
import IconoTinta from './IconosTinta.jsx'
import './fondoPapel.css'

/* El fondo del modo ligero: una hoja de papel crema con el mundo de Citaly
   dibujado a tinta por todas partes, como una libreta garabateada.

   Es estático (se pinta una vez); lo único que se mueve es la capa entera,
   un poco más despacio que el scroll, con una sola transformación. Cuesta
   lo mismo que una imagen de fondo. */

const NOMBRES = ['calendario', 'reloj', 'sobre', 'pin', 'tijeras', 'taza', 'campana', 'plato', 'pluma', 'ticket']

/* Aleatorio con semilla: el reparto es siempre el mismo, no baila en cada render. */
function aleatorio(semilla) {
  let s = semilla
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/* Rejilla con temblor: repartidos por igual pero sin que se note la rejilla. */
const COLUMNAS = 6
const FILAS = 9
const DIBUJOS = (() => {
  const r = aleatorio(20251113)
  const lista = []
  for (let f = 0; f < FILAS; f++) {
    for (let c = 0; c < COLUMNAS; c++) {
      if (r() < 0.18) continue // algún hueco, como en una libreta de verdad
      lista.push({
        n: NOMBRES[(f * COLUMNAS + c + Math.floor(r() * 3)) % NOMBRES.length],
        x: ((c + 0.2 + r() * 0.6) / COLUMNAS) * 100,
        y: ((f + 0.2 + r() * 0.6) / FILAS) * 100,
        rot: (r() - 0.5) * 50,
        s: 0.7 + r() * 0.6,
      })
    }
  }
  return lista
})()

function FondoPapel() {
  const capaRef = useRef(null)

  useEffect(() => {
    const capa = capaRef.current
    if (!capa || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    let raf = 0
    const mover = () => {
      raf = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? window.scrollY / max : 0
      /* La capa mide 140 % del alto: recorre ese 40 % sobrante. */
      capa.style.transform = `translate3d(0, ${(-p * 40).toFixed(2)}svh, 0)`
    }
    const alScroll = () => {
      if (!raf) raf = requestAnimationFrame(mover)
    }
    mover()
    window.addEventListener('scroll', alScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', alScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="fondo-papel" aria-hidden="true">
      <div className="fondo-papel-capa" ref={capaRef}>
        {DIBUJOS.map((d, i) => (
          <div
            key={i}
            className="fondo-papel-dibujo"
            style={{ left: `${d.x}%`, top: `${d.y}%`, '--rot': `${d.rot}deg`, '--s': d.s }}
          >
            <IconoTinta nombre={d.n} semilla={(i % 7) + 1} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default FondoPapel
