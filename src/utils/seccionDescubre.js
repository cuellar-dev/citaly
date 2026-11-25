/* Puente entre una fila de Descubre y Búsqueda: al tocar el «+» se guarda
   qué fila era y la lista completa de locales que cumplen su condición, y
   Búsqueda la enseña entera. Va en sessionStorage además del state de la
   ruta para que recargar la página no la pierda. */

/** Cuántos locales enseña una fila antes del «+». */
export const TOPE_FILA = 8

const CLAVE = 'citaly_seccion_descubre'

export function guardarSeccion(seccion) {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(seccion))
  } catch {
    /* Sin storage: vale con el state de la ruta. */
  }
}

/** La sección pedida, si coincide con la clave de la URL. */
export function leerSeccion(clave, desdeRuta) {
  if (desdeRuta?.clave === clave) return desdeRuta
  try {
    const guardada = JSON.parse(sessionStorage.getItem(CLAVE))
    return guardada?.clave === clave ? guardada : null
  } catch {
    return null
  }
}
