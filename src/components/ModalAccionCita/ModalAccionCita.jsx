import { createPortal } from 'react-dom'
import { TEXTOS_CANCELAR, TEXTOS_VOY } from './textosAccionCita.js'
import './modalAccionCita.css'

/* Capa aparte (portal a body): no se monta dentro del rollo ni usa clases de .recibo. */

export default function ModalAccionCita({ accion, onConfirmar, onCerrar }) {
  if (!accion) return null

  const esCancelar = accion.tipo === 'cancelar'
  const pack = esCancelar ? TEXTOS_CANCELAR : TEXTOS_VOY

  return createPortal(
    <div
      className={`modal-accion-pantalla${esCancelar ? ' modal-accion-pantalla--cancelar' : ''}`}
      role="presentation"
      onClick={onCerrar}
    >
      <div
        className="modal-accion-papel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-accion-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="modal-accion-marca">* CITALY *</p>
        <h2 id="modal-accion-titulo" className="modal-accion-titulo">
          {esCancelar ? 'Cancelar' : 'Voy pa alla'}
        </h2>
        <hr className="modal-accion-sep" />
        <p className="modal-accion-aviso">{pack.aviso}</p>
        <hr className="modal-accion-sep" />
        <div className="modal-accion-botones">
          <button type="button" className="modal-accion-boton modal-accion-boton--si" onClick={onConfirmar}>
            {accion.textoSi}
          </button>
          <button type="button" className="modal-accion-boton modal-accion-boton--no" onClick={onCerrar}>
            {accion.textoNo}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
