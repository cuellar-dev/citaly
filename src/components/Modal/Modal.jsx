import { createPortal } from 'react-dom'
import './modal.css'

/* Se monta en body: la navbar y el header son sticky con z-index alto dentro del layout. */
function Modal({ abierto, onCerrar, children, className = '', fondoRef }) {
  if (!abierto) return null

  return createPortal(
    <div ref={fondoRef} className={`modal-backdrop ${className}`.trim()} onClick={onCerrar}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  )
}

export default Modal
