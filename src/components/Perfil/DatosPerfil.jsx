import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  Briefcase,
  CalendarDays,
  ChevronRight,
  Clock3,
  Heart,
  KeyRound,
  LogOut,
  Shield,
  Smartphone,
  Store,
  UserRound,
} from 'lucide-react'
import { fotoAncho, horarioDeLocal } from '../../utils/fichaLocal.js'
import './datosPerfil.css'

const AVISOS_KEY = 'citaly_perfil_avisos'
const RECORDATORIOS = [
  { id: 'no', label: 'No' },
  { id: '30', label: '30 min' },
  { id: '60', label: '1 h' },
  { id: '120', label: '2 h' },
]

const AVISOS_INICIAL = { whatsapp: true, recordatorio: '60', nombreCorto: false }

function leerAvisos() {
  try {
    return { ...AVISOS_INICIAL, ...JSON.parse(localStorage.getItem(AVISOS_KEY)) }
  } catch {
    return AVISOS_INICIAL
  }
}

function Switch({ activo, label, onChange, disabled }) {
  return (
    <button
      type="button"
      className={`perfil-switch${activo ? ' perfil-switch--on' : ''}`}
      role="switch"
      aria-checked={activo}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!activo)}
    >
      <i />
    </button>
  )
}

function Fila({ Icono, titulo, valor, extra, to, tono }) {
  const cuerpo = (
    <>
      <span className={`perfil-fila-icono${tono === 'rojo' ? ' perfil-fila-icono--rojo' : ''}`}>
        <Icono size={17} strokeWidth={2.15} aria-hidden="true" />
      </span>
      <span className="perfil-fila-textos">
        <span className="perfil-fila-titulo">{titulo}</span>
        {valor && <span className="perfil-fila-valor">{valor}</span>}
      </span>
      {extra}
      {to && <ChevronRight className="perfil-fila-flecha" size={16} strokeWidth={2.25} aria-hidden="true" />}
    </>
  )
  if (to) {
    return (
      <li>
        <Link className={`perfil-fila${tono === 'rojo' ? ' perfil-fila--rojo' : ''}`} to={to}>
          {cuerpo}
        </Link>
      </li>
    )
  }
  return (
    <li>
      <div className={`perfil-fila perfil-fila--quieta${tono === 'rojo' ? ' perfil-fila--rojo' : ''}`}>{cuerpo}</div>
    </li>
  )
}

function TarjetaLocalDueno({ local }) {
  if (!local) {
    return (
      <Link className="perfil-fila" to="/negocio">
        <span className="perfil-fila-icono">
          <Store size={17} strokeWidth={2.15} aria-hidden="true" />
        </span>
        <span className="perfil-fila-textos">
          <span className="perfil-fila-titulo">Dueño de un local</span>
          <span className="perfil-fila-valor">Todavía no tienes uno en Citaly</span>
        </span>
        <span className="perfil-pastilla">No</span>
        <ChevronRight className="perfil-fila-flecha" size={16} strokeWidth={2.25} aria-hidden="true" />
      </Link>
    )
  }

  return (
    <Link className="perfil-local" to="/negocio" aria-label={`Abrir ${local.localName} en Mi Negocio`}>
      <span className="perfil-local-foto" style={{ backgroundImage: `url(${fotoAncho(local.url, 720)})` }} />
      <span className="perfil-local-velo" />
      <span className="perfil-local-cuerpo">
        <span className="perfil-pastilla perfil-pastilla--si">Dueño</span>
        <strong>{local.localName}</strong>
        <small>{[local.categoria, horarioDeLocal(local)].filter(Boolean).join(' · ')}</small>
      </span>
    </Link>
  )
}

