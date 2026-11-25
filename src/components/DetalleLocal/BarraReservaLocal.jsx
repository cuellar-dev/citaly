import { useEffect, useRef, useState } from 'react'
import TalyPixel from '../Taly/TalyPixel.jsx'
import './barraReservaLocal.css'

/* Reservar siempre a mano: pegada abajo, justo encima de la navbar (igual
   que la barra de confirmar de la reserva). A la izquierda, lo que cuesta
   empezar; a la derecha, el botón. Taly, en pixel art, vive en el borde de
   la caja: pasea, parpadea, duerme si el local está cerrado y salta al
   tocar Reservar. */
const TEXTOS = {
  mesa: { vacio: 'Reserva', sinPrecio: 'Tu mesa', boton: 'Reservar mesa' },
  servicio: { vacio: 'Cita', sinPrecio: 'Elige servicio', boton: 'Reservar cita' },
  suscripcion: { vacio: 'Cuota', sinPrecio: 'Ver planes', boton: 'Unirme' },
}

/* Lo justo para que se vea el brinco antes de cambiar de página. */
const SALTO_MS = 220

function BarraReservaLocal({ precio, etiqueta = 'Desde', nota, tipo = 'servicio', cerrado = false, onReservar }) {
  const textos = TEXTOS[tipo] ?? TEXTOS.servicio
  const [saltando, setSaltando] = useState(false)
  const temporizador = useRef(null)

  useEffect(() => () => clearTimeout(temporizador.current), [])

  const reservar = () => {
    if (saltando) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onReservar?.()
      return
    }
    setSaltando(true)
    temporizador.current = setTimeout(() => {
      setSaltando(false)
      onReservar?.()
    }, SALTO_MS)
  }

  return (
    <div className="local-barra">
      <div className="local-barra-caja">
        <TalyPixel dormido={cerrado && !saltando} saltando={saltando} className="local-barra-taly" />
        <div className="local-barra-cifra">
          <span>{precio ? etiqueta : textos.vacio}</span>
          <strong>{precio ?? textos.sinPrecio}</strong>
          {nota ? <small>{nota}</small> : null}
        </div>
        <button type="button" className="local-barra-boton" onClick={reservar}>
          {textos.boton}
        </button>
      </div>
    </div>
  )
}

export default BarraReservaLocal
