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
import { FAVORITOS_EVENTO, getFavoritos } from '../../services/favoritos.js'
import { getAllLocales, getLocalById } from '../../services/locales.js'
import { fotoAncho, horarioDeLocal } from '../../utils/fichaLocal.js'
import { statsCitasPerfil } from '../../utils/statsCitasPerfil.js'
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

function Fila({ Icono, titulo, valor, extra, to, tono, onClick, abierto, panel }) {
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
      {(to || onClick) && (
        <ChevronRight
          className={`perfil-fila-flecha${abierto ? ' perfil-fila-flecha--abierta' : ''}`}
          size={16}
          strokeWidth={2.25}
          aria-hidden="true"
        />
      )}
    </>
  )
  const clase = `perfil-fila${tono === 'rojo' ? ' perfil-fila--rojo' : ''}`
  return (
    <li>
      {to ? (
        <Link className={clase} to={to}>
          {cuerpo}
        </Link>
      ) : onClick ? (
        <button type="button" className={clase} aria-expanded={abierto} onClick={onClick}>
          {cuerpo}
        </button>
      ) : (
        <div className={`${clase} perfil-fila--quieta`}>{cuerpo}</div>
      )}
      <div
        className={`perfil-despliegue-contenedor${abierto ? ' perfil-despliegue-contenedor--abierto' : ''}`}
        aria-hidden={!abierto}
      >
        {panel}
      </div>
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

function PanelCitas() {
  const s = statsCitasPerfil()
  const local = s.masVisitadoId ? getLocalById(s.masVisitadoId) : null
  /* Índice de cuaderno: etiqueta, puntos y cifra. Las cifras llevan el acento;
     el nombre del local no, porque es un dato, no una medida. */
  const filas = [
    { k: 'idas', label: 'Idas', valor: s.idas, cifra: true },
    { k: 'canceladas', label: 'Canceladas', valor: s.canceladas, cifra: true },
    { k: 'curso', label: 'En curso', valor: s.enCurso, cifra: true },
    { k: 'mes', label: 'Al mes', valor: s.promedioMes, cifra: true },
    { k: 'puntual', label: 'Puntualidad', valor: s.puntualidad != null ? `${s.puntualidad}%` : 'Sin datos', cifra: s.puntualidad != null },
    { k: 'top', label: 'Donde más vas', valor: local?.localName ?? 'Todavía nada', cifra: false },
  ]

  return (
    <div className="perfil-despliegue perfil-despliegue--citas">
      {filas.map((f) => (
        <p key={f.k}>
          <span>{f.label}</span>
          <i aria-hidden="true" />
          <strong className={f.cifra ? 'perfil-cifra' : undefined}>{f.valor}</strong>
        </p>
      ))}
    </div>
  )
}

function PanelFavoritos() {
  const [ids, setIds] = useState(getFavoritos)

  useEffect(() => {
    const sync = () => setIds(getFavoritos())
    window.addEventListener(FAVORITOS_EVENTO, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(FAVORITOS_EVENTO, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const locales = getAllLocales().filter((l) => ids.includes(l.id))
  const orden = ids.map((id) => locales.find((l) => l.id === id)).filter(Boolean)

  if (orden.length === 0) {
    return <p className="perfil-despliegue-vacio">Todavía no marcas locales. Puedes hacerlo desde la seccion de Descubre o entrado a los detalles de algun negocio.</p>
  }

  return (
    <ul className="perfil-favs">
      {orden.map((l) => (
        <li key={l.id}>
          <Link className="perfil-fav" to={`/local/${l.id}`}>
            <span className="perfil-fav-foto" style={{ backgroundImage: `url(${fotoAncho(l.url, 200)})` }} />
            <span className="perfil-fila-textos">
              <span className="perfil-fila-titulo">{l.localName}</span>
              <span className="perfil-fila-valor">{l.categoria}</span>
            </span>
            <ChevronRight className="perfil-fila-flecha" size={16} strokeWidth={2.25} aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  )
}

function DatosPerfil({ dueno, trabajo = [], onPedirTrabajo, onSesion }) {
  const [avisos, setAvisos] = useState(leerAvisos)
  const [panel, setPanel] = useState(null)
  const [nFavs, setNFavs] = useState(() => getFavoritos().length)

  useEffect(() => {
    localStorage.setItem(AVISOS_KEY, JSON.stringify(avisos))
  }, [avisos])

  useEffect(() => {
    const sync = () => setNFavs(getFavoritos().length)
    window.addEventListener(FAVORITOS_EVENTO, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(FAVORITOS_EVENTO, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const cambiar = (clave, valor) => setAvisos((prev) => ({ ...prev, [clave]: valor }))
  const alternar = (id) => setPanel((p) => (p === id ? null : id))

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
            <Fila
              Icono={Briefcase}
              titulo="Trabajas en"
              valor="En ningún local de Citaly"
              onClick={onPedirTrabajo}
            />
          ) : (
            <>
              {trabajo.map((item) => (
                <Fila
                  key={item.id}
                  Icono={Briefcase}
                  titulo={`Trabajas en ${item.localName}`}
                  valor={item.rol}
                  extra={
                    <span className={`perfil-pastilla${item.estado === 'pendiente' ? ' perfil-pastilla--espera' : ' perfil-pastilla--si'}`}>
                      {item.estado === 'pendiente' ? 'Pendiente' : 'Activo'}
                    </span>
                  }
                  to={`/local/${item.id}`}
                />
              ))}
              <Fila Icono={Store} titulo="Trabajas en más de un lugar ? " valor="Solicita unirte" onClick={onPedirTrabajo} />
            </>
          )}
        </ul>
      </section>

      <section className="perfil-bloque" aria-labelledby="perfil-actividad">
        <header className="perfil-bloque-cabecera">
          <h2 id="perfil-actividad">Actividad</h2>
        </header>
        <ul className="perfil-grupo">
          <Fila
            Icono={CalendarDays}
            titulo="Mis citas"
            valor="Un resumen de tus citas"
            abierto={panel === 'citas'}
            onClick={() => alternar('citas')}
            panel={<PanelCitas />}
          />
          <Fila
            Icono={Heart}
            titulo="Favoritos"
            valor={nFavs ? `${nFavs} ${nFavs === 1 ? 'local' : 'locales'}` : 'Todavía no marcas locales'}
            abierto={panel === 'favs'}
            onClick={() => alternar('favs')}
            panel={<PanelFavoritos />}
          />
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
              <Switch activo={false} disabled label="Verificación en dos pasos" onChange={() => { }} />
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
            <button type="button" className="perfil-fila perfil-fila--rojo" onClick={onSesion}>
              <span className="perfil-fila-icono perfil-fila-icono--rojo">
                <LogOut size={17} strokeWidth={2.15} aria-hidden="true" />
              </span>
              <span className="perfil-fila-textos">
                <span className="perfil-fila-titulo">Cerrar sesión</span>
                <span className="perfil-fila-valor">Salir de esta cuenta</span>
              </span>
              <ChevronRight className="perfil-fila-flecha" size={16} strokeWidth={2.25} aria-hidden="true" />
            </button>
          </li>
        </ul>
      </section>
    </div>
  )
}

export default DatosPerfil
