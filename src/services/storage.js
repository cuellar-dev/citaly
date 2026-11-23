const STORAGE_KEY = 'citaly_citas'
const FICHAS_KEY = 'citaly_fichas'
const PERFILES_KEY = 'citaly_perfiles'
export const ESTADOS_V_KEY = 'citaly_estados_v'

export function getCitas() {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

export function saveCitas(citas) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(citas))
}

export function seedCitasIfEmpty(citasIniciales) {
  const actuales = getCitas()
  if (!localStorage.getItem(STORAGE_KEY) || actuales.length === 0) {
    saveCitas(citasIniciales)
    localStorage.setItem(ESTADOS_V_KEY, '2')
  }
}

/* Cambios que el dueño hizo a la ficha de su local, por id. Se mezclan sobre locales.json. */
export function getFichas() {
  try {
    return JSON.parse(localStorage.getItem(FICHAS_KEY)) ?? {}
  } catch {
    return {}
  }
}

/* Devuelve false si el navegador no tiene sitio para guardar. */
export function saveFicha(id, cambios) {
  const fichas = getFichas()
  fichas[id] = { ...fichas[id], ...cambios }
  try {
    localStorage.setItem(FICHAS_KEY, JSON.stringify(fichas))
    return true
  } catch {
    return false
  }
}

export function getPerfiles() {
  try {
    return JSON.parse(localStorage.getItem(PERFILES_KEY)) ?? {}
  } catch {
    return {}
  }
}

export function savePerfil(id, cambios) {
  const perfiles = getPerfiles()
  perfiles[id] = { ...perfiles[id], ...cambios }
  try {
    localStorage.setItem(PERFILES_KEY, JSON.stringify(perfiles))
    return true
  } catch {
    return false
  }
}

/* Solicitudes para unirse a un local de suscripción (gimnasio, curso…).
   No son citas: no tienen día ni hora, así que van aparte. */
const SUSCRIPCIONES_KEY = 'citaly_suscripciones'

export function getSuscripciones() {
  try {
    return JSON.parse(localStorage.getItem(SUSCRIPCIONES_KEY)) ?? []
  } catch {
    return []
  }
}

/* Devuelve false si el navegador no tiene sitio para guardar. */
export function saveSuscripcion(solicitud, usuarioId) {
  const lista = getSuscripciones().filter((s) => s.id !== solicitud.id)
  const conDueno = usuarioId ? { usuarioId, ...solicitud } : solicitud
  try {
    localStorage.setItem(SUSCRIPCIONES_KEY, JSON.stringify([conDueno, ...lista]))
    return true
  } catch {
    return false
  }
}

/* El dueño acepta o rechaza una solicitud: 1 = aceptada, 3 = rechazada. */
export function actualizarSuscripcion(id, cambios) {
  const lista = getSuscripciones()
  if (!lista.some((s) => s.id === id)) return false
  try {
    localStorage.setItem(SUSCRIPCIONES_KEY, JSON.stringify(lista.map((s) => (s.id === id ? { ...s, ...cambios } : s))))
    return true
  } catch {
    return false
  }
}

/* Datos de prueba que llegaron después de la primera siembra: se añaden una
   sola vez a quien ya tenía la app abierta, sin pisar lo suyo. */
const DEMO_V_KEY = 'citaly_demo_v'

export function sembrarDemoExtra(citas, suscripciones) {
  try {
    if (localStorage.getItem(DEMO_V_KEY) === '2') return
    const actuales = getCitas()
    const ids = new Set(actuales.map((c) => c.id))
    const nuevas = citas.filter((c) => !ids.has(c.id))
    if (nuevas.length) saveCitas([...actuales, ...nuevas])
    const subs = getSuscripciones()
    const idsSubs = new Set(subs.map((s) => s.id))
    const nuevasSubs = suscripciones.filter((s) => !idsSubs.has(s.id))
    if (nuevasSubs.length) localStorage.setItem(SUSCRIPCIONES_KEY, JSON.stringify([...subs, ...nuevasSubs]))
    localStorage.setItem(DEMO_V_KEY, '2')
  } catch {
    /* sin almacenamiento: la demo queda como estaba */
  }
}
