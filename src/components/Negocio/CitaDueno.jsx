import { useId, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { Check, ChevronDown, Clock, Hourglass, MessageCircle, Phone, Scissors, UtensilsCrossed, X } from 'lucide-react'
import { HORA_PROPUESTA, PENDIENTE, claveEstadoReserva, textoEstadoReserva } from '../../utils/estadosCita.js'
import { diaEnFrase, horaCorta } from '../../utils/proponerHora.js'
import ProponerHora from './ProponerHora.jsx'
import './citaDueno.css'

gsap.registerPlugin(useGSAP)

function textoDuracion(min) {
  if (!min) return null
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${m}` : `${h} h`
}

function primerNombre(nombre) {
  return String(nombre || '').trim().split(/\s+/)[0] || 'el cliente'
}

/* Una fila de la agenda del dueño. Cerrada dice lo justo; al tocarla enseña el resto.
   Pendiente: aceptar, rechazar o proponer otra hora (el reloj). Con la hora
   propuesta, la fila espera la respuesta del cliente y se puede retirar. */
function CitaDueno({
  hora,
  relativo,
  cliente,
  telefono,
  linea,
  detalle,
  esLugar = false,
  duracion,
  precio,
  estadoReserva = PENDIENTE,
  atendida = false,
  destacada = false,
  onConfirmar,
  onRechazar,
  fecha,
  horario,
  propuesta,
  propuestaVence,
  localNombre,
  diasProponer,
  onProponer,
  onRetirarPropuesta,
}) {
  const [abierta, setAbierta] = useState(false)
  const [proponiendo, setProponiendo] = useState(false)
  const raizRef = useRef(null)
  const detalleRef = useRef(null)
  const primeraVezRef = useRef(true)

  const estadoTexto = destacada ? 'En curso' : atendida ? 'Atendida' : textoEstadoReserva(estadoReserva, { dueno: true })
  const IconoTipo = esLugar ? UtensilsCrossed : Scissors
  const tel = String(telefono || '').replace(/\D/g, '')
  const duracionTexto = textoDuracion(duracion)
  const pendiente = estadoReserva === PENDIENTE && (onConfirmar || onRechazar)
  const clave = claveEstadoReserva(estadoReserva)
  const idDetalle = useId()
  const nombre = primerNombre(cliente)
  const puedeProponer = Boolean(pendiente && onProponer && diasProponer)
  const conPropuesta = estadoReserva === HORA_PROPUESTA && Boolean(propuesta)
  const textoPropuesta = conPropuesta
    ? `${horaCorta(propuesta.horario)}${propuesta.fecha !== fecha ? ` (${diaEnFrase(propuesta.fecha)})` : ''}`
    : null
  const mensajeWa = conPropuesta
    ? `Hola ${nombre}, te escribo de ${localNombre || 'el local'}. A las ${horaCorta(horario ?? '00:00')} no puedo atenderte y te propuse las ${horaCorta(propuesta.horario)} ${diaEnFrase(propuesta.fecha)} en Citaly. ¿Te sirve?`
    : ''

  const abrirProponer = () => {
    setProponiendo(true)
    setAbierta(true)
  }
  const proponer = (nueva) => {
    setProponiendo(false)
    onProponer(nueva)
  }

  useGSAP(
    () => {
      const panel = detalleRef.current
      if (!panel) return
      const d = window.matchMedia('(prefers-reduced-motion: reduce)').matches || primeraVezRef.current ? 0 : 1
      primeraVezRef.current = false
      gsap.to(panel, {
        height: abierta ? 'auto' : 0,
        autoAlpha: abierta ? 1 : 0,
        duration: (abierta ? 0.42 : 0.28) * d,
        ease: abierta ? 'power3.out' : 'power2.in',
        overwrite: 'auto',
      })
      gsap.to('.cita-dueno-flecha', { rotation: abierta ? 180 : 0, duration: 0.3 * d, ease: 'power2.out' })
      if (abierta && d) {
        gsap.from(panel.children, { y: 8, opacity: 0, duration: 0.35, stagger: 0.05, delay: 0.08, ease: 'power2.out' })
      }
    },
    { scope: raizRef, dependencies: [abierta, proponiendo, conPropuesta] }
  )

  return (
    <article
      ref={raizRef}
      className={`cita-dueno cita-dueno--${clave}${atendida ? ' cita-dueno--atendida' : ''}${destacada ? ' cita-dueno--destacada' : ''}${abierta ? ' cita-dueno--abierta' : ''}`}
    >
      <div className="cita-dueno-fila">
        <button
          type="button"
          className="cita-dueno-resumen"
          aria-expanded={abierta}
          aria-controls={idDetalle}
          onClick={() => setAbierta((v) => !v)}
        >
          <span className="cita-dueno-tiempo">
            <time dateTime={hora}>{hora}</time>
            {relativo && <span className="cita-dueno-relativo">{relativo}</span>}
          </span>
          <span className="cita-dueno-nodo" aria-hidden="true" />
          <span className="cita-dueno-textos">
            <span className="cita-dueno-cliente">{cliente}</span>
            <span className="cita-dueno-linea">
              {conPropuesta ? (
                <span className="cita-dueno-linea-propuesta">
                  <Hourglass size={12} strokeWidth={2.4} aria-hidden="true" />
                  <span className="sr-only">Propuesta:</span> → {textoPropuesta}
                </span>
              ) : (
                <>
                  {linea}
                  {duracionTexto && <span className="cita-dueno-linea-extra"> · {duracionTexto}</span>}
                </>
              )}
            </span>
          </span>
          {!pendiente && (
            <span className="cita-dueno-lado">
              <span className="cita-dueno-estado">{estadoTexto}</span>
              <ChevronDown className="cita-dueno-flecha" size={16} strokeWidth={2.25} aria-hidden="true" />
            </span>
          )}
        </button>

        {pendiente && (
          <div className={`cita-dueno-rapidas${puedeProponer ? ' cita-dueno-rapidas--tres' : ''}`}>
            {puedeProponer && (
              <button
                type="button"
                className="cita-dueno-rapida cita-dueno-rapida--hora"
                onClick={() => (proponiendo ? setProponiendo(false) : abrirProponer())}
                aria-pressed={proponiendo}
                aria-label={`Proponer otra hora a ${cliente}`}
                title="Proponer otra hora"
              >
                <Clock size={17} strokeWidth={2.4} />
              </button>
            )}
            {onRechazar && (
              <button
                type="button"
                className="cita-dueno-rapida cita-dueno-rapida--no"
                onClick={onRechazar}
                aria-label={`Rechazar la cita de ${cliente}`}
              >
                <X size={17} strokeWidth={2.5} />
              </button>
            )}
            {onConfirmar && (
              <button
                type="button"
                className="cita-dueno-rapida cita-dueno-rapida--si"
                onClick={onConfirmar}
                aria-label={`Confirmar la cita de ${cliente}`}
              >
                <Check size={17} strokeWidth={2.75} />
              </button>
            )}
          </div>
        )}
      </div>

      <div ref={detalleRef} id={idDetalle} className="cita-dueno-detalle">
        {proponiendo && puedeProponer && (
          <ProponerHora
            dias={diasProponer()}
            diaCita={fecha}
            nombre={nombre}
            onProponer={proponer}
            onCerrar={() => setProponiendo(false)}
          />
        )}

        {conPropuesta && (
          <div className="cita-dueno-propuesta" role="status">
            <p>
              Le propusiste las <b>{textoPropuesta}</b>. Esperando a que {nombre} diga si le vale.
              {propuestaVence && (
                <small>
                  {' '}
                  Si no contesta antes de las {horaCorta(`${propuestaVence.getHours()}:${propuestaVence.getMinutes()}`)}, se
                  cancela sola.
                </small>
              )}
            </p>
            <div className="cita-dueno-contacto">
              {tel && (
                <a
                  className="cita-dueno-enlace"
                  href={`https://wa.me/${tel}?text=${encodeURIComponent(mensajeWa)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={14} strokeWidth={2.25} aria-hidden="true" />
                  Avisarle
                </a>
              )}
              {onRetirarPropuesta && (
                <button type="button" className="cita-dueno-enlace cita-dueno-enlace--boton" onClick={onRetirarPropuesta}>
                  Retirar propuesta
                </button>
              )}
            </div>
          </div>
        )}

        <dl className="cita-dueno-datos">
          <div>
            <dt>Reserva</dt>
            <dd>
              <IconoTipo size={13} strokeWidth={2.25} aria-hidden="true" />
              {linea}
            </dd>
          </div>
          {detalle && (
            <div>
              <dt>Detalle</dt>
              <dd>{detalle}</dd>
            </div>
          )}
          {duracionTexto && (
            <div>
              <dt>Duración</dt>
              <dd>
                <Clock size={13} strokeWidth={2.25} aria-hidden="true" />
                {duracionTexto}
              </dd>
            </div>
          )}
          {precio != null && (
            <div>
              <dt>Importe</dt>
              <dd className="cita-dueno-precio">{precio ? `${precio} CUP` : 'Gratis'}</dd>
            </div>
          )}
        </dl>

        {tel ? (
          <div className="cita-dueno-contacto">
            <a className="cita-dueno-enlace" href={`tel:+${tel}`}>
              <Phone size={14} strokeWidth={2.25} aria-hidden="true" />
              {telefono}
            </a>
            <a className="cita-dueno-enlace" href={`https://wa.me/${tel}`} target="_blank" rel="noreferrer">
              <MessageCircle size={14} strokeWidth={2.25} aria-hidden="true" />
              WhatsApp
            </a>
          </div>
        ) : (
          <p className="cita-dueno-sin-tel">El cliente no dejó teléfono.</p>
        )}
      </div>
    </article>
  )
}

export default CitaDueno
