import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import HeroeLocal from './HeroeLocal.jsx'
import { ColaFotosContext } from './colaFotos.js'
import { estaAbierto } from '../../utils/fichaLocal.js'
import { conexionHolgada } from '../../paginas.js'
import './carruselHeroe.css'

/* El héroe de Descubre, ahora en carrusel: los mismos 5 mejores lugares con
   EXACTAMENTE el estilo del héroe de siempre, deslizándose solos cada 4 s.
   No se toca HeroeLocal; solo se envuelve. La sombra del héroe la lleva el
   viewport (que recorta los slides vecinos), así se ve igual que el héroe único.

   Fotos:
   - La primera se pide nada más entrar, con prioridad (es el LCP).
   - La siguiente se adelanta cuando la cola de Descubre llega a la fase 2
     (ya cargaron el héroe y las primeras tarjetas: ver colaFotos.js). Hay
     4 s hasta el primer salto, tiempo de sobra para que llegue.
   - El carrusel NO salta a una diapositiva cuya foto no ha llegado: espera
     a que llegue. Así nunca se ve el esqueleto en mitad del pase.
   - Con ahorro de datos o conexión lenta no pasa solo (ni adelanta fotos):
     se cambia con los puntos y cada foto baja al pedirla. */

const PASO_MS = 4000

function prefiereQuieto() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function CarruselHeroe({ locales = [] }) {
  const cola = useContext(ColaFotosContext)
  const [indice, setIndice] = useState(0)
  const [pausado, setPausado] = useState(false)
  const [autoplay] = useState(() => !prefiereQuieto() && conexionHolgada())
  const total = locales.length

  /* El índice vuelve a cero si cambia la lista y se queda fuera de rango. */
  useEffect(() => {
    if (indice >= total) setIndice(0)
  }, [total, indice])

  const activo = Math.min(indice, Math.max(total - 1, 0))

  /* Diapositivas con la foto ya en pantalla, y la que espera para entrar.
     Refs y no estado: no cambian lo que se pinta, solo cuándo se salta. */
  const cargadasRef = useRef(new Set())
  const esperandoRef = useRef(null)
  const pausadoRef = useRef(pausado)
  useEffect(() => {
    pausadoRef.current = pausado
  }, [pausado])

  /* Un temporizador que se re-arma tras cada cambio (manual o automático): así
     tocar un punto reinicia la cuenta en vez de saltar enseguida. Si la
     siguiente aún no tiene foto, se queda esperando a que llegue. */
  useEffect(() => {
    if (!autoplay || pausado || total <= 1) return undefined
    const id = window.setTimeout(() => {
      const siguiente = (activo + 1) % total
      if (cargadasRef.current.has(siguiente)) setIndice(siguiente)
      else esperandoRef.current = siguiente
    }, PASO_MS)
    return () => window.clearTimeout(id)
  }, [activo, total, pausado, autoplay])

  const alListo = useCallback(
    (i) => {
      cargadasRef.current.add(i)
      if (i === 0) cola?.avisarHeroe()
      if (esperandoRef.current === i && !pausadoRef.current) {
        esperandoRef.current = null
        setIndice(i)
      }
    },
    [cola],
  )

  /* Lo más lejos que se ha llegado: lo ya visto no se vuelve a descargar. */
  const [vistoHasta, setVistoHasta] = useState(0)
  if (activo > vistoHasta) setVistoHasta(activo)

  /* ¿Se puede adelantar ya la siguiente? Fuera de Descubre (sin cola), sí. */
  const adelantar = autoplay && (!cola || cola.fase >= 2)
  const siguiente = (activo + 1) % Math.max(total, 1)
  const debeCargar = (i) => i === 0 || i <= vistoHasta || (adelantar && i === siguiente)

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
                cargar={debeCargar(i)}
                alListo={() => alListo(i)}
                imp={{ bloque: 'heroe', posicion: i }}
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
              onClick={() => {
                esperandoRef.current = null
                setIndice(i)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default CarruselHeroe
