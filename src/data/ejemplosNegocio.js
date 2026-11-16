import { Scissors, Ticket, UtensilsCrossed } from 'lucide-react'

/* Los locales de ejemplo de Mi Negocio, uno por tipo (ver SwitchEjemplo). */

export const EJEMPLOS = [
  { id: 'servicio', tipo: 'servicio', idLocal: 'sara', label: 'Citas', local: 'Sara', Icono: Scissors },
  { id: 'mesa', tipo: 'mesa', idLocal: 'al-medio-1', label: 'Mesas', local: 'Al Medio', Icono: UtensilsCrossed },
  { id: 'suscripcion', tipo: 'suscripcion', idLocal: 'energym', label: 'Mensual', local: 'Energym', Icono: Ticket },
]

const CLAVE = 'citaly_negocio_ejemplo'

export function leerEjemplo() {
  try {
    const guardado = localStorage.getItem(CLAVE)
    return EJEMPLOS.some((e) => e.id === guardado) ? guardado : EJEMPLOS[0].id
  } catch {
    return EJEMPLOS[0].id
  }
}

export function guardarEjemplo(id) {
  try {
    localStorage.setItem(CLAVE, id)
  } catch {
    /* Sin almacenamiento: vale para esta visita. */
  }
}
