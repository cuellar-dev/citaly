import { useEffect, useState } from 'react'
import HeroeLocal from './HeroeLocal.jsx'
import { estaAbierto } from '../../utils/fichaLocal.js'
import './carruselHeroe.css'

/* El héroe de Descubre, ahora en carrusel: los mismos 5 mejores lugares con
   EXACTAMENTE el estilo del héroe de siempre, deslizándose solos cada 6 s.
   No se toca HeroeLocal; solo se envuelve. La sombra del héroe la lleva el
   viewport (que recorta los slides vecinos), así se ve igual que el héroe único. */

const PASO_MS = 4000

function prefiereQuieto() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function CarruselHeroe({ locales = [] }) {
  const [indice, setIndice] = useState(0)
  const [pausado, setPausado] = useState(false)
  const quieto = prefiereQuieto()
  const total = locales.length

  /* El índice vuelve a cero si cambia la lista y se queda fuera de rango. */
  useEffect(() => {
    if (indice >= total) setIndice(0)
  }, [total, indice])

  /* Un temporizador que se re-arma tras cada cambio (manual o automático): así
     tocar un punto reinicia la cuenta de 6 s en vez de saltar enseguida. */
  useEffect(() => {
    if (quieto || pausado || total <= 1) return
    const id = window.setTimeout(() => {
      setIndice((i) => (i + 1) % total)
    }, PASO_MS)
    return () => window.clearTimeout(id)
  }, [indice, total, pausado, quieto])

  if (!total) return null
  const activo = Math.min(indice, total - 1)

  return (
    <div
      className="carrusel-heroe"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      <div className="carrusel-heroe-viewport">
        <div
          className="carrusel-heroe-pista"
          style={{ transform: `translateX(-${activo * 100}%)` }}
        >
          {locales.map((local, i) => (
            <div
              className="carrusel-heroe-slide"
              key={local.id}
              aria-hidden={i !== activo}
            >
              <HeroeLocal
                local={local}
                etiqueta={estaAbierto(local) ? 'Abierto ahora' : 'El mejor valorado'}
              />
            </div>
          ))}
        </div>
      </div>

      {total > 1 && (
        <div className="carrusel-heroe-puntos" role="tablist" aria-label="Lugares destacados">
          {locales.map((local, i) => (
            <button
              key={local.id}
              type="button"
              role="tab"
              aria-selected={i === activo}
              aria-label={`Ver ${local.localName}`}
              className={`carrusel-heroe-punto${i === activo ? ' carrusel-heroe-punto--on' : ''}`}
              onClick={() => setIndice(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default CarruselHeroe
