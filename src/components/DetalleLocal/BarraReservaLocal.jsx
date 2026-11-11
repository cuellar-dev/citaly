import TalyPluma from '../Taly/TalyPluma.jsx'
import './barraReservaLocal.css'

/* Reservar siempre a mano: pegada abajo, justo encima de la navbar (igual
   que la barra de confirmar de la reserva). A la izquierda, lo que cuesta
   empezar; a la derecha, el botón. Taly se posa en el borde de la caja. */
function BarraReservaLocal({ precio, nota, lugar, onReservar }) {
  return (
    <div className="local-barra">
      <div className="local-barra-caja">
        <TalyPluma tamano={30} className="local-barra-taly" />
        <div className="local-barra-cifra">
          <span>{precio ? 'Desde' : lugar ? 'Reserva' : 'Cita'}</span>
          <strong>{precio ?? (lugar ? 'Tu mesa' : 'Elige servicio')}</strong>
          {nota ? <small>{nota}</small> : null}
        </div>
        <button type="button" className="local-barra-boton" onClick={onReservar}>
          {lugar ? 'Reservar mesa' : 'Reservar cita'}
        </button>
      </div>
    </div>
  )
}

export default BarraReservaLocal
