import { useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAppHeader } from '../../hooks/useAppHeader.js'
import { Ellipsis, Plus, ClipboardClock, Bell } from 'lucide-react'
import MenuTablas from './MenuTablas.jsx'
import GraciasCompartir from './GraciasCompartir.jsx'
import TalyPosado from '../Taly/TalyPosado.jsx'
import Logotipo from '../Logotipo/Logotipo.jsx'
import { contarSinLeer } from '../../services/notificaciones.js'
import { compartirCitaly } from '../../services/compartir.js'
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
        CAMPANA
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

/* Nubes de plumón regadas por todo el header, SOLO en móvil (en PC se quedan
   en el rincón de Taly). Son las mismas del rincón (misma forma y tinta), en
   poca cantidad y casi transparentes: dan cielo sin competir con el texto.
   [x, y, escala] en un viewBox de 400 × 70. */
const NUBE =
  'M44 196 C26 196 21 176 39 171 C38 151 69 147 78 162 C91 145 123 150 124 171 C144 168 151 189 130 194 Z'
const NUBES_HEADER = [
  [14, 9, 0.32],
  [140, 36, 0.2],
  [228, 7, 0.3],
  [318, 33, 0.24],
]

function NubesHeader() {
  return (
    <svg className="app-header-nubes" viewBox="0 0 400 70" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      {NUBES_HEADER.map(([x, y, e]) => (
        <path key={x} d={NUBE} transform={`translate(${x} ${y}) scale(${e}) translate(-21 -147)`} />
      ))}
    </svg>
  )
}

/* Compartir la app: la función vive en services/compartir.js porque el pie
   de página también la usa. Al volver con algo compartido salen las gracias. */

function AppHeader() {
  const { visible, title } = useAppHeader()
  const { pathname } = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [gracias, setGracias] = useState(null)
  const [rutaDelMenu, setRutaDelMenu] = useState(pathname)
  const botonRef = useRef(null)
  const headerRef = useRef(null)
  const textosRef = useRef(null)
  const iconosRef = useRef(null)

  /* Si se cambia de pantalla con el cartel desplegado, se recoge solo.
     Ajuste durante el render, no en un efecto: así no hay un frame con el
     cartel abierto en la pantalla nueva. */
  if (rutaDelMenu !== pathname) {
    setRutaDelMenu(pathname)
    setMenuAbierto(false)
  }

  /* El rincón de Taly va pegado a los iconos y llega hasta donde acaba el
     título. Cada pestaña tiene distintos iconos, así que se mide en vez de
     fijar un número. */
  useLayoutEffect(() => {
    const header = headerRef.current
    const textos = textosRef.current
    const iconos = iconosRef.current
    if (!header || !textos || !iconos) return undefined
    const medir = () => {
      /* 22 px de aire entre el título y el rincón (antes 12: se sentía pegado). */
      const libre = iconos.getBoundingClientRect().left - textos.getBoundingClientRect().right - 22
      header.style.setProperty('--iconos-ancho', `${iconos.offsetWidth}px`)
      header.style.setProperty('--rincon-ancho', `${Math.round(Math.min(Math.max(libre, 80), 150))}px`)
      /* Lo que mide el header, para que lo pegajoso de cada página se pegue debajo. */
      document.documentElement.style.setProperty('--app-header-alto', `${header.offsetHeight}px`)
    }
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(header)
    ro.observe(iconos)
    return () => {
      ro.disconnect()
      document.documentElement.style.removeProperty('--app-header-alto')
    }
  }, [title, visible])

  if (!visible) return null

  const icons = getHeaderIcons(title)

  return (
    <header className="app-header" ref={headerRef}>
      <NubesHeader />
      <div className="app-header-inner" ref={textosRef}>
        <Logotipo className="app-header-brand" />
        <h1 className="app-header-title">{title}</h1>
      </div>

      <div className="app-header-icons" ref={iconosRef}>
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
          className="app-header-boton app-header-boton--menu"
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
        onCompartir={() => compartirCitaly(setGracias)}
      />

      {/* La key reinicia la nota (y sus 10 s) si se vuelve a compartir con
          una todavía en pantalla. */}
      {gracias && (
        <GraciasCompartir key={gracias.vez} copiado={gracias.copiado} onFin={() => setGracias(null)} />
      )}
    </header>
  )
}

export default AppHeader
