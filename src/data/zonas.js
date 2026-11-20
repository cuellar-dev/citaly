/* Dónde está cada zona de la demo, con coordenadas reales de la provincia de
   Sancti Spíritus. La clave es la `direccion` tal cual la escriben los locales
   ("Centro, Sancti Spiritus"). Los centros de municipio son los mismos de
   data/cuba.js; las zonas dentro de una ciudad son puntos aproximados del
   barrio, no la puerta del local.

   Cada local cae en un punto distinto dentro de su zona (puntoEn), para que
   dos locales del mismo barrio no queden apilados en el mismo píxel del mapa
   ni a 0 m uno del otro. El desplazamiento sale del id, así que es siempre el
   mismo. */

export const ZONAS = {
  // Ciudad de Sancti Spíritus
  'Centro, Sancti Spiritus': { lat: 21.9293, lng: -79.4428, radio: 350 }, // Parque Serafín Sánchez
  'Colon, Sancti Spiritus': { lat: 21.9315, lng: -79.441, radio: 300 }, // calle Independencia / Colón
  'Kilo 12, Sancti Spiritus': { lat: 21.956, lng: -79.464, radio: 450 },
  'Olivos, Sancti Spiritus': { lat: 21.92, lng: -79.43, radio: 400 },
  // Cabaiguán
  'Parque central, Cabaiguan': { lat: 22.0803, lng: -79.5028, radio: 250 },
  'Centro, Cabaiguan': { lat: 22.079, lng: -79.4985, radio: 300 },
  // Trinidad
  'Plaza Mayor, Trinidad': { lat: 21.8031, lng: -79.9847, radio: 250 },
  'Centro, Trinidad': { lat: 21.8022, lng: -79.9835, radio: 350 },
  'Playa Ancon, Trinidad': { lat: 21.7381, lng: -79.9893, radio: 450 },
  // Resto de municipios
  'Centro, Jatibonico': { lat: 21.946, lng: -79.167, radio: 350 },
  'Centro, Fomento': { lat: 22.104, lng: -79.718, radio: 300 },
  'Centro, Yaguajay': { lat: 22.326, lng: -79.237, radio: 350 },
  'Centro, Taguasco': { lat: 22.006, lng: -79.263, radio: 300 },
  'Centro, La Sierpe': { lat: 21.762, lng: -79.24, radio: 300 },
}

/** Número entre 0 y 1 que siempre sale igual para el mismo texto. */
function azar(texto, sal) {
  let h = 2166136261
  for (const c of `${sal}:${texto}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return ((h >>> 0) % 100000) / 100000
}

const redondear = (n) => Math.round(n * 1e5) / 1e5

/**
 * Punto de un local dentro de su zona: { lat, lng } o null si la zona no se
 * conoce. Un ángulo y una distancia (hasta el radio de la zona) sacados del id.
 */
export function puntoEn(direccion, id) {
  const zona = ZONAS[direccion]
  if (!zona) return null
  const angulo = azar(id, 'a') * Math.PI * 2
  const metros = 60 + azar(id, 'd') * (zona.radio - 60)
  const dLat = (metros * Math.cos(angulo)) / 111320
  const dLng = (metros * Math.sin(angulo)) / (111320 * Math.cos((zona.lat * Math.PI) / 180))
  return { lat: redondear(zona.lat + dLat), lng: redondear(zona.lng + dLng) }
}
