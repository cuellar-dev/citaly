import { useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Store } from 'lucide-react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import './navbar.css'

gsap.registerPlugin(useGSAP)

const navItems = [
  {
    to: '/',
    label: 'Descubre',
    end: true,
    anim: 'brujula',
    colorVar: '--nav-color-descubre',
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
    colorVar: '--nav-color-citas',
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
    colorVar: '--nav-color-negocio',
    icon: <Store className="logos-store" />,
  },
  {
    to: '/perfil',
    label: 'Mi Perfil',
    anim: 'perfil',
    colorVar: '--nav-color-perfil',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

// Gesto propio de cada icono al pulsarlo. Solo transforms: barato en moviles.
const gestosIcono = {
  brujula: (svg, d) =>
    gsap.fromTo(
      svg.querySelector('path'),
      { rotation: 0 },
      { rotation: 1080, duration: 1.6 * d, ease: 'power4.out', transformOrigin: '50% 50%' }
    ),
  citas: (svg, d) =>
    gsap
      .timeline()
      .to(svg, { y: -7, scaleY: 1.12, duration: 0.16 * d, ease: 'power2.out' })
      .to(svg, { y: 0, scaleY: 1, duration: 0.55 * d, ease: 'bounce.out' }),
  negocio: (svg, d) =>
    gsap.fromTo(
      svg,
      { rotation: -14 },
      { rotation: 0, duration: 0.9 * d, ease: 'elastic.out(1, 0.35)', transformOrigin: '50% 90%' }
    ),
  perfil: (svg, d) =>
    gsap.fromTo(svg, { scale: 1.32 }, { scale: 1, duration: 0.7 * d, ease: 'elastic.out(1, 0.4)' }),
}

function NavBar() {
  const { pathname } = useLocation()
  const raizRef = useRef(null)
  const indicadorRef = useRef(null)
  const pillRef = useRef(null)
  const iconosRef = useRef([])
  const etiquetasRef = useRef([])
  const primeraVezRef = useRef(true)
  const indicePrevioRef = useRef(0)

  const indiceActivo = navItems.findIndex((item) =>
    item.end ? pathname === item.to : pathname.startsWith(item.to)
  )
  // En rutas como /local/:id no hay pestaña activa: la pildora se esconde
  // y se queda donde estaba, lista para volver.
  const hayActivo = indiceActivo !== -1

  const { contextSafe } = useGSAP(
    () => {
      const raiz = raizRef.current
      const indicador = indicadorRef.current
      const pill = pillRef.current
      if (!raiz || !indicador || !pill) return

      const indice = hayActivo ? indiceActivo : indicePrevioRef.current
      const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const d = reducir ? 0 : 1

      // Resolvemos el color real (hex/rgb) para que GSAP pueda interpolarlo.
      const color = getComputedStyle(raiz).getPropertyValue(navItems[indice].colorVar).trim()
      const iconos = iconosRef.current
      const etiquetas = etiquetasRef.current

      if (primeraVezRef.current) {
        primeraVezRef.current = false
        gsap.set(raiz, { '--nav-color-activo': color })
        gsap.set(indicador, { xPercent: indice * 100, autoAlpha: hayActivo ? 1 : 0 })
        gsap.set(iconos, { y: (i) => (i === indice && hayActivo ? -2 : 0) })
        gsap.set(etiquetas, { opacity: (i) => (i === indice && hayActivo ? 1 : 0.62) })
        indicePrevioRef.current = indice
        return
      }

      const direccion = indice >= indicePrevioRef.current ? 1 : -1
      indicePrevioRef.current = indice

      const tl = gsap.timeline({ defaults: { overwrite: 'auto' } })

      // La pildora se desliza y se estira hacia donde viaja; luego rebota a su forma.
      tl.to(indicador, { xPercent: indice * 100, duration: 0.55 * d, ease: 'expo.out' }, 0)
        .to(indicador, { autoAlpha: hayActivo ? 1 : 0, duration: 0.25 * d, ease: 'power1.out' }, 0)
        .to(
          pill,
          {
            scaleX: 1.35,
            scaleY: 0.82,
            transformOrigin: direccion > 0 ? '0% 50%' : '100% 50%',
            duration: 0.18 * d,
            ease: 'power2.out',
          },
          0
        )
        .to(pill, { scaleX: 1, scaleY: 1, duration: 0.6 * d, ease: 'elastic.out(1, 0.55)' }, 0.18 * d)
        // Color: una sola variable CSS; la pildora y la luz la heredan.
        .to(raiz, { '--nav-color-activo': color, duration: 0.45 * d, ease: 'power2.inOut' }, 0)
        // Iconos: el activo se eleva un poco; el resto vuelve a su sitio.
        .to(
          iconos,
          { y: (i) => (i === indice && hayActivo ? -2 : 0), duration: 0.4 * d, ease: 'power3.out' },
          0
        )
        .to(
          etiquetas,
          { opacity: (i) => (i === indice && hayActivo ? 1 : 0.62), duration: 0.3 * d, ease: 'power1.out' },
          0
        )
    },
    { scope: raizRef, dependencies: [indiceActivo, hayActivo] }
  )

  const gestoAlPulsar = contextSafe((enlace, anim) => {
    const svg = enlace.querySelector('svg')
    if (!svg) return
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    gestosIcono[anim]?.(svg, reducir ? 0 : 1)
  })

  return (
    <nav className="navbar" aria-label="Navegación principal" ref={raizRef}>
      <div className="navbar-pista" style={{ '--nav-total': navItems.length }}>
        <span className="navbar-indicador" ref={indicadorRef} aria-hidden="true">
          <span className="navbar-indicador-luz" />
          <span className="navbar-indicador-pill" ref={pillRef} />
        </span>

        {navItems.map((item, index) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={{ '--nav-color': `var(${item.colorVar})` }}
            className={({ isActive }) => `navbar-enlace${isActive ? ' active' : ''}`}
            onClick={(e) => gestoAlPulsar(e.currentTarget, item.anim)}
          >
            <span
              className="navbar-icono"
              ref={(el) => {
                iconosRef.current[index] = el
              }}
            >
              <span className="navbar-icono-pulsa">{item.icon}</span>
            </span>
            <p
              className="navbar-etiqueta"
              ref={(el) => {
                etiquetasRef.current[index] = el
              }}
            >
              {item.label}
            </p>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default NavBar
