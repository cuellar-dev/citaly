/* Cliente del backend de Citaly (backend-citaly-main).

   La dirección sale de VITE_API_URL (archivo .env, ver .env.example). Si no
   está puesta, `hayApi` es false y la app sigue funcionando con los datos de
   demo como siempre: nada de esto se ejecuta.

   El backend responde { data } si todo va bien y { error: { code, message } }
   si no. `pedir` devuelve directamente `data` o lanza un Error con
   `status` y `code`. Las cookies de sesión (Better Auth) viajan solas con
   credentials: 'include'. */

const BASE = String(import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

export const hayApi = BASE.length > 0

export const urlApi = (ruta) => `${BASE}${ruta}`

/* Cuánto espera el front antes de rendirse. 20 s: desde el 27-11-2026 el
   backend aguanta hasta 15 s a que Neon despierte o se reconecte y reintenta
   las lecturas cortadas (F-30); con 10 s el front cortaba antes que él. Si el
   backend se rinde, contesta 503 «Inténtalo de nuevo en unos segundos». */
const ESPERA_MS = 20000

export async function pedir(ruta, { metodo = 'GET', cuerpo, keepalive = false, espera = ESPERA_MS } = {}) {
  if (!hayApi) throw Object.assign(new Error('No hay backend configurado (VITE_API_URL).'), { code: 'SIN_API' })

  const control = new AbortController()
  const reloj = window.setTimeout(() => control.abort(), espera)
  try {
    const respuesta = await fetch(urlApi(ruta), {
      method: metodo,
      credentials: 'include',
      keepalive,
      signal: control.signal,
      headers: cuerpo === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    })
    const json = await respuesta.json().catch(() => null)
    if (!respuesta.ok) {
      const error = new Error(json?.error?.message ?? `Error ${respuesta.status}`)
      error.status = respuesta.status
      error.code = json?.error?.code ?? 'HTTP_ERROR'
      throw error
    }
    return json?.data
  } catch (error) {
    if (error.name === 'AbortError') throw Object.assign(new Error('El servidor tardó demasiado.'), { code: 'TIMEOUT' })
    throw error
  } finally {
    window.clearTimeout(reloj)
  }
}
