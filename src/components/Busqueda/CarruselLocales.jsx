import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import LocalHorizontal from './LocalHorizontal.jsx'

function CarruselLocales({ locales, onSelect, etiqueta }) {
  const railRef = useRef(null)
  const [indiceActivo, setIndiceActivo] = useState(0)

  const actualizarIndice = useCallback(() => {
    const rail = railRef.current
    if (!rail || locales.length < 2) return

    const recorrido = rail.scrollWidth - rail.clientWidth
    const progreso = recorrido > 0 ? rail.scrollLeft / recorrido : 0
    const indice = Math.round(progreso * (locales.length - 1))
    setIndiceActivo(Math.min(locales.length - 1, indice))
  }, [locales.length])

  useEffect(() => {
    actualizarIndice()
  }, [actualizarIndice])

  return (
    <div className="carrusel-locales">
      <div className="carrusel-locales-footer">
        <span className="carrusel-locales-hint">
          <ArrowRight size={13} />
          Desliza para ver más
        </span>
        <div
          className="carrusel-locales-navigation"
          aria-label={`Opción ${indiceActivo + 1} de ${locales.length}`}
        >
          <span className="carrusel-locales-count">
            {indiceActivo + 1} / {locales.length}
          </span>
          <div className="carrusel-locales-dots" aria-hidden="true">
            {locales.map((local, index) => (
              <span className={index === indiceActivo ? 'is-active' : ''} key={local.id} />
            ))}
          </div>
        </div>
      </div>
      <div className="carrusel-locales-rail-wrap">
        <div
          ref={railRef}
          className="similares-scroll"
          onScroll={actualizarIndice}
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
