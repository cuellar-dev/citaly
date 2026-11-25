import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { META_INICIAL, SITIO } from '../utils/metaRutas.js'

/* Metadatos de la página en el <head>: título, descripción, canónica, robots,
   Open Graph (WhatsApp, Facebook, Telegram) y Twitter/X.

   Las etiquetas ya existen en index.html (así las ven los que no ejecutan JS);
   aquí solo se cambia su contenido. No se usan las <title>/<meta> de React 19
   porque no quitan duplicados: convivirían con las del index.html.

   Google sí ejecuta el JS: ve lo que se pone aquí, incluidos los datos
   estructurados de las fichas. WhatsApp no: para él vale lo que escribe el
   deploy (scripts/rutas-estaticas.mjs) o, con backend, el servidor. */

const URL_SITIO = String(import.meta.env.VITE_SITE_URL ?? '').replace(/\/+$/, '')
export const IMAGEN_COMPARTIR = `${URL_SITIO}/og-citaly.png`

function poner(selector, atributo, valor) {
  const el = document.head.querySelector(selector)
  if (el && valor != null) el.setAttribute(atributo, valor)
}

/** URL absoluta y pública de una ruta de la app ('/local/x' → https://…/citaly/local/x). */
export function urlPublica(ruta) {
  return `${URL_SITIO}${ruta === '/' ? '/' : ruta}`
}

export function aplicarMeta({ titulo, descripcion, imagen, imagenAlt, imagenAncho, imagenAlto, indexar = true, ruta = '/' }) {
  const t = titulo ?? META_INICIAL.titulo
  const d = descripcion ?? META_INICIAL.descripcion
  const img = imagen ?? IMAGEN_COMPARTIR
  const url = urlPublica(ruta)
  const alt = imagenAlt ?? (imagen ? t : `${SITIO}: reserva en los lugares de tu barrio`)

  document.title = t
  poner('meta[name="description"]', 'content', d)
  poner('meta[name="robots"]', 'content', indexar ? 'index, follow, max-image-preview:large' : 'noindex, follow')
  poner('link[rel="canonical"]', 'href', url)
  poner('meta[property="og:title"]', 'content', t)
  poner('meta[property="og:description"]', 'content', d)
  poner('meta[property="og:url"]', 'content', url)
  poner('meta[property="og:image"]', 'content', img)
  poner('meta[property="og:image:alt"]', 'content', alt)
  poner('meta[name="twitter:title"]', 'content', t)
  poner('meta[name="twitter:description"]', 'content', d)
  poner('meta[name="twitter:image"]', 'content', img)
  poner('meta[name="twitter:image:alt"]', 'content', alt)
  /* La imagen de marca mide 1200×630; una foto de local se pide a ese tamaño (ver DetalleLocal). */
  const propia = img === IMAGEN_COMPARTIR
  const ancho = propia ? 1200 : imagenAncho
  const alto = propia ? 630 : imagenAlto
  for (const [lado, valor] of [['width', ancho], ['height', alto]]) {
    const el = document.head.querySelector(`meta[property="og:image:${lado}"]`)
    if (valor) el?.setAttribute('content', String(valor))
  }
}

/** Datos estructurados (JSON-LD) de la página. null los quita. */
export function aplicarDatosEstructurados(id, datos) {
  const previo = document.getElementById(id)
  if (!datos) {
    previo?.remove()
    return
  }
  const script = previo ?? Object.assign(document.createElement('script'), { id, type: 'application/ld+json' })
  /* JSON.stringify no escapa '<': un nombre con «</script>» cerraría la etiqueta. */
  script.textContent = JSON.stringify(datos).replace(/</g, '\\u003c')
  if (!previo) document.head.appendChild(script)
}

/**
 * Pone los metadatos de la página actual. Pásale solo lo que conoce la
 * página (p. ej. el nombre del local); lo demás sale de utils/metaRutas.js.
 * Con `meta` null no hace nada (útil mientras los datos cargan).
 */
export function useMetaPagina(meta) {
  const { pathname } = useLocation()
  const clave = meta ? JSON.stringify(meta) : null
  useEffect(() => {
    if (!clave) return
    aplicarMeta({ ...JSON.parse(clave), ruta: pathname })
  }, [clave, pathname])
}

