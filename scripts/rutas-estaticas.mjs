/* Rutas fijas para GitHub Pages. Se ejecuta en el workflow DESPUÉS de
   `npm run build` (necesita dist/ y dist/.vite/manifest.json).

   Problema: Pages no sabe de rutas de React. Para /citaly/citas sirve el
   404.html (la app, pero con estado 404: Lighthouse y Google lo ven como
   página que no existe). Y aunque cargue, la página de Mis citas es un
   trozo aparte (src/paginas.js): el navegador primero baja el JS principal,
   lo ejecuta, y SOLO ENTONCES descubre que necesita MisCitas-xxxx.js. Esa
   segunda descarga en serie se notaba mucho con mala conexión.

   Solución: por cada ruta fija se escribe dist/<ruta>.html (Pages lo sirve
   en /citaly/<ruta> con 200 y sin redirigir), que es el index.html con los
   archivos de ESA página ya anunciados en el <head> (modulepreload + su
   CSS). Así bajan a la vez que el JS principal.

   Si se añade una página fija nueva en src/App.jsx, añadirla en RUTAS. Las
   rutas con :id (local/:id…) siguen por el 404.html.
   Con un hosting que tenga "SPA fallback", esto cambia: ver
   docs/pendientes-backend.md, "Hosting". */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { metaDeRuta, RUTAS_SITEMAP } from '../src/utils/metaRutas.js'

/* Carpeta del build: 'dist' por defecto; se puede pasar otra para probar. */
const DIST = process.argv[2] || 'dist'
const BASE = process.env.BASE_PATH || '/'

/* ruta (sin barra) → archivo de la página en src (clave del manifest) */
const RUTAS = {
  buscar: 'src/pages/Busqueda.jsx',
  citas: 'src/pages/MisCitas.jsx',
  negocio: 'src/pages/MiNegocio.jsx',
  perfil: 'src/pages/Perfil.jsx',
  notificaciones: 'src/pages/Notificaciones.jsx',
  favoritos: 'src/pages/Favoritos.jsx',
  ayuda: 'src/pages/Ayuda.jsx',
  opinion: 'src/pages/Opinion.jsx',
  auth: 'src/pages/Auth.jsx',
  nosotros: 'src/pages/Nosotros.jsx',
  terminos: 'src/pages/Legal.jsx',
  privacidad: 'src/pages/Legal.jsx',
}

const manifest = JSON.parse(fs.readFileSync(path.join(DIST, '.vite', 'manifest.json'), 'utf8'))
const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')

/* Lo que ya carga index.html (la entrada y sus imports) no se repite. */
const entrada = Object.values(manifest).find((c) => c.isEntry)
const yaEnIndex = new Set()
;(function marcar(clave) {
  const c = manifest[clave]
  if (!c || yaEnIndex.has(c.file)) return
  yaEnIndex.add(c.file)
  ;(c.imports ?? []).forEach(marcar)
})(Object.keys(manifest).find((k) => manifest[k] === entrada))

/* JS (con sus imports estáticos) y CSS de una página. Los import()
   dinámicos de dentro (jsPDF, Leaflet, Three…) NO: esos se piden al usarse. */
function archivosDe(clave, js = new Set(), css = new Set()) {
  const c = manifest[clave]
  if (!c || js.has(c.file)) return { js, css }
  if (!yaEnIndex.has(c.file)) js.add(c.file)
  ;(c.css ?? []).forEach((f) => css.add(f))
  ;(c.imports ?? []).forEach((i) => archivosDe(i, js, css))
  return { js, css }
}

const yaHayCss = new Set(entrada?.css ?? [])

