import { ArrowLeft, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import GuiaReserva from './GuiaReserva.jsx'
import './reserva.css'

/* Armazón de las dos pantallas de reserva (mesa y servicio). Lo que cambia de
   una a otra son los bloques del medio; cabecera, guía, resumen y barra de
   confirmar son los mismos y viven aquí. */

function ReservaShell({
  volverA,
  volverTexto,
  titulo,
  subtitulo,
  guia,
  children,
  barra,
}) {
  return (
    <section className="reserva">
      <header className="reserva-header">
        <Link to={volverA} className="reserva-volver">
          <ArrowLeft size={17} strokeWidth={2.2} />
          {volverTexto}
        </Link>
        <h1 className="reserva-titulo">{titulo}</h1>
        {subtitulo ? <p className="reserva-subtitulo">{subtitulo}</p> : null}
      </header>

      <GuiaReserva {...guia} />

      <div className="reserva-cuerpo">{children}</div>

      {barra}
    </section>
  )
}

/**
 * Cada paso de la reserva es un bloque con su número, su título y, cuando no
 * hay nada que enseñar, su propio vacío explicado (antes era una caja hueca).
 */
export function BloqueReserva({
  numero,
  icono: Icono,
  titulo,
  descripcion,
  hecho = false,
  activo = false,
  vacio,
  children,
  anclaRef,
}) {
  return (
    <section
      ref={anclaRef}
      className={`reserva-bloque${activo ? ' reserva-bloque--activo' : ''}${
        hecho ? ' reserva-bloque--hecho' : ''
      }`}
    >
      <header className="reserva-bloque-cabecera">
        <span className="reserva-bloque-numero" aria-hidden="true">
          {hecho ? <Check size={14} strokeWidth={3} /> : numero}
        </span>
        <div className="reserva-bloque-textos">
          <h2 className="reserva-bloque-titulo">
            {Icono ? <Icono size={16} strokeWidth={2.2} aria-hidden="true" /> : null}
            {titulo}
          </h2>
          {descripcion ? <p className="reserva-bloque-descripcion">{descripcion}</p> : null}
        </div>
      </header>

      {vacio ? <div className="reserva-vacio">{vacio}</div> : children}
    </section>
  )
}

/** Vacío con cara: un icono, una frase y, si hace falta, una pista. */
export function VacioReserva({ icono: Icono, titulo, texto, children }) {
  return (
    <>
      {Icono ? (
        <span className="reserva-vacio-icono" aria-hidden="true">
          <Icono size={22} strokeWidth={1.8} />
        </span>
      ) : null}
      <p className="reserva-vacio-titulo">{titulo}</p>
      {texto ? <p className="reserva-vacio-texto">{texto}</p> : null}
      {children}
    </>
  )
}

/** Filas del resumen: etiqueta a la izquierda, valor a la derecha. */
export function ResumenReserva({ filas }) {
  return (
    <dl className="reserva-resumen">
      {filas.map((fila) => (
        <div
          key={fila.etiqueta}
          className={`reserva-resumen-fila${fila.fuerte ? ' reserva-resumen-fila--fuerte' : ''}`}
        >
          <dt>{fila.etiqueta}</dt>
          <dd>
            {fila.valor ?? '—'}
            {fila.nota ? <span className="reserva-resumen-nota">{fila.nota}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * Barra de confirmar pegada abajo, justo encima de la navbar. Cuando falta
 * algo lo dice, en vez de dejar un botón apagado sin explicación.
 */
export function BarraConfirmar({
  etiqueta = 'Total',
  valor,
  nota,
  texto,
  falta,
  onConfirmar,
}) {
  const bloqueada = Boolean(falta)

  return (
    <div className="reserva-barra">
      <div className="reserva-barra-caja">
        <div className="reserva-barra-cifra">
          <span>{etiqueta}</span>
          <strong>{valor}</strong>
          {nota ? <small>{nota}</small> : null}
        </div>
        <button
          type="button"
          className="reserva-barra-boton"
          disabled={bloqueada}
          onClick={onConfirmar}
        >
          {texto}
        </button>
      </div>
      {bloqueada ? (
        <p className="reserva-barra-falta" aria-live="polite">
          {falta}
        </p>
      ) : null}
    </div>
  )
}

export default ReservaShell
