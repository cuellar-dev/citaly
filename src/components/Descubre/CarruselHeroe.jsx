import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import HeroeLocal from './HeroeLocal.jsx'
import { ColaFotosContext } from './colaFotos.js'
import './carruselHeroe.css'

/* El héroe de Descubre, ahora en carrusel: los mismos 5 mejores lugares con
   EXACTAMENTE el estilo del héroe de siempre, deslizándose solos cada 3 s.
   No se toca HeroeLocal; solo se envuelve. La sombra del héroe la lleva el
   viewport (que recorta los slides vecinos), así se ve igual que el héroe único.

   Fotos:
   - La primera se pide nada más entrar, con prioridad (es el LCP).
   - La siguiente se adelanta cuando la cola de Descubre llega a la fase 2
     (ya cargaron el héroe y las primeras tarjetas: ver colaFotos.js). Hay
     3 s hasta el primer salto; si aún no llegó, espera hasta 3 s más.
   - El carrusel NO salta a una diapositiva cuya foto no ha llegado: espera
     a que llegue. Así nunca se ve el esqueleto en mitad del pase.
   - Con ahorro de datos o conexión lenta no pasa solo (ni adelanta fotos):
     se cambia con los puntos y cada foto baja al pedirla. */

const PASO_MS = 3000
/* Si la foto de la siguiente no llega en este tiempo, se salta igual: antes
   el carrusel podía quedarse esperándola para siempre. */
const ESPERA_FOTO_MAX_MS = 3000

function prefiereQuieto() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/* Solo se queda quieto con "ahorro de datos" o 2g. El 3g ya no lo apaga:
   `effectiveType` es una ESTIMACIÓN que el navegador hace en cada carga y en
   la primera visita suele salir pesimista; al recargar mejoraba y por eso el
   carrusel "arrancaba tras un par de recargas". */
function puedeAutoplay() {
  if (prefiereQuieto()) return false
  const c = typeof navigator !== 'undefined' ? navigator.connection : null
  if (!c) return true
  if (c.saveData) return false
  return !/(^|-)2g$/.test(c.effectiveType || '')
}

function CarruselHeroe({ locales = [], motivos }) {
  const cola = useContext(ColaFotosContext)
  const [indice, setIndice] = useState(0)
  const [pausado, setPausado] = useState(false)
  const [autoplay, setAutoplay] = useState(puedeAutoplay)
  const total = locales.length

  /* La conexión cambia (o se afina la estimación): se vuelve a decidir. */
  useEffect(() => {
    const c = navigator.connection
    if (!c?.addEventListener) return undefined
    const alCambiar = () => setAutoplay(puedeAutoplay())
    c.addEventListener('change', alCambiar)
    return () => c.removeEventListener('change', alCambiar)
  }, [])

  /* El índice vuelve a cero si cambia la lista y se queda fuera de rango. */
  useEffect(() => {
    if (indice >= total) setIndice(0)
  }, [total, indice])

  const activo = Math.min(indice, Math.max(total - 1, 0))

  /* Diapositivas con la foto ya en pantalla, y la que espera para entrar.
     Refs y no estado: no cambian lo que se pinta, solo cuándo se salta.
     Van por ID del local y no por posición: si la lista se reordena al
     llegar los datos, la foto ya cargada sigue siendo la misma (con
     posiciones, el carrusel esperaba un aviso que nunca volvía a llegar). */
  const cargadasRef = useRef(new Set())
  const esperandoRef = useRef(null)
  const pausadoRef = useRef(pausado)
  const localesRef = useRef(locales)
  useEffect(() => {
    pausadoRef.current = pausado
    localesRef.current = locales
  })

  /* Un temporizador que se re-arma tras cada cambio (manual o automático): así
     tocar un punto reinicia la cuenta en vez de saltar enseguida. Si la
     siguiente aún no tiene foto, espera a que llegue, con un tope. */
  useEffect(() => {
    if (!autoplay || pausado || total <= 1) return undefined
    let tope
    const id = window.setTimeout(() => {
      const sig = (activo + 1) % total
      const idSig = locales[sig].id
      if (cargadasRef.current.has(idSig)) {
        setIndice(sig)
        return
      }
      esperandoRef.current = idSig
      tope = window.setTimeout(() => {
        if (esperandoRef.current !== idSig) return
        esperandoRef.current = null
        setIndice(sig)
      }, ESPERA_FOTO_MAX_MS)
    }, PASO_MS)
    return () => {
      window.clearTimeout(id)
      window.clearTimeout(tope)
      esperandoRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, total, pausado, autoplay])

  const alListo = useCallback(
    (idLocal, i) => {
      cargadasRef.current.add(idLocal)
      if (i === 0) cola?.avisarHeroe()
      if (esperandoRef.current === idLocal && !pausadoRef.current) {
        esperandoRef.current = null
        const pos = localesRef.current.findIndex((l) => l.id === idLocal)
        if (pos >= 0) setIndice(pos)
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
                /* Por qué está aquí (utils/ranking/motivos.js); si no hay un motivo
                   claro, una etiqueta neutra. Antes decía "El mejor valorado"
                   aunque no lo fuera, y "Abierto ahora" repetía la píldora de al lado. */
                etiqueta={motivos?.get(local.id) ?? 'Destacado hoy'}
                prioridad={i === 0}
                cargar={debeCargar(i)}
                alListo={() => alListo(local.id, i)}
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
