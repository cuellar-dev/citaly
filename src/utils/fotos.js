/* Fotos remotas: el ÚNICO sitio que sabe pedirle a un proveedor la foto al
   tamaño justo. Los componentes no construyen URLs de imagen a mano: llaman
   a fotoUrl / fotoSrcSet (o usan <Foto>).

   Hoy las fotos de los locales son de demo y vienen de Unsplash, que acepta
   ?w=&h=&q= en la URL. Cuando las fotos sean nuestras (Cloudinary u otro
   CDN), se añade aquí su forma de pedir tamaños y el resto de la app no se
   entera. Ver docs/pendientes-backend.md, "Fotos". */

const UNSPLASH = /(^|\.)unsplash\.com$/
const CLOUDINARY = /(^|\.)res\.cloudinary\.com$/

/* Hosts que devuelven Access-Control-Allow-Origin. Solo a esos se les piden
   las fotos con crossorigin="anonymous": así el navegador no manda ni guarda
   cookies de terceros (Lighthouse lo penaliza) y, más adelante, el service
   worker podrá guardarlas para verlas sin conexión. A un host SIN CORS no se
   le puede poner crossorigin: la foto no cargaría. */
const HOSTS_CON_CORS = [UNSPLASH, CLOUDINARY]

function hostDe(url) {
  if (!url || typeof url !== 'string' || !/^https?:\/\//.test(url)) return null
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

export function admiteCors(url) {
  const host = hostDe(url)
  return Boolean(host && HOSTS_CON_CORS.some((re) => re.test(host)))
}

/** ¿Sabemos pedirle a este proveedor otro tamaño? (data:/blob: y hosts desconocidos, no). */
export function admiteTamanos(url) {
  const host = hostDe(url)
  return Boolean(host && UNSPLASH.test(host))
}

/**
 * La misma foto a otro tamaño. Sin proveedor conocido, devuelve la URL tal cual.
 * @param {string} url
 * @param {{ ancho?: number, alto?: number, calidad?: number, caras?: boolean }} [opciones]
 */
export function fotoUrl(url, { ancho, alto, calidad, caras = false } = {}) {
  if (!admiteTamanos(url)) return url
  try {
    const u = new URL(url)
    if (ancho) u.searchParams.set('w', String(Math.round(ancho)))
    if (alto) u.searchParams.set('h', String(Math.round(alto)))
    if (calidad) u.searchParams.set('q', String(calidad))
    if (ancho && alto) u.searchParams.set('fit', 'crop')
    if (caras) u.searchParams.set('crop', 'faces')
    /* auto=format: Unsplash elige AVIF/WebP según el navegador. */
    u.searchParams.set('auto', 'format')
    return u.toString()
  } catch {
    return url
  }
}

/**
 * srcset para que el navegador elija según el ancho en pantalla y la
 * densidad del móvil. Undefined si el proveedor no sabe de tamaños.
 * @param {string} url
 * @param {number[]} anchos
 * @param {{ calidad?: number, proporcion?: number, caras?: boolean }} [opciones]
 *   proporcion = alto / ancho. Conviene darla cuando la caja no tiene la forma
 *   de la foto (p. ej. un héroe vertical con fotos apaisadas): así llega ya
 *   recortada, pesa menos y no se ve borrosa al estirarse para cubrir la caja.
 */
export function fotoSrcSet(url, anchos, { calidad, proporcion, caras } = {}) {
  if (!admiteTamanos(url) || !anchos?.length) return undefined
  return anchos
    .map((ancho) => `${fotoUrl(url, { ancho, alto: proporcion ? ancho * proporcion : undefined, calidad, caras })} ${ancho}w`)
    .join(', ')
}
