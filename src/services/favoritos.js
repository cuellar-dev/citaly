import { hayApi, pedir } from './api.js'
import { idUsuarioActual } from './sesion.js'

const FAVORITOS_KEY = 'citaly_favoritos'
export const FAVORITOS_EVENTO = 'citaly:favoritos'

/* Sin backend: una lista en este navegador.
   Con backend (GET/POST/DELETE /api/favoritos/me…): la lista es de la
   cuenta. Aquí queda una copia por cuenta para pintar al momento; se pide
   al servidor la primera vez que se lee en la visita, y cada cambio se manda
   por detrás (si falla, se deshace). Sin sesión, ninguno. */

const clave = () => (hayApi ? `${FAVORITOS_KEY}:${idUsuarioActual() ?? 'nadie'}` : FAVORITOS_KEY)

function leer() {
  try {
    const lista = JSON.parse(localStorage.getItem(clave()))
    return Array.isArray(lista) ? lista.filter(Boolean) : []
  } catch {
    return []
  }
}

function escribir(lista) {
  try {
    localStorage.setItem(clave(), JSON.stringify(lista))
  } catch {
    /* Sin sitio: vale para esta visita. */
  }
  window.dispatchEvent(new Event(FAVORITOS_EVENTO))
}

const sincronizadas = new Set()

function sincronizar() {
  const yo = idUsuarioActual()
  if (!hayApi || !yo || sincronizadas.has(yo)) return
  sincronizadas.add(yo)
  pedir('/api/favoritos/me')
    .then((filas) => {
      if (idUsuarioActual() !== yo) return
      escribir((Array.isArray(filas) ? filas : []).map((f) => f.local_id))
    })
    .catch(() => sincronizadas.delete(yo))
}

export function getFavoritos() {
  if (hayApi && !idUsuarioActual()) return []
  sincronizar()
  return leer()
}

export function esFavorito(id) {
  return getFavoritos().includes(id)
}

export function toggleFavorito(id) {
  if (!id) return getFavoritos()
  if (hayApi && !idUsuarioActual()) return []
  const actual = leer()
  const quitar = actual.includes(id)
  const siguiente = quitar ? actual.filter((x) => x !== id) : [id, ...actual]
  escribir(siguiente)
  if (hayApi) {
    pedir(`/api/favoritos/me/locales/${encodeURIComponent(id)}`, { metodo: quitar ? 'DELETE' : 'POST' }).catch(
      (error) => {
        /* Ya estaba (o ya no estaba) en el servidor: la copia ya dice lo mismo. */
        if (error?.status === 409 || error?.status === 404) return
        escribir(quitar ? [id, ...leer().filter((x) => x !== id)] : leer().filter((x) => x !== id))
      },
    )
  }
  return siguiente
}
