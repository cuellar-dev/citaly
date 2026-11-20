/* Identificador anónimo del navegador. Lo usa Descubre para la semilla del
   orden y el backend para guardar las impresiones de quien no ha iniciado
   sesión. Se crea la primera vez y se queda en localStorage. No dice nada de
   la persona: es un número al azar. */

const CLAVE = 'citaly_anonimo_id'

function nuevoId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

let enMemoria = null

export function getAnonimoId() {
  if (enMemoria) return enMemoria
  try {
    let id = localStorage.getItem(CLAVE)
    if (!id) {
      id = nuevoId()
      localStorage.setItem(CLAVE, id)
    }
    enMemoria = id
  } catch {
    /* Sin localStorage (modo privado estricto): uno por visita. */
    enMemoria = nuevoId()
  }
  return enMemoria
}