/* El index.html original con los archivos de una página añadidos al <head>. */
function conPrecarga(pagina, nombre) {
  if (!manifest[pagina]) {
    console.warn(`(aviso) ${pagina} no está en el manifest: ${nombre} sale sin precarga`)
  }
  const { js, css } = archivosDe(pagina)
  const etiquetas = [
    ...[...css].filter((f) => !yaHayCss.has(f)).map((f) => `<link rel="stylesheet" crossorigin href="${BASE}${f}">`),
    ...[...js].map((f) => `<link rel="modulepreload" crossorigin href="${BASE}${f}">`),
  ]
  console.log(`${nombre}: ${js.size} JS, ${css.size} CSS precargados`)
  return html.replace('</head>', `    ${etiquetas.join('\n    ')}\n  </head>`)
}

/* Título, descripción, canónica y robots de la ruta (src/utils/metaRutas.js)
   escritos en su HTML: WhatsApp, Facebook y Telegram no ejecutan JS, así que
   la vista previa de /citaly/ayuda sale con «Ayuda · Citaly» y no con la portada. */
const escapar = (t) => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const SITIO = (process.env.VITE_SITE_URL || 'https://cuellar-dev.github.io/citaly').replace(/\/+$/, '')

function conMeta(texto, ruta) {
  const m = metaDeRuta(ruta)
  const url = `${SITIO}${ruta}`
  const cambios = [
    [/<title>[^<]*<\/title>/, `<title>${escapar(m.titulo)}</title>`],
    [/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${escapar(m.descripcion)}$2`],
    [/(<meta name="robots" content=")[^"]*(")/, `$1${m.indexar ? 'index, follow, max-image-preview:large' : 'noindex, follow'}$2`],
    [/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`],
    [/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`],
    [/(<meta property="og:title" content=")[^"]*(")/, `$1${escapar(m.titulo)}$2`],
    [/(<meta\s+property="og:description"\s+content=")[^"]*(")/, `$1${escapar(m.descripcion)}$2`],
    [/(<meta name="twitter:title" content=")[^"]*(")/, `$1${escapar(m.titulo)}$2`],
    [/(<meta\s+name="twitter:description"\s+content=")[^"]*(")/, `$1${escapar(m.descripcion)}$2`],
  ]
  return cambios.reduce((t, [re, nuevo]) => {
    if (!re.test(t)) console.warn(`(aviso) ${ruta}: no encontré ${re}`)
    return t.replace(re, nuevo)
  }, texto)
}

for (const [ruta, pagina] of Object.entries(RUTAS)) {
  fs.writeFileSync(path.join(DIST, `${ruta}.html`), conMeta(conPrecarga(pagina, `${ruta}.html`), `/${ruta}`))
}

/* Sitemap y robots.txt con la dirección pública. Las fichas salen de los
   locales de demo; con backend, el sitemap lo debe generar el servidor con
   los locales reales (docs/pendientes-backend.md, SEO). */
const locales = JSON.parse(fs.readFileSync('src/data/locales.json', 'utf8'))
const urls = [...RUTAS_SITEMAP, ...locales.map((l) => `/local/${encodeURIComponent(l.id)}`)]
const hoy = new Date().toISOString().slice(0, 10)
fs.writeFileSync(
  path.join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
    .map((u) => `  <url><loc>${escapar(SITIO + u)}</loc><lastmod>${hoy}</lastmod></url>`)
    .join('\n')}
</urlset>
`,
)
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *
Allow: /

Sitemap: ${SITIO}/sitemap.xml
`)
console.log(`sitemap.xml: ${urls.length} direcciones`)

/* La portada (/) también es una página que baja aparte (src/paginas.js):
   index.html la anuncia para no esperar a que el JS común la descubra. Va
   al FINAL, cuando las demás rutas ya se escribieron desde el index.html
   limpio (así /perfil no se baja Descubre). El 404.html del workflow se
   copia antes de este script y tampoco la lleva: sirve a /local/:id. */
fs.writeFileSync(path.join(DIST, 'index.html'), conPrecarga('src/pages/Descubre.jsx', 'index.html'))

/* El manifest solo hacía falta para esto: no se publica. */
fs.rmSync(path.join(DIST, '.vite'), { recursive: true, force: true })
