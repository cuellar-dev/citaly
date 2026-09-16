import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Store } from 'lucide-react'
import './navbar.css'

const navItems = [
  {
    to: '/',
    label: 'Descubre',
    end: true,
    anim: 'brujula',
    color: 'var(--nav-color-descubre)',
    icon: (
      <svg className="logos-brujula" xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z" />
      </svg>
    ),
  },
  {
    to: '/citas',
    label: 'Mis Citas',
    anim: 'citas',
    color: 'var(--nav-color-citas)',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <path d="M16 2v4M8 2v4m-5 4h18" />
      </svg>
    ),
  },
  {
    to: '/negocio',
    label: 'Mi Negocio',
    anim: 'negocio',
    color: 'var(--nav-color-negocio)',
    icon: (
      <Store className="logos-store" />
    ),
  },
  {
    to: '/perfil',
    label: 'Mi Perfil',
    anim: 'perfil',
    color: 'var(--nav-color-perfil)',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

function NavBar() {
  const { pathname } = useLocation()
  // Una key por icono: al subirla, el <span> se vuelve a montar y la animacion se repite.
  const [animKeys, setAnimKeys] = useState(() => navItems.map(() => 0))

  const indiceActivo = navItems.findIndex((item) =>
    item.end ? pathname === item.to : pathname.startsWith(item.to)
  )
  // En rutas como /local/:id no hay pestaña activa: dejamos el circulo escondido.
  const hayActivo = indiceActivo !== -1
  const indiceCirculo = hayActivo ? indiceActivo : 0

  function repetirAnimacion(index) {
    setAnimKeys((keys) => keys.map((key, i) => (i === index ? key + 1 : key)))
  }

  return (
    <nav className="navbar" aria-label="Navegación principal">
      <div
        className="navbar-logos-container"
        style={{
          '--nav-total': navItems.length,
          '--nav-activo': indiceCirculo,
          '--nav-color-activo': navItems[indiceCirculo].color,
        }}
      >
        <span
          className={`navbar-indicador${hayActivo ? '' : ' navbar-indicador--oculto'}`}
          aria-hidden="true"
        >
          <span className="navbar-indicador-circulo" />
        </span>

        {navItems.map((item, index) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={{ '--nav-color': item.color }}
            className={({ isActive }) =>
              `navbar-logos-container-logo${isActive ? ' active' : ''}`
            }
            onClick={() => repetirAnimacion(index)}
          >
            <span
              key={`${item.to}-${animKeys[index]}`}
              className={`navbar-icono navbar-icono--${item.anim}`}
            >
              {item.icon}
            </span>
            <p className="navbar-logos-container-logo-text">{item.label}</p>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default NavBar
