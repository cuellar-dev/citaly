import { useMemo, useState } from 'react'
import { CalendarDays, Send } from 'lucide-react'
import { horaCorta } from '../../utils/proponerHora.js'

/* Dentro de la fila de una cita pendiente: el dueño elige otra hora para
   proponérsela al cliente. Arranca en el día de la cita; «Otro día» abre la
   tira con los próximos días abiertos. Elegir y proponer son dos toques: así
   un dedo despistado no le manda una hora a nadie. */
function ProponerHora({ dias, diaCita, nombre, onProponer, onCerrar }) {
  const [verDias, setVerDias] = useState(false)
  const [clave, setClave] = useState(() => (dias.some((d) => d.clave === diaCita) ? diaCita : dias[0]?.clave))
  const [hora, setHora] = useState(null)
  const dia = useMemo(() => dias.find((d) => d.clave === clave) ?? dias[0], [dias, clave])

  if (!dia) {
    return (
      <div className="proponer-hora">
        <p className="proponer-hora-titulo">No hay días abiertos en la próxima semana para moverla.</p>
        <button type="button" className="proponer-hora-enlace" onClick={onCerrar}>
          Cerrar
        </button>
      </div>
    )
  }

  const elegirDia = (c) => {
    setClave(c)
    setHora(null)
  }

  return (
    <div className="proponer-hora" role="group" aria-label={`Proponer otra hora a ${nombre}`}>
      <div className="proponer-hora-cabeza">
        <p className="proponer-hora-titulo">
          ¿Qué hora le propones a <b>{nombre}</b>?
        </p>
        <button
          type="button"
          className="proponer-hora-enlace"
          aria-expanded={verDias}
          onClick={() => setVerDias((v) => !v)}
        >
          <CalendarDays size={14} strokeWidth={2.3} aria-hidden="true" />
          {verDias ? dia.etiqueta : 'Otro día'}
        </button>
      </div>

      {verDias && (
        <div className="proponer-hora-dias" role="radiogroup" aria-label="Día">
          {dias.map((d) => (
            <button
              key={d.clave}
              type="button"
              role="radio"
              aria-checked={d.clave === dia.clave}
              className="proponer-hora-dia"
              disabled={!d.libres && d.clave !== dia.clave}
              onClick={() => elegirDia(d.clave)}
            >
              <span>{d.etiqueta}</span>
              <small>{d.libres ? `${d.libres} libres` : 'lleno'}</small>
            </button>
          ))}
        </div>
      )}

      {dia.libres === 0 ? (
        <p className="proponer-hora-vacio">
          {dia.etiqueta}: no queda hueco.{' '}
          {!verDias && (
            <button type="button" className="proponer-hora-enlace" onClick={() => setVerDias(true)}>
              Mirar otro día
            </button>
          )}
        </p>
      ) : (
        <div className="proponer-hora-horas" role="radiogroup" aria-label={`Horas del ${dia.etiqueta}`}>
          {dia.horas.map((h) => (
            <button
              key={h.hora}
              type="button"
              role="radio"
              aria-checked={hora === h.hora}
              className={`proponer-hora-hora proponer-hora-hora--${h.estado}`}
              disabled={h.estado !== 'libre'}
              title={h.estado === 'ocupada' ? 'Ya está ocupada' : h.estado === 'actual' ? 'La hora que pidió' : undefined}
              onClick={() => setHora(h.hora)}
            >
              {horaCorta(h.hora)}
              {h.estado === 'actual' && <small>la pidió</small>}
            </button>
          ))}
        </div>
      )}

      <div className="proponer-hora-acciones">
        <button type="button" className="proponer-hora-enlace" onClick={onCerrar}>
          Cancelar
        </button>
        <button
          type="button"
          className="proponer-hora-enviar"
          disabled={!hora}
          onClick={() => hora && onProponer({ fecha: dia.clave, horario: hora })}
        >
          <Send size={15} strokeWidth={2.4} aria-hidden="true" />
          {hora ? `Proponer ${horaCorta(hora)}` : 'Elige una hora'}
        </button>
      </div>
    </div>
  )
}

export default ProponerHora
