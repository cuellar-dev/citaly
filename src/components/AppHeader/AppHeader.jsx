import { useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAppHeader } from '../../hooks/useAppHeader.js'
import { Ellipsis, Plus, ClipboardClock, Bell } from 'lucide-react'
import MenuTablas from './MenuTablas.jsx'
import GraciasCompartir from './GraciasCompartir.jsx'
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

/* Compartir la app. En el móvil abre el menú de compartir del sistema y, al
   volver de él con algo compartido, salen las gracias. Si el usuario lo
   cierra sin compartir (AbortError) no se le agradece nada. Donde no hay menú
   de compartir (escritorio), se copia el enlace y se avisa de ello. */
const DATOS_COMPARTIR = {
  title: 'Citaly',
  text: 'Reserva en tus sitios favoritos sin llamar ni esperar. Mira Citaly:',
}

function compartirCitaly(alTerminar) {
  const url = window.location.origin
  if (navigator.share) {
    /* Se llama sin esperar nada antes: el navegador solo abre el menú si
       viene directo del toque. */
    navigator
      .share({ ...DATOS_COMPARTIR, url })
      .then(() => alTerminar({ copiado: false, vez: Date.now() }))
      .catch(() => {})
    return
  }
  navigator.clipboard
    ?.writeText(`${DATOS_COMPARTIR.text} ${url}`)
    .then(() => alTerminar({ copiado: true, vez: Date.now() }))
    .catch(() => {})
}

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
      const libre = iconos.getBoundingClientRect().left - textos.getBoundingClientRect().right - 12
      header.style.setProperty('--iconos-ancho', `${iconos.offsetWidth}px`)
      header.style.setProperty('--rincon-ancho', `${Math.round(Math.min(Math.max(libre, 80), 150))}px`)
    }
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(header)
    ro.observe(iconos)
    return () => ro.disconnect()
  }, [title, visible])

  if (!visible) return null

  const icons = getHeaderIcons(title)

  return (
    <header className="app-header" ref={headerRef}>
      <div className="app-header-inner" ref={textosRef}>
        <span className="app-header-brand">Citaly</span>
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
