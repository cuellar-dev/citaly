import { createContext, useContext } from 'react'

/* Orden en que Descubre pide las fotos al abrir.

   Sin esto lo decide el navegador, y cada uno a su manera: Chrome adelanta
   las fotos "lazy" que están a menos de ~1.250–2.500 px, Firefox usa otra
   distancia. El resultado era que las tarjetas competían con el héroe y la
   segunda foto del carrusel llegaba tarde (se veía el esqueleto al saltar).

   El orden, igual en todos los navegadores:
     fase 0 → solo la primera foto del héroe (la más grande, la que mide el LCP)
     fase 1 → las primeras tarjetas que se ven debajo (PRIMERAS)
     fase 2 → la segunda foto del héroe y el resto de tarjetas (lazy)
   Cada fase tiene un tope de tiempo: si una foto tarda o falla, no bloquea
   a las siguientes.

   Fuera de Descubre (Búsqueda, Favoritos, Mis citas…) no hay proveedor y las
   tarjetas cargan como siempre. */

export const PRIMERAS = 4
export const ESPERA_HEROE_MS = 3000
export const ESPERA_PRIMERAS_MS = 2500

export const ColaFotosContext = createContext(null)

/**
 * Turno de la foto de una tarjeta.
 * @returns {{ puede: boolean, carga: 'eager' | 'lazy', alListo?: () => void }}
 */
export function useTurnoFoto(id) {
  const cola = useContext(ColaFotosContext)
  if (!cola) return { puede: true, carga: 'lazy' }
  if (cola.primeras.has(id)) {
    return { puede: cola.fase >= 1, carga: 'eager', alListo: () => cola.avisar(id) }
  }
  return { puede: cola.fase >= 2, carga: 'lazy' }
}
