import { createPortal } from 'react-dom'
import { Check } from 'lucide-react'
import './avisoBreve.css'

/* Aviso corto que sube, se lee y se va solo (el tiempo lo lleva quien lo
   abre). role="status": el lector de pantalla lo dice sin robar el foco. */
function AvisoBreve({ texto }) {
  return createPortal(
    <div className="aviso-breve-zona" role="status" aria-live="polite">
      {texto ? (
        <div className="aviso-breve" key={texto}>
          <Check size={16} aria-hidden="true" />
          {texto}
        </div>
      ) : null}
    </div>,
    document.body,
  )
}

export default AvisoBreve
