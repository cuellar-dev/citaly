import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Store } from 'lucide-react'
import './navbar.css'

const navItems = [
  {
    to: '/',
    label: 'Descubre',
    end: true,
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
    icon: (
      <Store className="logos-store" />
    ),
  },
  {
    to: '/perfil',
    label: 'Mi Perfil',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

function NavBar() {
  const [brujulaAnimKey, setBrujulaAnimKey] = useState(0)

  return (
    <nav className="navbar">
      <div className="navbar-logos-container">
        {navItems.map((item, index) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `navbar-logos-container-logo${isActive ? ' active' : ''}`
            }
            onClick={() => {
              if (index === 0) setBrujulaAnimKey((key) => key + 1)
            }}
          >
            {index === 0 ? (
              <span key={brujulaAnimKey} className="navbar-icon-wrap">
                {item.icon}
              </span>
            ) : (
              item.icon
            )}
            <p className="navbar-logos-container-logo-text">{item.label}</p>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default NavBar
