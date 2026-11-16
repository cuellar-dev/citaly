import { franjaDelDia, estadoTurno } from '../../utils/turnos.js'
import './selectorTurno.css'

/* Rejilla de turnos agrupada por mañana / tarde / noche. Cada turno dice su
   hora y cuántos sitios le quedan, con una barrita de lo lleno que va. La usa
   el cliente al unirse y el dueño al apuntar o mover a alguien.

   turnos: [{ id, texto, inicio, cupo, ocupados }]
   actual: el turno donde ya está (al mover): sale marcado y no cuenta como
           sitio ocupado de más. */
function SelectorTurno({ turnos, elegido, actual = null, onElegir, tono = 'verde', etiqueta = 'Turnos' }) {
  const grupos = turnos.reduce((acc, t) => {
    const franja = franjaDelDia(t.inicio % 1440)
    const g = acc.find((x) => x.franja === franja)
    if (g) g.turnos.push(t)
    else acc.push({ franja, turnos: [t] })
    return acc
  }, [])

  return (
    <div className={`selector-turno selector-turno--${tono}`} role="group" aria-label={etiqueta}>
      {grupos.map((g) => (
        <section key={g.franja} className="selector-turno-grupo">
          <h3 className="selector-turno-franja">{g.franja}</h3>
          <div className="selector-turno-rejilla">
            {g.turnos.map((t) => {
              const esActual = t.id === actual
              /* Si ya está en este turno, su sitio no cuenta como ocupado por otro. */
              const ocupados = esActual ? t.ocupados - 1 : t.ocupados
              const estado = estadoTurno(ocupados, t.cupo)
              const quedan = Math.max(t.cupo - ocupados, 0)
              const lleno = estado === 'lleno' && !esActual
              const pct = Math.min(100, Math.round((t.ocupados / Math.max(t.cupo, 1)) * 100))
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`selector-turno-opcion selector-turno-opcion--${lleno ? 'lleno' : estado}`}
                  aria-pressed={elegido === t.id}
                  disabled={lleno}
                  onClick={() => onElegir(t.id)}
                >
                  <span className="selector-turno-hora">{t.texto}</span>
                  <span className="selector-turno-cupo">
                    {esActual ? 'Está aquí ahora' : lleno ? 'Lleno' : quedan === 1 ? 'Queda 1 sitio' : `Quedan ${quedan} sitios`}
                  </span>
                  <span className="selector-turno-barra" aria-hidden="true">
                    <span style={{ width: `${pct}%` }} />
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

export default SelectorTurno
