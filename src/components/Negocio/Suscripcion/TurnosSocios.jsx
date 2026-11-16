import { Settings2 } from 'lucide-react'
import { estadoTurno } from '../../../utils/turnos.js'
import './turnosSocios.css'

/* Los turnos del día de un vistazo: una columna por turno, tan alta como lo
   lleno que va. Tocar una abre quién viene a ese turno (y desde ahí se mueve
   gente o se cambia su cupo). */

function horaEtiqueta(minutos) {
  const h = Math.floor(minutos / 60) % 24
  const m = minutos % 60
  return { hora: `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''}`, mitad: h >= 12 ? 'pm' : 'am' }
}

function TurnosSocios({ turnos, duracion, onTurno, onAjustes }) {
  const plazas = turnos.reduce((t, x) => t + x.cupo, 0)
  const ocupados = turnos.reduce((t, x) => t + x.ocupados, 0)
  const llenos = turnos.filter((t) => estadoTurno(t.ocupados, t.cupo) === 'lleno').length
  const pedidos = turnos.reduce((t, x) => t + x.pedidos, 0)

  return (
    <section className="turnos-socios" aria-labelledby="turnos-socios-titulo">
      <header className="turnos-socios-cabecera">
        <div>
          <h2 id="turnos-socios-titulo" className="turnos-socios-titulo">
            Turnos
          </h2>
          <p className="turnos-socios-sub">
            {turnos.length} turnos de {duracion % 60 ? `${Math.floor(duracion / 60)} h ${duracion % 60}` : `${duracion / 60} h`} ·{' '}
            {ocupados} de {plazas} plazas
            {llenos > 0 && (
              <>
                {' · '}
                <b>
                  {llenos} {llenos === 1 ? 'lleno' : 'llenos'}
                </b>
              </>
            )}
          </p>
        </div>
        <button type="button" className="turnos-socios-ajustes" onClick={onAjustes}>
          <Settings2 size={15} strokeWidth={2.25} aria-hidden="true" />
          Ajustar
        </button>
      </header>

      <div className="turnos-socios-columnas">
        {turnos.map((t) => {
          const estado = estadoTurno(t.ocupados, t.cupo)
          const alto = Math.min(100, Math.round((t.ocupados / Math.max(t.cupo, 1)) * 100))
          const { hora, mitad } = horaEtiqueta(t.inicio)
          return (
            <button
              key={t.id}
              type="button"
              className={`turnos-socios-columna turnos-socios-columna--${estado}`}
              onClick={() => onTurno(t.id)}
              aria-label={`Turno de ${t.texto}: ${t.ocupados} de ${t.cupo}${t.pedidos ? `, ${t.pedidos} pendientes de aceptar` : ''}`}
            >
              <span className="turnos-socios-cuenta">
                {t.ocupados}
                <small>/{t.cupo}</small>
              </span>
              <span className="turnos-socios-pista">
                <span className="turnos-socios-relleno" style={{ height: `${Math.max(alto, t.ocupados ? 8 : 0)}%` }} />
                {t.pedidos > 0 && <span className="turnos-socios-pedido" aria-hidden="true" />}
              </span>
              <span className="turnos-socios-hora">
                {hora}
                <small>{mitad}</small>
              </span>
            </button>
          )
        })}
      </div>

      <p className="turnos-socios-leyenda">
        <span>
          <i className="turnos-socios-muestra turnos-socios-muestra--libre" /> Hay sitio
        </span>
        <span>
          <i className="turnos-socios-muestra turnos-socios-muestra--casi" /> Quedan pocos
        </span>
        <span>
          <i className="turnos-socios-muestra turnos-socios-muestra--lleno" /> Lleno
        </span>
        {pedidos > 0 && (
          <span>
            <i className="turnos-socios-muestra turnos-socios-muestra--pedido" /> Lo piden
          </span>
        )}
      </p>
    </section>
  )
}

export default TurnosSocios
