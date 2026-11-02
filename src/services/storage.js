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
