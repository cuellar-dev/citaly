import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AppHeader from '../components/AppHeader/AppHeader.jsx'
import NavBar from '../components/NavBar/NavBar.jsx'
import { SECCIONES, useSwipeSecciones } from '../hooks/useSwipeSecciones.js'
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

function Layout() {
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

  return (
    <div className="layout">
      <AppHeader />
      <main className="layout-main" ref={mainRef}>
        <div key={location.pathname} ref={paginaRef} className={`layout-page layout-page--${entrada}`}>
          <Outlet />
        </div>
      </main>
      <NavBar />
    </div>
  )
}

export default Layout
