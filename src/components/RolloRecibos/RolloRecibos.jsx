import { useCallback, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import './rolloRecibos.css'

gsap.registerPlugin(useGSAP)

/* Inclinación base del papel (se ve ligeramente desde abajo y se dobla hacia atrás). */
const INCLINACION = 7
/* Alto provisional de los segmentos aún no renderizados (fuera de la ventana activa ±1). */
const ALTO_ESTIMADO = 560
/* Desplazamiento mínimo del dedo para contar como swipe. */
const UMBRAL_SWIPE = 42

/**
 * Rollo continuo de recibos: todas las citas en UNA tira de papel que sale de la
 * ranura del POS. La "cámara" es un único translateY sobre la tira (GSAP).
 *
 * renderCita(cita, indice) devuelve el segmento (<CitaServicio/> o <CitaLugar/>).
 */
export default function RolloRecibos({ citas, renderCita }) {
  const total = citas.length
  /* Posición de la cámara: cita activa + paso (0 = cabecera arriba, 1 = talón a la vista).
     El paso 1 solo existe si el recibo es más alto que el visor. */
  const [posicion, setPosicion] = useState({ i: 0, paso: 0 })
  /* Si la lista se acorta (p. ej. una cita cancelada), el índice se acota aquí, sin efectos. */
  const indice = Math.min(posicion.i, Math.max(0, total - 1))
  const paso = posicion.i === indice ? posicion.paso : 0
  const [alturas, setAlturas] = useState({})
  /* ¿El recibo activo necesita dos paradas? Se mide tras layout, en el efecto. */
  const [activoAlto, setActivoAlto] = useState(false)

  const escenaRef = useRef(null)
  const visorRef = useRef(null)
  const camaraRef = useRef(null)
  const tiraRef = useRef(null)
  const segmentosRef = useRef([])
  const primeraVezRef = useRef(true)
  const toqueRef = useRef(null)
  const ultimaRuedaRef = useRef(0)

  const claveCitas = citas.map((c) => c.id).join('|')

  /* Alto de papel visible entre el borde superior del visor y la ranura. */
  const altoUtil = () => {
    const visor = visorRef.current
    const tira = tiraRef.current
    if (!visor || !tira) return 0
    const ranura = parseFloat(getComputedStyle(visor).getPropertyValue('--pos-ranura-alto')) || 30
    return visor.clientHeight - ranura - tira.offsetTop
  }
  const esAlto = (i) => {
    const el = segmentosRef.current[i]
    return !!el && el.offsetHeight > altoUtil() + 6
  }

  const ir = useCallback(
    (delta) =>
      setPosicion((actual) => {
        const i = Math.min(actual.i, total - 1)
        if (delta > 0) {
          if (actual.paso === 0 && esAlto(i)) return { i, paso: 1 }
          return i >= total - 1 ? actual : { i: i + 1, paso: 0 }
        }
        if (actual.paso === 1) return { i, paso: 0 }
        if (i <= 0) return actual
        // Al retroceder se llega por el talón de la cita anterior, como al rebobinar papel.
        return { i: i - 1, paso: esAlto(i - 1) ? 1 : 0 }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- esAlto solo lee el DOM
    [total],
  )

  /* Coloca la cámara sobre la cita activa. Se ejecuta tras layout (useGSAP = layout effect). */
  useGSAP(
    () => {
      const camara = camaraRef.current
      const tira = tiraRef.current
      const activo = segmentosRef.current[indice]
      if (!camara || !tira || !activo) return

      // Memoriza el alto real de los segmentos renderizados para que sus
      // sustitutos en blanco ocupen lo mismo cuando salgan de la ventana.
      const nuevas = {}
      segmentosRef.current.forEach((el, i) => {
        const cita = citas[i]
        if (el && cita && el.dataset.real === '1') nuevas[cita.id] = el.offsetHeight
      })
      setAlturas((previas) => {
        const cambia = Object.keys(nuevas).some((id) => previas[id] !== nuevas[id])
        return cambia ? { ...previas, ...nuevas } : previas
      })

      setActivoAlto(esAlto(indice))

      // Paso 0: cabecera del recibo arriba. Paso 1: su final (talón) justo sobre la ranura.
      const destino = () =>
        paso === 1
          ? -Math.max(activo.offsetTop, activo.offsetTop + activo.offsetHeight - altoUtil())
          : -activo.offsetTop
      const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      // Encuadre base de la cámara. Se fija siempre: el revert de useGSAP (StrictMode) lo borra.
      gsap.set(camara, { xPercent: -50, rotationX: INCLINACION, transformOrigin: '50% 100%' })

      if (primeraVezRef.current || sinMovimiento) {
        primeraVezRef.current = false
        gsap.set(tira, { y: destino() })
      } else {
        // Un solo translateY con rebote sutil al asentarse (el rollo tiene peso),
        // más un cabeceo mínimo del papel al arrancar, como si tirara de él la impresora.
        const tl = gsap.timeline({ defaults: { overwrite: 'auto' } })
        tl.to(tira, { y: destino(), duration: 0.85, ease: 'back.out(1.35)' }, 0)
          .to(camara, { rotationX: INCLINACION - 1.8, duration: 0.16, ease: 'power2.out' }, 0)
          .to(camara, { rotationX: INCLINACION, duration: 0.75, ease: 'elastic.out(1, 0.55)' }, 0.16)
      }

      // Si el visor cambia de alto (giro del móvil, teclado), recoloca sin animar y re-mide.
      let primeraMedida = true
      const observador = new ResizeObserver(() => {
        if (primeraMedida) {
          primeraMedida = false
          return
        }
        gsap.killTweensOf(tira)
        gsap.set(tira, { y: destino() })
        setActivoAlto(esAlto(indice))
      })
      observador.observe(visorRef.current)
      return () => observador.disconnect()
    },
    { dependencies: [indice, paso, claveCitas], scope: escenaRef },
  )

  /* Teclado: flechas arriba/abajo, PageUp/PageDown, Inicio/Fin. */
  const alTeclado = (e) => {
    // Dentro del papel (botones del talón, enlaces) el teclado es suyo.
    if (e.target.closest('.rollo-tira')) return
    switch (e.key) {
      case 'ArrowDown':
      case 'PageDown':
        e.preventDefault()
        ir(1)
        break
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault()
        ir(-1)
        break
      case 'Home':
        e.preventDefault()
        setPosicion({ i: 0, paso: 0 })
        break
      case 'End':
        e.preventDefault()
        setPosicion({ i: total - 1, paso: 0 })
        break
      default:
    }
  }

  /* Swipe vertical: el dedo hacia arriba alimenta papel (siguiente). */
  const alPulsar = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    toqueRef.current = { y: e.clientY, x: e.clientX }
  }
  const alSoltar = (e) => {
    const inicio = toqueRef.current
    toqueRef.current = null
    if (!inicio) return
    const dy = e.clientY - inicio.y
    const dx = e.clientX - inicio.x
    if (Math.abs(dy) < UMBRAL_SWIPE || Math.abs(dx) > Math.abs(dy)) return
    ir(dy < 0 ? 1 : -1)
  }

  /* Rueda del ratón, con freno para que un gesto sea una cita. */
  const alRueda = (e) => {
    const ahora = performance.now()
    if (Math.abs(e.deltaY) < 10 || ahora - ultimaRuedaRef.current < 550) return
    ultimaRuedaRef.current = ahora
    ir(e.deltaY > 0 ? 1 : -1)
  }

  return (
    <div
      ref={escenaRef}
      className="pos-escena"
      data-indice={indice}
      data-paso={paso}
      tabIndex={0}
      role="region"
      aria-roledescription="rollo de recibos"
      aria-label={`Recibos de citas, ${indice + 1} de ${total}. Flechas arriba y abajo para moverte.`}
      onKeyDown={alTeclado}
      onPointerDown={alPulsar}
      onPointerUp={alSoltar}
      onPointerCancel={() => (toqueRef.current = null)}
      onWheel={alRueda}
    >
      <div className="pos-controles">
        <button
          type="button"
          className="pos-flecha"
          onClick={() => ir(-1)}
          disabled={indice === 0}
          aria-label="Cita anterior"
        >
          <ChevronUp size={22} strokeWidth={2.25} />
        </button>
        <p className="pos-contador" aria-live="polite" aria-atomic="true">
          <span className="pos-contador-actual">{indice + 1}</span>
          <span className="pos-contador-oculto"> de </span>
          <span className="pos-contador-sep" aria-hidden="true" />
          <span className="pos-contador-total">{total}</span>
        </p>
        <button
          type="button"
          className="pos-flecha"
          onClick={() => ir(1)}
          disabled={indice === total - 1 && (paso === 1 || !activoAlto)}
          aria-label={paso === 0 && activoAlto ? 'Ver el resto del recibo' : 'Cita siguiente'}
        >
          <ChevronDown size={22} strokeWidth={2.25} />
        </button>
      </div>

      <div ref={visorRef} className="pos-visor">
        <div ref={camaraRef} className="rollo-camara">
          <ol ref={tiraRef} className="rollo-tira">
            {citas.map((cita, i) => {
              const real = Math.abs(i - indice) <= 1
              const activo = i === indice
              return (
                <li
                  key={cita.id}
                  ref={(el) => {
                    segmentosRef.current[i] = el
                  }}
                  data-real={real ? '1' : '0'}
                  className={`rollo-segmento${activo ? ' rollo-segmento--activo' : ''}`}
                  style={real ? undefined : { height: alturas[cita.id] ?? ALTO_ESTIMADO }}
                  aria-hidden={!activo}
                  inert={!activo}
                >
                  {real ? renderCita(cita, i) : null}
                </li>
              )
            })}
          </ol>
        </div>
        <div className="pos-ranura" aria-hidden="true" />
      </div>
    </div>
  )
}