function DatosPerfil({ dueno, trabajo = [] }) {
  const [avisos, setAvisos] = useState(leerAvisos)

  useEffect(() => {
    localStorage.setItem(AVISOS_KEY, JSON.stringify(avisos))
  }, [avisos])

  const cambiar = (clave, valor) => setAvisos((prev) => ({ ...prev, [clave]: valor }))

  return (
    <div className="perfil-datos">
      <section className="perfil-bloque" aria-labelledby="perfil-lugar">
        <header className="perfil-bloque-cabecera">
          <h2 id="perfil-lugar">Tu lugar</h2>
        </header>
        <div className="perfil-grupo perfil-grupo--solido">
          <TarjetaLocalDueno local={dueno} />
        </div>
      </section>

      <section className="perfil-bloque" aria-labelledby="perfil-avisos">
        <header className="perfil-bloque-cabecera">
          <h2 id="perfil-avisos">Avisos</h2>
        </header>
        <ul className="perfil-grupo">
          <li>
            <div className="perfil-fila perfil-fila--quieta">
              <span className="perfil-fila-icono">
                <Bell size={17} strokeWidth={2.15} aria-hidden="true" />
              </span>
              <span className="perfil-fila-textos">
                <span className="perfil-fila-titulo">WhatsApp al aceptar</span>
                <span className="perfil-fila-valor">Cuando el local confirme tu cita</span>
              </span>
              <Switch
                activo={avisos.whatsapp}
                label="Avisar por WhatsApp cuando acepten"
                onChange={(valor) => cambiar('whatsapp', valor)}
              />
            </div>
          </li>
          <li>
            <div className="perfil-fila perfil-fila--columna perfil-fila--quieta">
              <span className="perfil-fila-linea">
                <span className="perfil-fila-icono">
                  <Clock3 size={17} strokeWidth={2.15} aria-hidden="true" />
                </span>
                <span className="perfil-fila-textos">
                  <span className="perfil-fila-titulo">Recordatorio</span>
                  <span className="perfil-fila-valor">Antes de la hora de la cita</span>
                </span>
              </span>
              <div className="perfil-segmento" role="radiogroup" aria-label="Cuándo recordarte">
                {RECORDATORIOS.map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    role="radio"
                    aria-checked={avisos.recordatorio === op.id}
                    className={avisos.recordatorio === op.id ? 'perfil-segmento--activo' : ''}
                    onClick={() => cambiar('recordatorio', op.id)}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>
          </li>
          <li>
            <div className="perfil-fila perfil-fila--quieta">
              <span className="perfil-fila-icono">
                <UserRound size={17} strokeWidth={2.15} aria-hidden="true" />
              </span>
              <span className="perfil-fila-textos">
                <span className="perfil-fila-titulo">Nombre en opiniones</span>
                <span className="perfil-fila-valor">{avisos.nombreCorto ? 'Solo el nombre' : 'Nombre y apellido'}</span>
              </span>
              <Switch
                activo={avisos.nombreCorto}
                label="Mostrar solo el nombre en opiniones"
                onChange={(valor) => cambiar('nombreCorto', valor)}
              />
            </div>
          </li>
        </ul>
      </section>

      <section className="perfil-bloque" aria-labelledby="perfil-trabajo">
        <header className="perfil-bloque-cabecera">
          <h2 id="perfil-trabajo">Trabajo</h2>
        </header>
        <ul className="perfil-grupo">
          {trabajo.length === 0 ? (
            <Fila Icono={Briefcase} titulo="Trabajas en" valor="En ningún local de Citaly" />
          ) : (
            trabajo.map((item) => (
              <Fila
                key={item.id}
                Icono={Briefcase}
                titulo={`Trabajas en ${item.localName}`}
                valor={[item.rol, item.desde].filter(Boolean).join(' · ')}
                extra={
                  <span className={`perfil-pastilla${item.estado === 'pendiente' ? ' perfil-pastilla--espera' : ' perfil-pastilla--si'}`}>
                    {item.estado === 'pendiente' ? 'Pendiente' : 'Activo'}
                  </span>
                }
                to={`/local/${item.id}`}
              />
            ))
          )}
        </ul>
      </section>

      <section className="perfil-bloque" aria-labelledby="perfil-actividad">
        <header className="perfil-bloque-cabecera">
          <h2 id="perfil-actividad">Actividad</h2>
        </header>
        <ul className="perfil-grupo">
          <Fila Icono={CalendarDays} titulo="Mis citas" valor="Próximas y pasadas" to="/citas" />
          <Fila Icono={Heart} titulo="Favoritos" valor="Todavía no marcas locales" />
        </ul>
      </section>

      <section className="perfil-bloque" aria-labelledby="perfil-seguridad">
        <header className="perfil-bloque-cabecera">
          <h2 id="perfil-seguridad">Seguridad</h2>
        </header>
        <ul className="perfil-grupo">
          <Fila Icono={KeyRound} titulo="Cambiar contraseña" valor="Cuando la cuenta esté conectada" />
          <li>
            <div className="perfil-fila perfil-fila--quieta">
              <span className="perfil-fila-icono">
                <Smartphone size={17} strokeWidth={2.15} aria-hidden="true" />
              </span>
              <span className="perfil-fila-textos">
                <span className="perfil-fila-titulo">Verificación en dos pasos</span>
                <span className="perfil-fila-valor">Llega más adelante</span>
              </span>
              <Switch activo={false} disabled label="Verificación en dos pasos" onChange={() => {}} />
            </div>
          </li>
          <Fila Icono={Shield} titulo="Sesiones activas" valor="Solo este dispositivo" />
        </ul>
      </section>

      <section className="perfil-bloque" aria-labelledby="perfil-sesion">
        <header className="perfil-bloque-cabecera">
          <h2 id="perfil-sesion">Sesión</h2>
        </header>
        <ul className="perfil-grupo">
          <li>
            <button type="button" className="perfil-fila perfil-fila--rojo" disabled>
              <span className="perfil-fila-icono perfil-fila-icono--rojo">
                <LogOut size={17} strokeWidth={2.15} aria-hidden="true" />
              </span>
              <span className="perfil-fila-textos">
                <span className="perfil-fila-titulo">Cerrar sesión</span>
                <span className="perfil-fila-valor">Cuando haya cuenta de verdad</span>
              </span>
            </button>
          </li>
        </ul>
      </section>
    </div>
  )
}

export default DatosPerfil
