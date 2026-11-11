import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAppHeader } from '../../hooks/useAppHeader.js'
import { Ellipsis, Plus, ClipboardClock, Bell } from 'lucide-react'
import MenuTablas from './MenuTablas.jsx'
import TalyPosado from '../Taly/TalyPosado.jsx'
import { contarSinLeer } from '../../services/notificaciones.js'
import './AppHeader.css'

/* Iconos propios de cada pestaña. La campana va en todas: Notificaciones
   junta tus avisos y los de tu local, así que no es cosa de una sola pestaña.
   Los tres puntos no van aquí: son el botón del menú y se pintan siempre, al
   final de la fila. */
const CAMPANA = { name: 'notification', content: <Bell size={24} color="currentColor" /> }

function getHeaderIcons(title) {
  switch (title) {
    case 'Mis Citas':
      return [
        { name: 'plus', content: <Plus size={24} color="currentColor" /> },
        { name: 'clipboard-clock', content: <ClipboardClock size={24} color="currentColor" /> },
        CAMPANA,
      ]

    default:
      return [CAMPANA]
  }
}

/* La campana lleva a la página de notificaciones. El contador se lee en cada
   render del header, que ya se repinta al cambiar de ruta: al volver de
   Notificaciones baja solo. */
function CampanaNotis({ children }) {
  const sinLeer = contarSinLeer()
  const texto = sinLeer > 9 ? '9+' : String(sinLeer)
  return (
    <Link
      to="/notificaciones"
      className="app-header-boton app-header-campana"
      aria-label={sinLeer ? `Notificaciones, ${sinLeer} sin leer` : 'Notificaciones'}
    >
      {children}
      {sinLeer > 0 && (
        <span className="app-header-contador" aria-hidden="true">
          {texto}
        </span>
      )}
    </Link>
  )
}

function AppHeader() {
  const { visible, title } = useAppHeader()
  const { pathname } = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const botonRef = useRef(null)

  /* Si se cambia de pantalla con el cartel desplegado, se recoge solo. */
  useEffect(() => {
    setMenuAbierto(false)
  }, [pathname])

  if (!visible) return null

  const icons = getHeaderIcons(title)

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <span className="app-header-brand">Citaly</span>
        <h1 className="app-header-title">{title}</h1>
      </div>

      <div className="app-header-icons">
        {icons.map((icon) =>
          icon.name === 'notification' ? (
            <CampanaNotis key={icon.name}>{icon.content}</CampanaNotis>
          ) : (
            <span className="app-header-icon" key={icon.name}>
              {icon.content}
            </span>
          ),
        )}
        <button
          ref={botonRef}
          type="button"
          className="app-header-boton"
          aria-label="Más opciones"
          aria-haspopup="menu"
          aria-expanded={menuAbierto}
          onClick={() => setMenuAbierto((v) => !v)}
        >
          <Ellipsis size={25} aria-hidden="true" />
        </button>
      </div>

      <TalyPosado menuAbierto={menuAbierto} />

      <MenuTablas
        abierto={menuAbierto}
        onCerrar={() => setMenuAbierto(false)}
        anclaRef={botonRef}
      />
    </header>
  )
}

export default AppHeader
