import TalyPluma from '../Taly/TalyPluma.jsx'
import './barraReservaLocal.css'

/* Reservar siempre a mano: pegada abajo, justo encima de la navbar (igual
   que la barra de confirmar de la reserva). A la izquierda, lo que cuesta
   empezar; a la derecha, el botón. Taly se posa en el borde de la caja. */
const TEXTOS = {
  mesa: { vacio: 'Reserva', sinPrecio: 'Tu mesa', boton: 'Reservar mesa' },
  servicio: { vacio: 'Cita', sinPrecio: 'Elige servicio', boton: 'Reservar cita' },
  suscripcion: { vacio: 'Cuota', sinPrecio: 'Ver planes', boton: 'Unirme' },
}

function BarraReservaLocal({ precio, etiqueta = 'Desde', nota, tipo = 'servicio', onReservar }) {
  const textos = TEXTOS[tipo] ?? TEXTOS.servicio
  return (
    <div className="local-barra">
      <div className="local-barra-caja">
        <TalyPluma tamano={30} className="local-barra-taly" />
        <div className="local-barra-cifra">
          <span>{precio ? etiqueta : textos.vacio}</span>
          <strong>{precio ?? textos.sinPrecio}</strong>
          {nota ? <small>{nota}</small> : null}
        </div>
        <button type="button" className="local-barra-boton" onClick={onReservar}>
          {textos.boton}
        </button>
      </div>
    </div>
  )
}

export default BarraReservaLocal
