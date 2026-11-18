/* Errores al descargar un trozo de la app (una página que se carga al entrar).

   Pasa si se corta la conexión en ese momento o si hubo un deploy nuevo y
   el archivo viejo ya no existe. Recargar trae la versión nueva; se hace una
   sola vez por sesión para no entrar en bucle si el fallo sigue. */

const CLAVE_RECARGA = 'citaly_recarga_por_chunk'

export function esErrorDeDescarga(error) {
  const texto = String(error?.message || error || '')
  return /dynamically imported module|Importing a module script failed|error loading dynamically|Failed to fetch/i.test(texto)
}

/** Devuelve false si ya se recargó antes en esta sesión (y no recarga). */
export function recargarUnaVez() {
  try {
    if (sessionStorage.getItem(CLAVE_RECARGA)) return false
    sessionStorage.setItem(CLAVE_RECARGA, '1')
  } catch {
    return false
  }
  window.location.reload()
  return true
}
