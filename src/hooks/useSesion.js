import { useSyncExternalStore } from 'react'
import { leerSesion, suscribirSesion } from '../services/sesion.js'

/** { estado: 'cargando' | 'listo', usuario: null | {...} } */
export function useSesion() {
  return useSyncExternalStore(suscribirSesion, leerSesion, leerSesion)
}
