import { useCallback, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import LocalHorizontal from './LocalHorizontal.jsx'

/* Carrusel de lugares. El punto activo se saca de dónde está cada tarjeta de
   verdad, no de una regla de tres sobre el scroll: aquella cuenta daba el
   índice equivocado en cuanto las tarjetas no medían todas lo mismo o el
   carrusel tenía padding lateral. */

function CarruselLocales({ locales, onSelect, etiqueta }) {
  const pistaRef = useRef(null)
  const [activo, setActivo] = useState(0)

  const alScroll = useCallback(() => {
    const pista = pistaRef.current
    if (!pista || locales.length < 2) return
    const centro = pista.scrollLeft + pista.clientWidth / 2
    let mejor = 0
    let menor = Infinity
    for (let i = 0; i < pista.children.length; i++) {
      const hijo = pista.children[i]
      const medio = hijo.offsetLeft + hijo.offsetWidth / 2
      const distancia = Math.abs(medio - centro)
      if (distancia < menor) {
        menor = distancia
        mejor = i
      }
    }
    setActivo(mejor)
  }, [locales.length])

  const indice = Math.min(activo, Math.max(0, locales.length - 1))

  return (
    <div className="carrusel-locales">
      <div className="carrusel-locales-footer">
        <span className="carrusel-locales-hint">
          <ArrowRight size={13} aria-hidden="true" />
          Desliza para ver más
        </span>
        <div
          className="carrusel-locales-navigation"
          aria-label={`Lugar ${indice + 1} de ${locales.length}`}
        >
          <span className="carrusel-locales-count">
            {indice + 1} / {locales.length}
          </span>
          <div className="carrusel-locales-dots" aria-hidden="true">
            {locales.map((local, i) => (
              <span className={i === indice ? 'is-active' : ''} key={local.id} />
            ))}
          </div>
        </div>
      </div>

      <div className="carrusel-locales-rail-wrap">
        <div
          ref={pistaRef}
          className="similares-scroll"
          onScroll={alScroll}
          aria-label={etiqueta}
          role="region"
          tabIndex={0}
        >
          {locales.map((local) => (
            <LocalHorizontal key={local.id} local={local} onClick={() => onSelect(local)} />
          ))}
        </div>
        <span className="carrusel-locales-fade" aria-hidden="true" />
      </div>
    </div>
  )
}

export default CarruselLocales
