import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import { Minus, Plus, X } from 'lucide-react'
import Plano from './Plano.jsx'
import { PestanasPisos } from './VisorPlano.jsx'

/* El plano a pantalla completa, con pellizco o botones para acercar. Pensado
   para locales grandes en el móvil, donde las mesas se ven pequeñas. Tocar
   una mesa la elige y cierra la vista. Esc también cierra. */

function VistaGrande({ plano, pisoInicial, estados, elegidas, unir, onMesa, titulo, onCerrar }) {
  const [piso, setPiso] = useState(pisoInicial)
  const cerrarRef = useRef(null)

  useEffect(() => {
    const previo = document.activeElement
    cerrarRef.current?.focus()
    const alTeclado = (e) => {
      if (e.key === 'Escape') onCerrar()
    }
    const scroll = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', alTeclado)
    return () => {
      document.body.style.overflow = scroll
      document.removeEventListener('keydown', alTeclado)
      previo?.focus?.()
    }
  }, [onCerrar])

  return createPortal(
    <div className="vista-grande" role="dialog" aria-modal="true" aria-label={titulo}>
      <header className="vista-grande-barra">
        <p className="vista-grande-titulo">{titulo}</p>
        <button ref={cerrarRef} type="button" className="vista-grande-cerrar" onClick={onCerrar} aria-label="Cerrar el plano">
          <X size={20} strokeWidth={2.3} aria-hidden="true" />
        </button>
      </header>
      <PestanasPisos plano={plano} piso={piso} onPiso={setPiso} estados={estados} />
      <TransformWrapper minScale={1} maxScale={4} doubleClick={{ mode: 'zoomIn', step: 0.7 }} wheel={{ step: 0.12 }}>
        {({ zoomIn, zoomOut }) => (
          <>
            <TransformComponent wrapperClass="vista-grande-zona" contentClass="vista-grande-contenido">
              <Plano plano={plano} piso={piso} estados={estados} elegidas={elegidas} unir={unir} onMesa={onMesa} titulo={titulo} />
            </TransformComponent>
            <div className="vista-grande-zoom">
              <button type="button" onClick={() => zoomOut()} aria-label="Alejar">
                <Minus size={18} strokeWidth={2.4} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => zoomIn()} aria-label="Acercar">
                <Plus size={18} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </TransformWrapper>
      <p className="vista-grande-pista">Pellizca o usa los botones para acercar</p>
    </div>,
    document.body,
  )
}

export default VistaGrande
