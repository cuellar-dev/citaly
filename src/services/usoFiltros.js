import { hayApi } from './api.js'
import { enviarUsoFiltro } from './descubreApi.js'

/* Cuántas veces ha filtrado o buscado el usuario por cada categoría. Es una de
   las tres señales de afinidad del perfil de Descubre (las otras: citas y
   favoritos). Se cuenta aquí y, si hay backend, también en la tabla
   `uso_filtros` (POST /api/descubre/uso-filtros, solo con sesión). */

const CLAVE = 'citaly_uso_filtros'

export function getUsoFiltros() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE))
    return datos && typeof datos === 'object' ? datos : {}
  } catch {
    return {}
  }
}

export function contarFiltro(categoria) {
  if (!categoria) return
  const datos = getUsoFiltros()
  const actual = datos[categoria] ?? { veces: 0 }
  datos[categoria] = { veces: actual.veces + 1, ultimaVez: new Date().toISOString() }
  try {
    localStorage.setItem(CLAVE, JSON.stringify(datos))
  } catch {
    /* Sin localStorage: la afinidad sale solo de citas y favoritos. */
  }
  if (hayApi) enviarUsoFiltro(categoria)
}
