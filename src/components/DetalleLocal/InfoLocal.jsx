import { useId, useState } from 'react'
import { ChevronDown, ChevronRight, Clock, MapPin, Phone } from 'lucide-react'
import IconoWhatsApp from '../IconoWhatsApp/IconoWhatsApp.jsx'
import { DIAS, codigoDia, digitos, horarioDeLocal } from '../../utils/fichaLocal.js'
import { comodidadesDe } from '../../utils/descubre.js'
import talyDormido from '../Taly/taly-crayon-dormido.svg'
import { MapaTinta } from './Tinta.jsx'
import './infoLocal.css'

const NOMBRE_DIA = {
  l: 'Lunes',
  m: 'Martes',
  x: 'Miércoles',
  j: 'Jueves',
  v: 'Viernes',
  s: 'Sábado',
  d: 'Domingo',
}

/* Lo práctico, al final: cuándo abren, cómo llegar, cómo hablarles y qué
   comodidades tiene el sitio. */
function InfoLocal({ local, estado }) {
  const comodidades = comodidadesDe(local, Infinity)
  const urlMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(local.direccion ?? '')}`
  const whatsapp = local.whatsapp ?? local.telefono
  const urlWhatsApp = `https://wa.me/${digitos(whatsapp)}?text=${encodeURIComponent(
    `Hola, vi ${local.localName} en Citaly y me gustaría consultar.`,
  )}`

  return (
    <div className="local-info">
      <HorarioLocal local={local} estado={estado} />

      <div className="local-info-bloque">
        <h3 className="local-info-subtitulo">Cómo llegar</h3>
        <a
          className="local-info-grupo local-info-mapa"
          href={urlMaps}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir ${local.direccion} en Google Maps`}
        >
          <MapaTinta />
          <span className="local-info-fila">
            <span className="local-info-icono"><MapPin size={19} /></span>
            <span className="local-info-textos">
              <span className="local-info-titulo">{local.direccion}</span>
              <span className="local-info-valor">A {local.metros} m de ti · abrir en Maps</span>
            </span>
            <ChevronRight size={18} className="local-info-flecha" aria-hidden="true" />
          </span>
        </a>
      </div>

      <div className="local-info-bloque">
        <h3 className="local-info-subtitulo">Contacto</h3>
        <div className="local-info-grupo">
          {local.telefono ? (
            <a className="local-info-fila local-info-fila--link" href={`tel:${digitos(local.telefono)}`}>
              <span className="local-info-icono"><Phone size={19} /></span>
              <span className="local-info-textos">
                <span className="local-info-titulo">Llamar</span>
                <span className="local-info-valor">{local.telefono}</span>
              </span>
              <ChevronRight size={18} className="local-info-flecha" aria-hidden="true" />
            </a>
          ) : null}
          {whatsapp ? (
            <a
              className="local-info-fila local-info-fila--link"
              href={urlWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="local-info-icono local-info-icono--whatsapp"><IconoWhatsApp size={19} /></span>
              <span className="local-info-textos">
                <span className="local-info-titulo">WhatsApp</span>
                <span className="local-info-valor">{whatsapp}</span>
              </span>
              <ChevronRight size={18} className="local-info-flecha" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>

      {comodidades.length ? (
        <div className="local-info-bloque">
          <h3 className="local-info-subtitulo">Comodidades</h3>
          <ul className="local-comodidades">
            {comodidades.map(({ id, label, Icono }) => (
              <li key={id} className="local-comodidad">
                <Icono size={17} aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

/* "Hoy 9AM - 8PM ▾": la línea que importa, y al abrirla la semana entera con
   las horas de cada día y hoy marcado. El panel se despliega con la
   transición de grid-template-rows (0fr → 1fr), sin medir alturas. */
function HorarioLocal({ local, estado }) {
  const [abierto, setAbierto] = useState(false)
  const panelId = useId()
  const hoy = codigoDia(new Date())
  const dias = local.dias ?? []
  const abreHoy = dias.includes(hoy)
  const horas = horarioDeLocal(local)

  return (
    <div className="local-info-bloque">
      <h3 className="local-info-subtitulo">Horario</h3>
      <div className="local-info-grupo">
        <button
          type="button"
          className="local-info-fila local-info-fila--link local-horario-resumen"
          aria-expanded={abierto}
          aria-controls={panelId}
          onClick={() => setAbierto((v) => !v)}
        >
          <span className="local-info-icono"><Clock size={19} /></span>
          <span className="local-info-textos">
            <span className="local-info-titulo">{abreHoy ? `Hoy ${horas}` : 'Hoy descansan'}</span>
            <span className={`local-info-valor ${estado.abierto ? 'local-horario-abierto' : 'local-horario-cerrado'}`}>
              {estado.texto}
              {estado.detalle ? ` · ${estado.detalle}` : ''}
            </span>
          </span>
          {!abreHoy ? <img src={talyDormido} alt="" className="local-horario-taly" /> : null}
          <ChevronDown
            size={18}
            className={`local-info-flecha local-horario-chevron${abierto ? ' local-horario-chevron--abierto' : ''}`}
            aria-hidden="true"
          />
        </button>

        <div id={panelId} className={`local-horario-panel${abierto ? ' local-horario-panel--abierto' : ''}`} inert={!abierto}>
          <ul className="local-horario-semana">
            {DIAS.map(({ id }) => {
              const abre = dias.includes(id)
              return (
                <li key={id} className={`local-horario-dia${id === hoy ? ' local-horario-dia--hoy' : ''}`}>
                  <span>
                    {NOMBRE_DIA[id]}
                    {id === hoy ? <span className="local-horario-hoy">hoy</span> : null}
                  </span>
                  <span className={abre ? '' : 'local-horario-libre'}>{abre ? horas : 'Cerrado'}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default InfoLocal
