import { PRIVACIDAD, TERMINOS } from './textoLegal.jsx'

/* Los dos documentos por su id (el mismo que su ruta: /terminos, /privacidad). */
export const DOCS = { terminos: TERMINOS, privacidad: PRIVACIDAD }

/** Lleva hasta una sección (#t-negocios…) con scroll suave si se puede. */
export function irASeccion(id) {
  const destino = document.getElementById(id)
  if (!destino) return false
  const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  destino.scrollIntoView({ behavior: reducir ? 'auto' : 'smooth', block: 'start' })
  destino.focus({ preventScroll: true })
  return true
}
