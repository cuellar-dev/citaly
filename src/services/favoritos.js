const FAVORITOS_KEY = 'citaly_favoritos'
export const FAVORITOS_EVENTO = 'citaly:favoritos'

export function getFavoritos() {
  try {
    const lista = JSON.parse(localStorage.getItem(FAVORITOS_KEY))
    return Array.isArray(lista) ? lista.filter(Boolean) : []
  } catch {
    return []
  }
}

export function esFavorito(id) {
  return getFavoritos().includes(id)
}

export function toggleFavorito(id) {
  if (!id) return getFavoritos()
  const actual = getFavoritos()
  const siguiente = actual.includes(id) ? actual.filter((x) => x !== id) : [id, ...actual]
  localStorage.setItem(FAVORITOS_KEY, JSON.stringify(siguiente))
  window.dispatchEvent(new Event(FAVORITOS_EVENTO))
  return siguiente
}
