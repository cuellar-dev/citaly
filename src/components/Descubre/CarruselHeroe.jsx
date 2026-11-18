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

  /* Fotos del carrusel: al entrar solo se pide la primera (con prioridad, es
     lo primero que se ve). La siguiente se adelanta cuando la página terminó
     de cargar, para no robarle ancho de banda a la primera; y desde ahí,
     siempre la que viene después de la que se ve. Las demás no se piden
     hasta que tocan: con mala conexión son ~100 KB menos al abrir. */
  const [paginaLista, setPaginaLista] = useState(false)
  useEffect(() => {
    if (document.readyState === 'complete') {
      const id = window.setTimeout(() => setPaginaLista(true), 300)
      return () => window.clearTimeout(id)
    }
    const alCargar = () => setPaginaLista(true)
    window.addEventListener('load', alCargar, { once: true })
    return () => window.removeEventListener('load', alCargar)
  }, [])

  const activo = Math.min(indice, Math.max(total - 1, 0))
  /* Lo más lejos que se ha llegado: lo ya visto no se vuelve a descargar. */
  const [vistoHasta, setVistoHasta] = useState(0)
  if (activo > vistoHasta) setVistoHasta(activo)
  const cargarHasta = Math.max(vistoHasta, activo) + (paginaLista ? 1 : 0)

  if (!total) return null

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
            /* inert y no aria-hidden: las diapositivas que no se ven tienen
               enlaces y botones; con aria-hidden seguían recibiendo el foco
               del teclado (Lighthouse: aria-hidden-focus). inert las saca
               del foco y del árbol de accesibilidad a la vez. */
            <div
              className="carrusel-heroe-slide"
              key={local.id}
              inert={i !== activo}
            >
              <HeroeLocal
                local={local}
                etiqueta={estaAbierto(local) ? 'Abierto ahora' : 'El mejor valorado'}
                prioridad={i === 0}
                cargar={i <= cargarHasta}
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
