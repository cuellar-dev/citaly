import { Suspense, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AppHeader from '../components/AppHeader/AppHeader.jsx'
import NavBar from '../components/NavBar/NavBar.jsx'
import ChatTaly from '../components/ChatTaly/index.jsx' // PROTOTIPO chat Taly: quitar esta línea
import ErrorPagina from '../components/ErrorPagina/ErrorPagina.jsx'
import { SECCIONES, useSwipeSecciones } from '../hooks/useSwipeSecciones.js'
import { precargarEnReposo } from '../paginas.js'
import './Layout.css'

/* Entre pestañas, la página nueva entra desde el lado hacia el que vas
   (igual si deslizas que si tocas la barra). Fuera de las pestañas, entra
   de abajo como siempre. */
function direccion(antes, ahora) {
  const a = SECCIONES.indexOf(antes)
  const b = SECCIONES.indexOf(ahora)
  if (a === -1 || b === -1 || a === b) return 'abajo'
  return b > a ? 'derecha' : 'izquierda'
}

/* Sube al principio cuando la página YA está montada. Va dentro del mismo
   Suspense, detrás del <Outlet />: su efecto corre después de los de la
   página. Hace falta desde que las páginas bajan al entrar: algunas, al
   montar, centran algo con scrollIntoView (la tira de días de Mi Negocio,
   el selector de fecha de las reservas) y eso arrastraba la ventana hacia
   abajo. Antes lo deshacía el scrollTo del Layout porque corría después;
   con la carga diferida el Layout ya había montado mucho antes. */
function ArribaAlMontar() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  return null
}

function Layout({ fallback = null }) {
  const location = useLocation()
  const mainRef = useRef(null)
  const paginaRef = useRef(null)
  const [ruta, setRuta] = useState(location.pathname)
  const [entrada, setEntrada] = useState('abajo')

  if (ruta !== location.pathname) {
    setEntrada(direccion(ruta, location.pathname))
    setRuta(location.pathname)
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  useSwipeSecciones(mainRef, paginaRef)

  /* Con la página ya cargada y el navegador libre, se adelantan las pestañas
     de la barra (para que deslizar o tocar no enseñe el esqueleto). Respeta
     el ahorro de datos: ver paginas.js. */
  useEffect(() => {
    precargarEnReposo()
  }, [])

  return (
    <div className="layout">
      <AppHeader />
      <main className="layout-main" ref={mainRef}>
        <div key={location.pathname} ref={paginaRef} className={`layout-page layout-page--${entrada}`}>
          <ErrorPagina clave={location.pathname}>
            <Suspense fallback={fallback}>
              <Outlet />
              <ArribaAlMontar />
            </Suspense>
          </ErrorPagina>
        </div>
      </main>
      <NavBar />
      <ChatTaly /> {/* PROTOTIPO chat Taly: quitar esta línea */}
    </div>
  )
}

export default Layout
