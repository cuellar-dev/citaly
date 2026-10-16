import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import TimelineTurno from './TimelineTurno.jsx'
import './cabeceraNegocio.css'

/* Bloque de arriba: el local y el timeline del turno de hoy. */
function CabeceraNegocio({
  nombre,
  url,
  recibiendo = false,
  apertura,
  cierre,
  ahora = new Date(),
}) {
  const turno = calcularTurno({ apertura, cierre, ahora })
  const tono = turno.enCurso ? 'abierto' : 'cerrado'

  return (
    <header className="cabecera-negocio">
      <div className="cabecera-negocio-identidad" style={{ backgroundImage: `url(${url})` }}>
        <div className="cabecera-negocio-textos">
          <h2 className="cabecera-negocio-nombre">{nombre}</h2>
          <p className={`cabecera-negocio-estado cabecera-negocio-estado--${tono}`}>
            <span className="cabecera-negocio-pulso" aria-hidden="true" />
            {turno.estado}
          </p>
        </div>
        {recibiendo && turno.enCurso && (
          <p className="cabecera-negocio-recibiendo">
            <span className="cabecera-negocio-recibiendo-luz" aria-hidden="true" />
            Recibiendo reservas
          </p>
        )}
      </div>

      <div className="cabecera-negocio-turno">
        <div className="cabecera-negocio-reloj">
          <p className="cabecera-negocio-dia">
            {turno.dia}
            <span>{turno.hora}</span>
          </p>
          <p className={`cabecera-negocio-tag cabecera-negocio-tag--${tono}`}>{turno.restante}</p>
        </div>
        <TimelineTurno
          porcentaje={turno.porcentaje}
          inicioMin={turno.inicioMin}
          finMin={turno.finMin}
          enCurso={turno.enCurso}
          horaTexto={turno.hora}
          aperturaTexto={turno.aperturaTexto}
          cierreTexto={turno.cierreTexto}
          mitadTexto={turno.mitadTexto}
        />
      </div>
    </header>
  )
}

function aMinutos(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number)
  return h * 60 + (m || 0)
}

function etiquetaHora(minutos) {
  const normalizado = ((minutos % (24 * 60)) + 24 * 60) % (24 * 60)
  const h24 = Math.floor(normalizado / 60)
  const m = normalizado % 60
  const sufijo = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${sufijo}`
}

function textoRestante(minutos) {
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  if (horas <= 0) return `${resto} min restantes`
  if (resto === 0) return `${horas}h restantes`
  return `${horas}h ${resto}min restantes`
}

function calcularTurno({ apertura, cierre, ahora }) {
  const ini = aMinutos(apertura)
  const finBase = aMinutos(cierre)
  const fin = finBase <= ini ? finBase + 24 * 60 : finBase
  const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes()
  const cursor = ahoraMin < ini && finBase <= ini ? ahoraMin + 24 * 60 : ahoraMin
  const total = fin - ini
  const enCurso = cursor >= ini && cursor < fin
  const antes = cursor < ini
  const porcentaje = total ? (Math.min(Math.max(cursor - ini, 0), total) / total) * 100 : 0
  const dia = format(ahora, 'EEEE d', { locale: es })

  let estado = 'Turno en curso'
  let restante = textoRestante(fin - cursor)
  if (antes) {
    estado = 'Aún no abre'
    restante = `Abre a las ${etiquetaHora(ini)}`
  } else if (!enCurso) {
    estado = 'Turno cerrado'
    restante = 'Ya cerró'
  }

  return {
    dia: dia.charAt(0).toUpperCase() + dia.slice(1),
    hora: etiquetaHora(ahoraMin),
    aperturaTexto: etiquetaHora(ini),
    cierreTexto: etiquetaHora(fin),
    mitadTexto: etiquetaHora(ini + Math.round(total / 2)),
    inicioMin: ini,
    finMin: fin,
    porcentaje,
    estado,
    restante,
    enCurso,
  }
}

export default CabeceraNegocio
