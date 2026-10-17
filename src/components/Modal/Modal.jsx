import { createPortal } from 'react-dom'
import './modal.css'

/* Se monta en body: la navbar y el header son sticky con z-index alto dentro del layout.
   Con `veloRef` el oscurecido va en su propia capa, para animarlo con opacity en vez de background-color. */
function Modal({ abierto, onCerrar, children, className = '', veloRef }) {
  if (!abierto) return null

  return createPortal(
    <div
      className={`modal-backdrop${veloRef ? ' modal-backdrop--velo' : ''} ${className}`.trim()}
      onClick={onCerrar}
    >
      {veloRef && <span ref={veloRef} className="modal-velo" aria-hidden="true" />}
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  )
}

export default Modal
