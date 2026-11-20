/* Distancias entre locales a partir de su latitud y longitud. */

const RADIO_TIERRA_M = 6371000
const aRadianes = (grados) => (grados * Math.PI) / 180

const tienePunto = (l) =>
  l && l.lat != null && l.lng != null && Number.isFinite(Number(l.lat)) && Number.isFinite(Number(l.lng))

/**
 * Fórmula de haversine: metros en línea recta entre dos puntos de la Tierra,
 * teniendo en cuenta que es redonda. Cada punto es { lat, lng }.
 */
export function distanciaMetros(a, b) {
  const dLat = aRadianes(b.lat - a.lat)
  const dLng = aRadianes(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(a.lat)) * Math.cos(aRadianes(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * RADIO_TIERRA_M * Math.asin(Math.sqrt(h))
}

/** "350 m" por debajo del kilómetro (de 10 en 10), "1,2 km" por encima. */
export function textoDistancia(metros) {
  if (metros < 1000) return `${Math.max(10, Math.round(metros / 10) * 10)} m`
  const km = metros / 1000
  return `${(km < 10 ? km.toFixed(1) : Math.round(km)).toString().replace('.', ',')} km`
}

/**
 * Los locales más cercanos a `local`, del más cerca al más lejos, cada uno con
 * su distancia en metros: [{ local, metros }]. Deja fuera al propio local, a
 * los que no tienen coordenadas y a los que quedan más allá de `maxKm`
 * (otro municipio a 70 km no es "cerca").
 */
export function cercanosA(local, todos, { max = 8, maxKm = 30 } = {}) {
  if (!tienePunto(local)) return []
  const origen = { lat: Number(local.lat), lng: Number(local.lng) }
  return todos
    .filter((l) => l.id !== local.id && tienePunto(l))
    .map((l) => ({ local: l, metros: distanciaMetros(origen, { lat: Number(l.lat), lng: Number(l.lng) }) }))
    .filter((c) => c.metros <= maxKm * 1000)
    .sort((a, b) => a.metros - b.metros)
    .slice(0, max)
}
