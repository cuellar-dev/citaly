import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Check } from 'lucide-react'
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

  return (
    <header className="cabecera-negocio" >
      <div className='cabecera-negocio-containers'>
      <div className="cabecera-negocio-identidad"style={{ backgroundImage: `url(${url})` }} >
        <div className="cabecera-negocio-textos">
          <h2 className="cabecera-negocio-nombre">{nombre}</h2>
          <p className="cabecera-negocio-estado">{turno.estado}</p>
        </div>
        <div className='cabecera-negocio-recibiendo-container'>
        {recibiendo && turno.enCurso && (
          <p className="cabecera-negocio-recibiendo">
            <Check size={14} strokeWidth={2.5} aria-hidden="true" />
            Recibiendo
          </p>
        )}
        
        </div>
      </div>
      <div className='cabecera-negocio-containers-reloj'>
        <div className="cabecera-negocio-reloj">
        <p>
          {turno.dia} · {turno.hora}
        </p>
        <p>{turno.restante}</p>
        </div>
        <div
        className="cabecera-negocio-timeline"
        role="img"
        aria-label={`${turno.estado}. ${turno.restante}. Abre ${turno.aperturaTexto}, cierra ${turno.cierreTexto}.`}
      >
        <div className="cabecera-negocio-pista">
          <div className="cabecera-negocio-llenado" style={{ width: `${turno.porcentaje}%` }} />
          <span className="cabecera-negocio-marca" style={{ left: `${turno.porcentaje}%` }} />
        </div>
        <div className="cabecera-negocio-marcas">
          <span>{turno.aperturaTexto}</span>
          <span className="cabecera-negocio-ahora" style={{ left: `${turno.porcentaje}%` , top:`${turno.porcentaje >= 80 || turno.porcentaje <= 20 ? 13 : 0 }px` }}>
            Ahora
          </span>
          <span>{turno.cierreTexto}</span>
        </div>
      </div>
      </div>
      
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
    porcentaje,
    estado,
    restante,
    enCurso,
  }
}

export default CabeceraNegocio
