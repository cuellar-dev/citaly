import { MapPin, Phone, Scissors } from 'lucide-react'
import IconoWhatsApp from '../IconoWhatsApp/IconoWhatsApp.jsx'
import { tinta } from './tinta.js'
import './citaCard.css'

/* Piezas de un segmento de recibo térmico. Se comparten entre CitaServicio y CitaLugar. */

/* Los cuatro estados de reserva, en tinta (mismo mapeo que antes: 0/2 ámbar, 1 verde, 3 rojo). */
const ESTADOS = {
  0: { texto: 'Pendiente', clase: 'recibo-estado--aviso' },
  1: { texto: 'Confirmado', clase: 'recibo-estado--ok' },
  2: { texto: 'Pendiente de confirmar', clase: 'recibo-estado--aviso' },
  3: { texto: 'Cancelado', clase: 'recibo-estado--mal' },
}

export function ReciboEncabezado({ lugar, numero, tipo }) {
  return (
    <header className="recibo-encabezado">
      <p className="recibo-marca">* CITALY *</p>
      <h3 className="recibo-lugar">{tinta(lugar)}</h3>
      <p className="recibo-tipo">
        <span>{tipo}</span>
        <span>No. {String(numero).padStart(3, '0')}</span>
      </p>
    </header>
  )
}

export function ReciboSeparador({ doble = false }) {
  return <hr className={`recibo-sep${doble ? ' recibo-sep--doble' : ''}`} />
}

export function ReciboFila({ etiqueta, children, grande = false, className = '' }) {
  return (
    <div className={`recibo-fila${grande ? ' recibo-fila--grande' : ''} ${className}`.trim()}>
      <dt>{etiqueta}</dt>
      <dd>{tinta(children)}</dd>
    </div>
  )
}

export function ReciboEstado({ estadoReserva = 0 }) {
  const estado = ESTADOS[estadoReserva] ?? ESTADOS[0]
  return <span className={`recibo-estado ${estado.clase}`}>{estado.texto}</span>
}

/* Línea de corte punteada con su texto ("TALÓN", "CORTE AQUÍ"). */
export function ReciboCorte({ texto }) {
  return (
    <div className="recibo-corte" aria-hidden="true">
      <Scissors size={13} strokeWidth={1.75} className="recibo-corte-tijera" />
      <span className="recibo-corte-texto">{texto}</span>
    </div>
  )
}

/* Talón recortable con las acciones. Vive dentro del papel. */
export function ReciboTalon({ lugar, wasa, telefono, mapsHref, textoCancelar = 'Cancelar' }) {
  return (
    <footer className="recibo-talon">
      <ReciboCorte texto="acciones" />
      <div className="recibo-botones">
        <button type="button" className="recibo-boton recibo-boton--primario">
          Voy pa alla
        </button>
        <button type="button" className="recibo-boton recibo-boton--cancelar">
          {textoCancelar}
        </button>
      </div>
      <nav className="recibo-enlaces" aria-label={`Contacto con ${lugar}`}>
        <a
          className="recibo-enlace"
          href={`https://wa.me/${wasa}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`WhatsApp de ${lugar}`}
        >
          <IconoWhatsApp size={18} />
          <span>WhatsApp</span>
        </a>
        <a className="recibo-enlace" href={`tel:${telefono || wasa}`} aria-label={`Llamar a ${lugar}`}>
          <Phone size={17} strokeWidth={1.75} />
          <span>Llamar</span>
        </a>
        {mapsHref && (
          <a
            className="recibo-enlace"
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Ubicación de ${lugar}`}
          >
            <MapPin size={17} strokeWidth={1.75} />
            <span>Mapa</span>
          </a>
        )}
      </nav>
      <ReciboCorte texto="corte" />
    </footer>
  )
}
