import { useSyncExternalStore } from 'react'
import { TEMA_EVENTO, leerTema } from '../services/tema.js'

function suscribir(avisar) {
  window.addEventListener(TEMA_EVENTO, avisar)
  window.addEventListener('storage', avisar)
  return () => {
    window.removeEventListener(TEMA_EVENTO, avisar)
    window.removeEventListener('storage', avisar)
  }
}

/** 'oscuro' | 'claro'. Se actualiza solo si cambia desde cualquier sitio. */
export function useTema() {
  return useSyncExternalStore(suscribir, leerTema, () => 'oscuro')
}
