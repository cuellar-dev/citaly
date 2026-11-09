import { createPortal } from 'react-dom'
import { TEXTOS_CANCELAR, TEXTOS_VOY } from './textosAccionCita.js'
import './modalAccionCita.css'

/* Capa aparte (portal a body): no se monta dentro de la lista de citas. */

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
        className="modal-accion-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-accion-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="modal-accion-eyebrow">
          {esCancelar ? 'Antes de soltarla' : 'Confirmas que vas'}
        </span>
        <h2 id="modal-accion-titulo" className="modal-accion-titulo">
          {esCancelar ? (accion.esMesa ? 'Cancelar la mesa' : 'Cancelar la cita') : 'Voy pa alla'}
        </h2>
        <p className="modal-accion-aviso">{pack.aviso}</p>
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
