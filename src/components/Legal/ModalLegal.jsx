import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import DocumentoLegal from './DocumentoLegal.jsx'
import { DOCS, irASeccion } from './documentos.js'

/* Los términos y la privacidad sin salir de donde estás (el registro, el
   alta de un local): así no se pierde lo que ya habías escrito.

   En el móvil ocupa toda la pantalla; en escritorio es una hoja de lectura
   centrada. Arriba, las dos pestañas; abajo, «Entendido».

   `doc`      'terminos' | 'privacidad' — con cuál se abre.
   `seccion`  id de una sección para abrir ya en ella (p. ej. 't-negocios'). */

function ModalLegal({ abierto, onCerrar, doc = 'terminos', seccion }) {
  const [actual, setActual] = useState(doc)
  const [abiertoAntes, setAbiertoAntes] = useState(abierto)
  const cuerpoRef = useRef(null)
  const cerrarRef = useRef(null)

  /* Cada vez que se abre, empieza por el documento que piden. */
  if (abierto !== abiertoAntes) {
    setAbiertoAntes(abierto)
    if (abierto) setActual(doc)
  }

  const cerrar = useEffectEvent(() => onCerrar())

  useEffect(() => {
    if (!abierto) return undefined
    const previo = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cerrarRef.current?.focus({ preventScroll: true })
    if (seccion) requestAnimationFrame(() => irASeccion(seccion))

    const alTeclear = (e) => e.key === 'Escape' && cerrar()
    window.addEventListener('keydown', alTeclear)
    return () => {
      window.removeEventListener('keydown', alTeclear)
      document.body.style.overflow = overflow
      previo?.focus?.({ preventScroll: true })
    }
  }, [abierto, seccion])

  function cambiar(id) {
    setActual(id)
    cuerpoRef.current?.scrollTo({ top: 0 })
  }

  if (!abierto) return null

  return createPortal(
    <div className="legal-modal" onClick={onCerrar}>
      <div
        className="legal-modal-hoja"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${actual}-titulo`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="legal-modal-barra">
          <div className="legal-pestanas" role="tablist" aria-label="Documento">
            {Object.values(DOCS).map((d) => (
              <button
                key={d.id}
                type="button"
                role="tab"
                aria-selected={actual === d.id}
                className="legal-pestana"
                onClick={() => cambiar(d.id)}
              >
                {d.corto}
              </button>
            ))}
          </div>
          <button ref={cerrarRef} type="button" className="legal-modal-cerrar" onClick={onCerrar} aria-label="Cerrar">
            <X size={20} strokeWidth={2.25} aria-hidden="true" />
          </button>
        </div>

        <div ref={cuerpoRef} className="legal-modal-cuerpo">
          <DocumentoLegal doc={actual} onCambiarDoc={cambiar} nivel={2} />
        </div>

        <div className="legal-modal-pie">
          <button type="button" className="legal-entendido" onClick={onCerrar}>
            Entendido
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ModalLegal
