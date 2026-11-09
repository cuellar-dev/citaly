import { MapPin, Phone } from 'lucide-react'
import IconoWhatsApp from '../IconoWhatsApp/IconoWhatsApp.jsx'
import Taly from '../Taly/Taly.jsx'
import SelloCita from './SelloCita.jsx'
import {
  CANCELADA,
  CONFIRMADA,
  POR_TI,
  claveEstadoReserva,
  textoEstadoReserva,
} from '../../utils/estadosCita.js'
import './citaCard.css'

/* Armazón común de una cita del cliente. Es la misma caja para servicio y para
   mesa; lo que cambia de una a otra entra por children. El lenguaje visual es el
   de la agenda de Mi Negocio (.cita-dueno): radio 16, acento --tono por estado,
   hora en la tipografía drink y píldoras de contacto de 999px. */

function sujetoReserva(textoCancelar) {
  return String(textoCancelar).toLowerCase().includes('mesa') ? 'esta mesa' : 'esta cita'
}

/* Dato suelto de la tarjeta: etiqueta arriba en pequeño, valor debajo. */
export function DatoCita({ etiqueta, children, ancho = false }) {
  return (
    <div className={`tarjeta-cita-dato${ancho ? ' tarjeta-cita-dato--ancho' : ''}`}>
      <dt>{etiqueta}</dt>
      <dd>{children}</dd>
    </div>
  )
}

/* Cartel con el mismo corte que los botones, ocupando su sitio. No es accionable. */
function Cartel({ children, tono = 'primario' }) {
  return (
    <p className={`tarjeta-cita-cartel tarjeta-cita-cartel--${tono}`} role="status">
      {children}
    </p>
  )
}

function AccionesCita({
  estadoReserva,
  pasada,
  textoCancelar,
  onVoyPaAlla,
  onCancelar,
}) {
  if (pasada) {
    if (estadoReserva === CANCELADA) {
      return <Cartel tono="cancelar">{`Cancelaste ${sujetoReserva(textoCancelar)}`}</Cartel>
    }
    return null
  }

  if (estadoReserva === CANCELADA) {
    return <Cartel tono="cancelar">{`Cancelaste ${sujetoReserva(textoCancelar)}`}</Cartel>
  }

  if (estadoReserva === CONFIRMADA) {
    return <Cartel tono="primario">{`Confirmaste ${sujetoReserva(textoCancelar)}`}</Cartel>
  }

  if (estadoReserva === POR_TI) {
    return (
      <div className="tarjeta-cita-botones">
        <button
          type="button"
          className="tarjeta-cita-boton tarjeta-cita-boton--primario"
          onClick={onVoyPaAlla}
        >
          Voy pa alla
        </button>
        <button
          type="button"
          className="tarjeta-cita-boton tarjeta-cita-boton--cancelar"
          onClick={onCancelar}
        >
          {textoCancelar}
        </button>
      </div>
    )
  }

  return (
    <div className="tarjeta-cita-botones">
      <p className="tarjeta-cita-nota">Cuando el local acepte, podrás confirmar que vas.</p>
      <button
        type="button"
        className="tarjeta-cita-boton tarjeta-cita-boton--cancelar"
        onClick={onCancelar}
      >
        {textoCancelar}
      </button>
    </div>
  )
}

function TarjetaCita({
  lugar,
  tipo,
  diaTexto,
  horaTexto,
  estadoReserva = 0,
  estadoTexto,
  coste,
  costeEtiqueta = 'Total',
  wasa,
  telefono,
  mapsHref,
  textoCancelar = 'Cancelar',
  onVoyPaAlla,
  onCancelar,
  pasada = false,
  proxima = false,
  etiquetaAria,
  children,
}) {
  const clave = claveEstadoReserva(estadoReserva)
  const acciones = (
    <AccionesCita
      estadoReserva={estadoReserva}
      pasada={pasada}
      textoCancelar={textoCancelar}
      onVoyPaAlla={onVoyPaAlla}
      onCancelar={onCancelar}
    />
  )

  return (
    <article
      className={`tarjeta-cita tarjeta-cita--${clave}${pasada ? ' tarjeta-cita--pasada' : ''}${proxima ? ' tarjeta-cita--proxima' : ''
        }`}
      aria-label={etiquetaAria}
    >
      {/* Taly solo asoma en la cita más cercana: canta para recordártela.
          Ojo con tamano: es el alto de UNA celda del escenario, no el del
          dibujo entero; con 8 el pájaro mide unos 54px de ancho. */}
      {proxima ? (
        <div className="tarjeta-cita-taly" aria-hidden="true">
          <Taly escena="recordatorio" tamano={8} encuadre="compacto" titulo="Taly" />
        </div>
      ) : null}

      <header className="tarjeta-cita-cabecera">
        <div className="tarjeta-cita-identidad">
          <span className="tarjeta-cita-tipo">{tipo}</span>
          <h3 className="tarjeta-cita-lugar">{lugar}</h3>
        </div>
        <div className="tarjeta-cita-cuando">
          <time>{horaTexto}</time>
          <small>{diaTexto}</small>
        </div>
      </header>

      <div className="tarjeta-cita-estado">
        <span className="tarjeta-cita-chip">{textoEstadoReserva(estadoReserva)}</span>
        {estadoTexto ? <span className="tarjeta-cita-falta">{estadoTexto}</span> : null}
      </div>

      {children}

      {/* El sello vive en la fila del total: así tiene su sitio reservado y no
          se monta sobre el texto, pero sigue leyéndose como estampado. */}
      <div className="tarjeta-cita-total">
        <div className="tarjeta-cita-total-cifra">
          <span>{costeEtiqueta}</span>
          <strong>{coste}</strong>
        </div>
        <div className="tarjeta-cita-sello">
          <SelloCita estadoReserva={estadoReserva} pasada={pasada} />
        </div>
      </div>

      {acciones}

      <nav className="tarjeta-cita-enlaces" aria-label={`Contacto con ${lugar}`}>
        <a
          className="tarjeta-cita-enlace"
          href={`https://wa.me/${wasa}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`WhatsApp de ${lugar}`}
        >
          <IconoWhatsApp size={17} />
          <span>WhatsApp</span>
        </a>
        <a
          className="tarjeta-cita-enlace"
          href={`tel:${telefono || wasa}`}
          aria-label={`Llamar a ${lugar}`}
        >
          <Phone size={16} strokeWidth={1.9} />
          <span>Llamar</span>
        </a>
        {mapsHref ? (
          <a
            className="tarjeta-cita-enlace"
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Ubicación de ${lugar}`}
          >
            <MapPin size={16} strokeWidth={1.9} />
            <span>Mapa</span>
          </a>
        ) : null}
      </nav>
    </article>
  )
}

export default TarjetaCita
