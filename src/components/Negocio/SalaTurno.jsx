import { useState } from 'react'
import MapaMesas from '../MapaMesas/MapaMesas.jsx'
import { CANCELADA, PENDIENTE } from '../../utils/estadosCita.js'
import { aMinutos, horaAmPm, turnosDelDia } from '../../utils/fichaLocal.js'
import { mesasDeLocal } from '../../utils/mesas.js'
import './negocioMesas.css'

/* La sala de un turno, vista desde arriba: qué mesas están cogidas a esa
   hora, cuáles faltan por confirmar y cuáles quedan para quien llegue.
   Solo en locales de mesas, encima de la agenda del día. */

function hhmm(minutos) {
  return `${String(Math.floor(minutos / 60) % 24).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`
}

function turnoInicial(turnos, citas, ahora, esHoy, intervalo) {
  if (esHoy) {
    const min = ahora.getHours() * 60 + ahora.getMinutes()
    const enCurso = turnos.find((t) => min >= t && min < t + intervalo)
    if (enCurso != null) return enCurso
    const siguiente = turnos.find((t) => t > min)
    if (siguiente != null) return siguiente
  }
  const conGente = turnos.find((t) => citas.some((c) => c.horario === hhmm(t) && c.estadoReserva !== CANCELADA))
  return conGente ?? turnos[0]
}

function SalaTurno({ local, citas, ahora, esHoy }) {
  const intervalo = Number(local.intervaloMinutos) || 60
  const turnos = turnosDelDia(local.horarioApertura, local.horarioCierre, intervalo)
  const [elegido, setElegido] = useState(() => turnoInicial(turnos, citas, ahora, esHoy, intervalo))
  const turno = turnos.includes(elegido) ? elegido : turnos[0]
  if (turno == null) return null

  const activas = citas.filter((c) => c.estadoReserva !== CANCELADA && c.mesaId)
  const delTurno = activas.filter((c) => c.horario === hhmm(turno))
  const porMesa = new Map(delTurno.map((c) => [c.mesaId, c]))
  const mesas = mesasDeLocal(local).map((m) => {
    const reserva = porMesa.get(m.id)
    const estado = reserva ? (reserva.estadoReserva === PENDIENTE ? 'pendiente' : 'ocupado') : m.online ? 'disponible' : 'calle'
    return { ...m, estado }
  })
  const personas = delTurno.reduce((t, c) => t + (c.personas ?? 0), 0)
  const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes()

  return (
    <section className="sala-turno negocio-citas-item" aria-label="La sala por turnos">
      <header className="sala-turno-cabecera">
        <h3 className="sala-turno-titulo">La sala a las {horaAmPm(turno)}</h3>
        <span className="sala-turno-cuenta">
          <strong>{delTurno.length}</strong> de {mesas.length} mesas · {personas} personas
        </span>
      </header>

      <div className="sala-turno-horas" role="group" aria-label="Turno">
        {turnos.map((t) => {
          const cuantas = activas.filter((c) => c.horario === hhmm(t)).length
          return (
            <button
              key={t}
              type="button"
              className={`sala-turno-hora${esHoy && t + intervalo <= ahoraMin ? ' sala-turno-hora--pasada' : ''}`}
              aria-pressed={t === turno}
              onClick={() => setElegido(t)}
            >
              {horaAmPm(t)}
              {cuantas > 0 && <b>{cuantas}</b>}
            </button>
          )
        })}
      </div>

      <div className="mapa-mesas-container">
        <div className="mapa-mesas-viewport">
          <MapaMesas mesas={mesas} soloLectura />
        </div>
      </div>

      <div className="mapa-mesas-leyenda-container">
        <div className="mapa-mesas-leyenda">
          <div className="mapa-mesas-leyenda-swatch sala-swatch--libre" />
          <p className="mapa-mesas-leyenda-texto">Libre</p>
        </div>
        <div className="mapa-mesas-leyenda">
          <div className="mapa-mesas-leyenda-swatch sala-swatch--reservada" />
          <p className="mapa-mesas-leyenda-texto">Reservada</p>
        </div>
        <div className="mapa-mesas-leyenda">
          <div className="mapa-mesas-leyenda-swatch mapa-mesas-leyenda-swatch--seleccionado" />
          <p className="mapa-mesas-leyenda-texto">Por confirmar</p>
        </div>
        <div className="mapa-mesas-leyenda">
          <div className="mapa-mesas-leyenda-swatch mapa-mesas-leyenda-swatch--calle" />
          <p className="mapa-mesas-leyenda-texto">Calle</p>
        </div>
      </div>

      {delTurno.length > 0 && (
        <ul className="sala-turno-quienes" aria-label="Quién viene en este turno">
          {[...delTurno]
            .sort((a, b) => aMinutos(a.horario) - aMinutos(b.horario))
            .map((c) => (
              <li key={c.id} className={c.estadoReserva === PENDIENTE ? 'sala-turno-quienes--pendiente' : undefined}>
                <b>{mesas.find((m) => m.id === c.mesaId)?.codigo.replace('MESA-', 'M')}</b> {String(c.cliente).split(' ')[0]} · {c.personas}
              </li>
            ))}
        </ul>
      )}
    </section>
  )
}

export default SalaTurno
