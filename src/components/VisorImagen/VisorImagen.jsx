import './visorimagen.css'
import { XIcon } from 'lucide-react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

function VisorImagen({ url, alt, onClose }) {
  return (
    <div className="visor-imagen-back" onClick={onClose}>
      <button
        type="button"
        className="visor-imagen-close"
        onClick={onClose}
        aria-label="Cerrar"
      >
        <XIcon size={30} />
      </button>

      <div
        className="visor-imagen-zoom"
        onClick={(e) => e.stopPropagation()}
      >
        <TransformWrapper
          initialScale={1}
          minScale={1}
          maxScale={3}
          centerOnInit
          wheel={{ step: 0.01 }}
          doubleClick={{ mode: 'zoomIn', step: 3 }}
          pinch={{ step: 5 }}
        >
          <TransformComponent
            wrapperClass="visor-imagen-transform-wrapper"
            contentClass="visor-imagen-transform-content"
          >
            <img src={url} alt={alt} className="visor-imagen" draggable={false} />
          </TransformComponent>
        </TransformWrapper>
      </div>
    </div>
  )
}

export default VisorImagen
