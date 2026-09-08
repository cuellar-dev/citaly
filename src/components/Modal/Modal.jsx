import './modal.css'

function Modal({ abierto, onCerrar, children }) {
  if (!abierto) return null

  return (
    <div className='modal-backdrop' onClick={onCerrar}>
      <div className='modal-panel' onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export default Modal
