import { useLocation, matchPath } from 'react-router-dom'
import { getLocalById } from '../services/locales.js'

/** Rutas donde se muestra el header superior (pestañas principales). */
const MAIN_TAB_ROUTES = [
  { path: '/', title: 'Descubre' },
  { path: '/citas', title: 'Mis Citas' },
  { path: '/negocio', title: 'Mi Negocio' },
  { path: '/perfil', title: 'Mi Perfil' },
]

/**
 * Rutas secundarias (detalle, reserva). Títulos listos por si activas el header ahí.
 * visible: false → Layout no muestra AppHeader en esas URLs.
 */
const SECONDARY_ROUTES = [
  {
    path: '/local/:id',
    title: (params) => getLocalById(params.id)?.localName ?? 'Local',
  },
  { path: '/local/:id/reservar', title: 'Reservar mesa' },
  { path: '/local/:id/reservar-cita', title: 'Reservar cita' },
]

function matchRoute(routes, pathname) {
  for (const route of routes) {
    const match = matchPath({ path: route.path, end: true }, pathname)
    if (match) {
      const title =
        typeof route.title === 'function' ? route.title(match.params) : route.title
      return { match, title }
    }
  }
  return null
}

export function useAppHeader() {
  const { pathname } = useLocation()

  const main = matchRoute(MAIN_TAB_ROUTES, pathname)
  if (main) {
    return { visible: true, title: main.title }
  }

  const secondary = matchRoute(SECONDARY_ROUTES, pathname)
  if (secondary) {
    return { visible: false, title: secondary.title }
  }

  return { visible: false, title: 'Citaly' }
}
