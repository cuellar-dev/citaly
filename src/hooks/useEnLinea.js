import { useSyncExternalStore } from 'react'

/* ¿Hay conexión? Según el navegador.

   OJO: navigator.onLine solo sabe si hay red, no si hay INTERNET (con wifi
   sin datos o un portal cautivo dice "conectado"). Mientras los datos sean
   locales basta. Con backend, combinarlo con un ping a /health: ver
   docs/pwa.md, "Fase 2". */

function suscribir(avisar) {
  window.addEventListener('online', avisar)
  window.addEventListener('offline', avisar)
  return () => {
    window.removeEventListener('online', avisar)
    window.removeEventListener('offline', avisar)
  }
}

const leer = () => navigator.onLine
const leerEnServidor = () => true

export function useEnLinea() {
  return useSyncExternalStore(suscribir, leer, leerEnServidor)
}
