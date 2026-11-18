import { lazy } from 'react'

/* Páginas que se descargan al entrar, no al abrir la web.

   Antes todo iba en un solo JS de ~1.1 MB (316 KB comprimido): quien abría
   Descubre se bajaba también Mi Negocio, el asistente de alta, el QR… Con
   conexión lenta eso eran varios segundos en blanco. Ahora la primera carga
   lleva el esqueleto de la app + Descubre, y cada página baja su trozo al
   entrar (o antes, con precargar()).

   Cada import() vive aquí una sola vez: React.lazy y precargar() usan la
   misma función, así el navegador no pide dos veces el mismo archivo. */

const cargadores = {
  buscar: () => import('./pages/Busqueda.jsx'),
  detalle: () => import('./pages/DetalleLocal.jsx'),
  reservarConLugar: () => import('./pages/ReservarConLugar.jsx'),
  reservarSinLugar: () => import('./pages/ReservarSinLugar.jsx'),
  reservarSuscripcion: () => import('./pages/ReservarSuscripcion.jsx'),
  citas: () => import('./pages/MisCitas.jsx'),
  negocio: () => import('./pages/MiNegocio.jsx'),
  compartirNegocio: () => import('./pages/CompartirNegocio.jsx'),
  perfil: () => import('./pages/Perfil.jsx'),
  notificaciones: () => import('./pages/Notificaciones.jsx'),
  favoritos: () => import('./pages/Favoritos.jsx'),
  ayuda: () => import('./pages/Ayuda.jsx'),
  opinion: () => import('./pages/Opinion.jsx'),
  auth: () => import('./pages/Auth.jsx'),
  nuevoLocal: () => import('./pages/NuevoLocal.jsx'),
  completarLocal: () => import('./pages/CompletarLocal.jsx'),
  nosotros: () => import('./pages/Nosotros.jsx'),
}

export const Busqueda = lazy(cargadores.buscar)
export const DetalleLocal = lazy(cargadores.detalle)
export const ReservarConLugar = lazy(cargadores.reservarConLugar)
export const ReservarSinLugar = lazy(cargadores.reservarSinLugar)
export const ReservarSuscripcion = lazy(cargadores.reservarSuscripcion)
export const MisCitas = lazy(cargadores.citas)
export const MiNegocio = lazy(cargadores.negocio)
export const CompartirNegocio = lazy(cargadores.compartirNegocio)
export const Perfil = lazy(cargadores.perfil)
export const Notificaciones = lazy(cargadores.notificaciones)
export const Favoritos = lazy(cargadores.favoritos)
export const Ayuda = lazy(cargadores.ayuda)
export const Opinion = lazy(cargadores.opinion)
export const Auth = lazy(cargadores.auth)
export const NuevoLocal = lazy(cargadores.nuevoLocal)
export const CompletarLocal = lazy(cargadores.completarLocal)
export const Nosotros = lazy(cargadores.nosotros)

/* Ruta de la app → página. Solo las que tiene sentido adelantar. */
const PORRUTA = {
  '/citas': 'citas',
  '/negocio': 'negocio',
  '/perfil': 'perfil',
  '/buscar': 'buscar',
  '/favoritos': 'favoritos',
  '/notificaciones': 'notificaciones',
}

const pedidas = new Set()

/** Descarga ya el trozo de una página (sin pintarla). Falla en silencio: al entrar se reintenta. */
export function precargar(nombre) {
  const cargar = cargadores[nombre]
  if (!cargar || pedidas.has(nombre)) return
  pedidas.add(nombre)
  cargar().catch(() => pedidas.delete(nombre))
}

/** Lo mismo, a partir de la ruta a la que se va ('/citas', '/local/x'…). */
export function precargarRuta(ruta) {
  if (!ruta) return
  if (ruta.startsWith('/local/')) return precargar('detalle')
  const nombre = PORRUTA[ruta]
  if (nombre) precargar(nombre)
}

/* ¿Merece la pena gastar datos adelantando páginas? En Cuba los datos móviles
   se pagan: con "ahorro de datos" o conexión lenta, solo se descarga lo que
   la persona pide (al tocar). */
function conexionHolgada() {
  const c = navigator.connection
  if (!c) return true
  if (c.saveData) return false
  return !/(^|-)2g$|^3g$/.test(c.effectiveType || '')
}

/**
 * Cuando la página ya cargó y el navegador está libre, adelanta las
 * pestañas de la barra y la ficha de un local (lo siguiente más probable),
 * para que cambiar de pestaña o deslizar no enseñe el esqueleto.
 */
export function precargarEnReposo() {
  if (!conexionHolgada()) return
  const lanzar = () => {
    const ocioso = window.requestIdleCallback ?? ((fn) => window.setTimeout(fn, 1200))
    ocioso(() => ['detalle', 'citas', 'negocio', 'perfil'].forEach(precargar), { timeout: 4000 })
  }
  if (document.readyState === 'complete') lanzar()
  else window.addEventListener('load', lanzar, { once: true })
}
