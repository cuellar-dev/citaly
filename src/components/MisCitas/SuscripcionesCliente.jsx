import { useState } from 'react'
import { Link } from 'react-router-dom'
import { differenceInCalendarMonths, parseISO } from 'date-fns'
import { ArrowRightLeft, CalendarClock, Check, Clock, Dumbbell, MessageCircle, Ticket, X } from 'lucide-react'
import { getLocalById } from '../../services/locales.js'
import { periodoDe, precioPlanTexto } from '../../utils/fichaLocal.js'
import { fechaCorta, situacionSocio, textoSituacion } from '../../utils/socios.js'
import { listaTurnos } from '../../utils/turnos.js'
import './suscripcionesCliente.css'

/* Los planes a los que el cliente está apuntado (gimnasio, curso…), debajo
   de sus citas. Estado guardado en la suscripción:
     0 esperando al local · 1 activa · 3 rechazada · 4 de baja (la dio él). */

const ACTIVA = 1
const BAJA = 4

function tiempoDeSocio(desde, hoy = new Date()) {
  const meses = differenceInCalendarMonths(hoy, parseISO(desde))
  if (meses < 1) return 'este mes'
  if (meses < 12) return meses === 1 ? '1 mes' : `${meses} meses`
  const anios = Math.floor(meses / 12)
  return anios === 1 ? 'más de un año' : `${anios} años`
}

function textoTurno(local, sus) {
  if (!sus.turno) return null
  const turno = local ? listaTurnos(local).find((t) => t.id === sus.turno) : null
  return turno?.texto ?? sus.turnoTexto ?? sus.turno
}

/* Borrar en dos toques, como en Mi Negocio: un roce no da de baja a nadie. */
function BotonBaja({ texto, aviso, onConfirmar }) {
  const [armado, setArmado] = useState(false)
  return (
    <div className="sus-baja">
      {armado && <p className="sus-baja-aviso">{aviso}</p>}
      <button
        type="button"
        className={`sus-baja-boton${armado ? ' sus-baja-boton--armado' : ''}`}
        onClick={() => (armado ? onConfirmar() : setArmado(true))}
        onBlur={() => setArmado(false)}
      >
        <X size={15} strokeWidth={2.4} aria-hidden="true" />
        {armado ? 'Toca otra vez para confirmar' : texto}
      </button>
    </div>
  )
}

function Fila({ Icono, etiqueta, children }) {
  return (
    <div className="sus-fila">
      <dt>
        <Icono size={14} strokeWidth={2.2} aria-hidden="true" />
        {etiqueta}
      </dt>
      <dd>{children}</dd>
    </div>
  )
}

