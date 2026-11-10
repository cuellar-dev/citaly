import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAppHeader } from '../../hooks/useAppHeader.js'
import { Ellipsis, Plus, ClipboardClock, Bell } from 'lucide-react'
import MenuTablas from './MenuTablas.jsx'
import TalyPosado from '../Taly/TalyPosado.jsx'
import './AppHeader.css'

/* Iconos propios de cada pestaña. Los tres puntos no van aquí: son el botón
   del menú y se pintan siempre, al final de la fila. */
function getHeaderIcons(title) {
  switch (title) {
    case 'Mis Citas':
      return [
        { name: 'plus', content: <Plus size={24} color="currentColor" /> },
        { name: 'clipboard-clock', content: <ClipboardClock size={24} color="currentColor" /> },
      ]

    case 'Mi Negocio':
      return [{ name: 'notification', content: <Bell size={24} color="currentColor" /> }]

    default:
      return []
  }
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
        {icons.map((icon) => (
          <span className="app-header-icon" key={icon.name}>
            {icon.content}
          </span>
        ))}
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
