import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import './filtroCitas.css'

gsap.registerPlugin(useGSAP)

/* Menú horizontal sobre la lista de citas. La píldora viaja al filtro activo. */
function FiltroCitas({ opciones, activo, onCambiar }) {
  const raizRef = useRef(null)
  const pildoraRef = useRef(null)
  const botonesRef = useRef({})
  const primeraVezRef = useRef(true)

  useGSAP(
    () => {
      const boton = botonesRef.current[activo]
      const pildora = pildoraRef.current
      if (!boton || !pildora) return
      const destino = { x: boton.offsetLeft, width: boton.offsetWidth }
      const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (primeraVezRef.current || reducir) {
        primeraVezRef.current = false
        gsap.set(pildora, destino)
      } else {
        gsap.to(pildora, { ...destino, duration: 0.5, ease: 'expo.out', overwrite: 'auto' })
      }
      const raiz = raizRef.current
      raiz.scrollTo({
        left: boton.offsetLeft - (raiz.clientWidth - boton.offsetWidth) / 2,
        behavior: reducir ? 'auto' : 'smooth',
      })
    },
    { scope: raizRef, dependencies: [activo, opciones.length] }
  )

  return (
    <div className="filtro-citas" ref={raizRef} role="tablist" aria-label="Filtrar citas de hoy">
      <span className="filtro-citas-pildora" ref={pildoraRef} aria-hidden="true" />
      {opciones.map((op) => (
        <button
          key={op.id}
          type="button"
          role="tab"
          aria-selected={activo === op.id}
          className={`filtro-citas-opcion filtro-citas-opcion--${op.id}`}
          ref={(el) => {
            botonesRef.current[op.id] = el
          }}
          onClick={() => onCambiar(op.id)}
        >
          <span className="filtro-citas-punto" aria-hidden="true" />
          {op.label}
          <span className="filtro-citas-cuenta">{op.cantidad}</span>
        </button>
      ))}
    </div>
  )
}

export default FiltroCitas