function TarjetaSuscripcion({ sus, onCambiar }) {
  const local = getLocalById(sus.localId)
  const plan = local?.planes?.find((p) => p.id === sus.plan.id) ?? sus.plan
  const esperando = sus.estado === 0
  const turno = textoTurno(local, sus)
  const situacion =
    sus.estado === ACTIVA && local && sus.proximoPago
      ? situacionSocio({ estado: 'activo', planId: sus.plan.id, proximoPago: sus.proximoPago }, local)
      : null
  const atrasado = situacion && (situacion.clave === 'atrasado' || situacion.clave === 'gracia')
  const wasa = local?.whatsapp?.replace(/\D/g, '')

  return (
    <article className={`sus-tarjeta${esperando ? ' sus-tarjeta--espera' : ''}`}>
      <header className="sus-cabecera">
        <span className="sus-icono" aria-hidden="true">
          <Dumbbell size={20} strokeWidth={2.1} />
        </span>
        <div className="sus-titulos">
          <Link to={`/local/${sus.localId}`} className="sus-local">
            {sus.localNombre}
          </Link>
          <span className="sus-plan">Plan {plan.nombre}</span>
        </div>
        <span className={`sus-estado sus-estado--${esperando ? 'espera' : atrasado ? 'atraso' : 'activa'}`}>
          {esperando ? 'Esperando al local' : situacion ? textoSituacion(situacion) : 'Activa'}
        </span>
      </header>

      <dl className="sus-datos">
        <Fila Icono={Ticket} etiqueta="Cuota">
          {precioPlanTexto(plan)}
          {situacion?.recargo ? <em className="sus-recargo"> +{situacion.recargo} CUP de recargo</em> : null}
        </Fila>
        {turno && (
          <Fila Icono={Clock} etiqueta="Tu turno">
            {turno}
          </Fila>
        )}
        {esperando ? (
          <Fila Icono={CalendarClock} etiqueta="Pediste entrar">
            {fechaCorta(sus.creadaEn.slice(0, 10))}
          </Fila>
        ) : (
          <>
            <Fila Icono={CalendarClock} etiqueta="Socio desde">
              {fechaCorta(sus.desde)} · {tiempoDeSocio(sus.desde)}
            </Fila>
            {sus.proximoPago && (
              <Fila Icono={CalendarClock} etiqueta="Próximo pago">
                {fechaCorta(sus.proximoPago)} · se paga {periodoDe(plan).largo}
              </Fila>
            )}
          </>
        )}
      </dl>

      {/* El turno que pidió está lleno y el local le propone otro: decide él. */}
      {esperando && sus.propuesta && (
        <div className="sus-propuesta" role="status">
          <p>
            <Clock size={15} strokeWidth={2.4} aria-hidden="true" />
            <span>
              {sus.propuesta.pedidoTexto ? `El turno de ${sus.propuesta.pedidoTexto} está lleno. ` : ''}
              {sus.localNombre} te propone el de <b>{sus.propuesta.texto}</b>. ¿Te vale?
            </span>
          </p>
          <div className="sus-propuesta-botones">
            <Link className="sus-boton" to={`/local/${sus.localId}/unirse`}>
              Pedir otro turno
            </Link>
            <button
              type="button"
              className="sus-boton sus-boton--si"
              onClick={() =>
                onCambiar(sus.id, { turno: sus.propuesta.turno, turnoTexto: sus.propuesta.texto, propuesta: null })
              }
            >
              <Check size={16} strokeWidth={2.6} aria-hidden="true" />
              Me vale
            </button>
          </div>
        </div>
      )}

      {/* El local le cambió de turno para hacer sitio: se lo contamos. */}
      {!esperando && sus.avisoTurno && (
        <div className="sus-aviso-turno" role="status">
          <ArrowRightLeft size={15} strokeWidth={2.4} aria-hidden="true" />
          <span>
            {sus.localNombre} te cambió del turno de {sus.avisoTurno.de} al de <b>{sus.avisoTurno.a}</b>. Si no te viene bien,
            escríbeles.
          </span>
          <button type="button" className="sus-enlace" onClick={() => onCambiar(sus.id, { avisoTurno: null })}>
            Entendido
          </button>
        </div>
      )}

      {esperando && !sus.propuesta && (
        <p className="sus-nota">El local te escribe para confirmar el alta. El pago se hace allí, no en Citaly.</p>
      )}

      <div className="sus-acciones">
        {wasa && (
          <a className="sus-boton" href={`https://wa.me/${wasa}`} target="_blank" rel="noreferrer">
            <MessageCircle size={16} strokeWidth={2.2} aria-hidden="true" />
            Escribir al local
          </a>
        )}
        <BotonBaja
          texto={esperando ? 'Retirar solicitud' : 'Darme de baja'}
          aviso={
            esperando
              ? 'El local deja de ver tu solicitud.'
              : 'Avisamos al local. Lo que ya pagaste sigue valiendo hasta la fecha de pago.'
          }
          onConfirmar={() => onCambiar(sus.id, { estado: BAJA, bajaEn: new Date().toISOString() })}
        />
      </div>
    </article>
  )
}

function SuscripcionesCliente({ suscripciones, onCambiar }) {
  const vigentes = suscripciones.filter((s) => s.estado === 0 || s.estado === ACTIVA)
  const pasadas = suscripciones.filter((s) => s.estado === BAJA || s.estado === 3)

  return (
    <section className="mis-bloque" aria-labelledby="mis-suscripciones">
      <header className="mis-bloque-cabecera">
        <h2 id="mis-suscripciones">Suscripciones</h2>
      </header>

      {vigentes.length ? (
        <div className="sus-lista">
          {vigentes.map((s) => (
            <TarjetaSuscripcion key={s.id} sus={s} onCambiar={onCambiar} />
          ))}
        </div>
      ) : (
        <p className="mis-bloque-vacio">
          No estás apuntado a ningún plan. Los gimnasios y cursos con pago mensual salen aquí cuando te unes.
        </p>
      )}

      {pasadas.length > 0 && (
        <ul className="sus-pasadas">
          {pasadas.map((s) => (
            <li key={s.id}>
              <span>
                <strong>{s.localNombre}</strong> · {s.estado === 3 ? 'el local no la aceptó' : 'te diste de baja'}
              </span>
              <Link to={`/local/${s.localId}/unirse`}>Volver a unirme</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default SuscripcionesCliente
