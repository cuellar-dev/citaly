import { useId, useState } from 'react'
import { ArrowRightLeft, Banknote, CalendarDays, Check, ChevronDown, Clock, MessageCircle, Phone, UserMinus, X } from 'lucide-react'
import { iniciales } from '../../../utils/fichaLocal.js'
import {
  ETIQUETA_SITUACION,
  fechaCorta,
  mensajeRecordatorio,
  textoDiaDePago,
  textoSituacion,
} from '../../../utils/socios.js'
import './socioDueno.css'

/* Una fila de la lista de socios. Cerrada dice quién es, su plan y cómo va
   con el pago; abierta enseña las cuentas y lo que se puede hacer: cobrar,
   recordar por WhatsApp, cambiar de turno, de plan o de fecha de pago, o
   darle de baja. */
function SocioDueno({
  socio,
  situacion,
  local,
  turno,
  conTurnos = false,
  onCobrar,
  onAceptar,
  onRechazar,
  onCambiarPlan,
  onCambiarTurno,
  onCambiarFecha,
  onBaja,
}) {
  const [abierta, setAbierta] = useState(false)
  const [bajaArmada, setBajaArmada] = useState(false)
  const [fecha, setFecha] = useState(null)
  const idDetalle = useId()
  const { clave, plan, cuota, recargo, total } = situacion
  const tel = String(socio.telefono || '').replace(/\D/g, '')
  const esSolicitud = clave === 'solicitud'
  const esBaja = clave === 'baja'
  const ultimoPago = socio.pagos?.at(-1)
  const mensaje = encodeURIComponent(mensajeRecordatorio(socio, situacion, local))

  return (
    <article className={`socio socio--${clave}${abierta ? ' socio--abierta' : ''}`}>
      <div className="socio-fila">
        <button
          type="button"
          className="socio-resumen"
          aria-expanded={abierta}
          aria-controls={idDetalle}
          onClick={() => setAbierta((v) => !v)}
        >
          <span className="socio-avatar" aria-hidden="true">
            {iniciales(socio.nombre)}
          </span>
          <span className="socio-textos">
            <span className="socio-nombre">{socio.nombre}</span>
            <span className="socio-plan">
              {plan?.nombre ?? 'Sin plan'}
              {!esSolicitud && !esBaja && <span> · {textoDiaDePago(socio, plan, { corto: true })}</span>}
              {esSolicitud && <span> · {cuota} CUP/mes</span>}
            </span>
          </span>
          {!esSolicitud && (
            <span className="socio-lado">
              <span className="socio-estado">{ETIQUETA_SITUACION[clave]}</span>
              <span className="socio-cuando">{textoSituacion(situacion)}</span>
            </span>
          )}
          {!esSolicitud && <ChevronDown className="socio-flecha" size={16} strokeWidth={2.25} aria-hidden="true" />}
        </button>

        {esSolicitud && (
          <div className="socio-rapidas">
            <button
              type="button"
              className="socio-rapida socio-rapida--no"
              onClick={onRechazar}
              aria-label={`Rechazar la solicitud de ${socio.nombre}`}
            >
              <X size={17} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              className="socio-rapida socio-rapida--si"
              onClick={onAceptar}
              aria-label={`Aceptar a ${socio.nombre} como cliente`}
            >
              <Check size={17} strokeWidth={2.75} />
            </button>
          </div>
        )}
      </div>

      {!esSolicitud && (
        <div id={idDetalle} className="socio-detalle" hidden={!abierta}>
          <dl className="socio-cuentas">
            <div>
              <dt>Cuota</dt>
              <dd>{cuota} CUP</dd>
            </div>
            <div className={recargo ? 'socio-cuentas--recargo' : undefined}>
              <dt>Recargo</dt>
              <dd>{recargo ? `+${recargo} CUP` : '—'}</dd>
            </div>
            <div className="socio-cuentas--total">
              <dt>{esBaja ? 'Debe' : 'A cobrar'}</dt>
              <dd>{total} CUP</dd>
            </div>
          </dl>

          <p className="socio-historia">
            {esBaja ? 'Fue cliente' : 'Cliente'} desde el {fechaCorta(socio.desde)}
            {!esBaja && <> · toca pagar el {fechaCorta(socio.proximoPago)}</>}
            {ultimoPago && <> · último pago el {fechaCorta(ultimoPago.fecha)}</>}
          </p>

          {!esBaja && (
            <>
              <button type="button" className="socio-cobrar" onClick={onCobrar}>
                <Banknote size={17} strokeWidth={2.25} aria-hidden="true" />
                Cobrar {total} CUP
              </button>

              <div className="socio-ajustes">
                {conTurnos && (
                  <div className="socio-ajuste">
                    <Clock size={15} strokeWidth={2.25} aria-hidden="true" />
                    <span className="socio-ajuste-textos">
                      <small>Turno</small>
                      {turno ? turno.texto : 'Sin turno'}
                    </span>
                    <button type="button" className="socio-ajuste-boton" onClick={onCambiarTurno}>
                      <ArrowRightLeft size={13} strokeWidth={2.25} aria-hidden="true" />
                      {turno ? 'Cambiar' : 'Elegir'}
                    </button>
                  </div>
                )}

                <div className="socio-ajuste">
                  <CalendarDays size={15} strokeWidth={2.25} aria-hidden="true" />
                  {fecha == null ? (
                    <>
                      <span className="socio-ajuste-textos">
                        <small>Próximo pago</small>
                        {fechaLarga(socio.proximoPago)}
                      </span>
                      <button type="button" className="socio-ajuste-boton" onClick={() => setFecha(socio.proximoPago)}>
                        Cambiar
                      </button>
                    </>
                  ) : (
                    <form
                      className="socio-fecha"
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (!fecha) return
                        if (fecha !== socio.proximoPago) onCambiarFecha(fecha)
                        setFecha(null)
                      }}
                    >
                      <label className="socio-ajuste-textos">
                        <small>Próximo pago</small>
                        <input
                          type="date"
                          className="modal-negocio-input socio-fecha-input"
                          value={fecha}
                          onChange={(e) => setFecha(e.target.value)}
                          required
                        />
                      </label>
                      <span className="socio-fecha-botones">
                        <button type="button" className="socio-ajuste-boton socio-ajuste-boton--suave" onClick={() => setFecha(null)}>
                          Cancelar
                        </button>
                        <button type="submit" className="socio-ajuste-boton socio-ajuste-boton--fuerte" disabled={!fecha}>
                          Guardar
                        </button>
                      </span>
                    </form>
                  )}
                </div>
              </div>

              <p className="socio-subtitulo">Cambiar de plan</p>
              <div className="socio-planes" role="group" aria-label="Cambiar de plan">
                {(local.planes ?? []).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="modal-negocio-chip modal-negocio-chip--verde"
                    aria-pressed={p.id === socio.planId}
                    onClick={() => p.id !== socio.planId && onCambiarPlan(p.id)}
                  >
                    {p.nombre}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="socio-contacto">
            {tel ? (
              <>
                <a className="socio-enlace" href={`tel:+${tel}`}>
                  <Phone size={14} strokeWidth={2.25} aria-hidden="true" />
                  {socio.telefono}
                </a>
                <a className="socio-enlace" href={`https://wa.me/${tel}?text=${mensaje}`} target="_blank" rel="noreferrer">
                  <MessageCircle size={14} strokeWidth={2.25} aria-hidden="true" />
                  {clave === 'atrasado' || clave === 'gracia' || clave === 'por-vencer' ? 'Recordarle' : 'WhatsApp'}
                </a>
              </>
            ) : (
              <p className="socio-sin-tel">No dejó teléfono.</p>
            )}
          </div>

          {!esBaja && (
            <button
              type="button"
              className={`socio-baja${bajaArmada ? ' socio-baja--armada' : ''}`}
              onClick={() => (bajaArmada ? onBaja() : setBajaArmada(true))}
              onBlur={() => setBajaArmada(false)}
            >
              <UserMinus size={14} strokeWidth={2.25} aria-hidden="true" />
              {bajaArmada ? 'Toca otra vez para darle de baja' : 'Dar de baja'}
            </button>
          )}
        </div>
      )}
    </article>
  )
}

function fechaLarga(iso) {
  const [a, m, d] = String(iso).split('-').map(Number)
  if (!a) return '—'
  return new Date(a, m - 1, d).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default SocioDueno
