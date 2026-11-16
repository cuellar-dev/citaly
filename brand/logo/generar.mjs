// Genera la marca de Citaly: el logotipo a mano y el icono del sello grabado.
// Uso: node brand/logo/generar.mjs
// Escribe los SVG en brand/logo/final/ y una hoja de vista previa en brand/logo/index.html.
// Los PNG se sacan después con: node brand/logo/exportar.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const FINAL = join(DIR, 'final')

// Paleta fija de Taly (src/components/Taly/arte.js)
const TALY = { menta: '#4FD8C4', ala: '#2AA795', mostaza: '#FFD166', crema: '#F2EBDD' }
const SOMBRA_MOSTAZA = '#E9A93A' // cara de abajo del pico
const PICO_TOSTADO = '#C98A1E'   // contorno y cera del pico
const VERDE_HOJA = '#1F7A3A'     // fondo del grabado
const VERDE_HONDO = '#0B5446'    // círculo del perfil de redes

// ======================================================================
// LOGOTIPO: CITALY dibujado a mano, con Taly en la I, la A y la Y
// ======================================================================

// Trazos de pincel de cada letra (cap height 100)
const MANO = [
  'M72 24 C60 9 32 8 19 27 C6 46 9 74 25 87 C40 99 62 96 74 81',      // C
  'M101 15 C102 41 99 70 101 96',                                      // I
  'M124 19 C146 15 166 18 189 14', 'M157 18 C155 46 158 72 156 96',    // T
  'M202 97 C214 64 225 37 236 14 C248 41 258 69 271 96',               // A (piernas)
  'M214 67 C227 63 238 65.5 248 64',                                   // A (travesaño, acaba en el pico)
  'M293 14 C294 42 291 70 293 94 C309 92 325 96 341 92',               // L
  'M357 15 C366 34 377 48 389 56', 'M421 13 C407 39 395 52 389 58 C387 70 390 80 388 88', // Y
]
const MANO_LETRA = { C: [0], I: [1], T: [2, 3], A: [4, 5], L: [6], Y: [7, 8] }

// La L y la Y se corren a la derecha para dejar sitio al pico
const HUECO_PICO = 12

// A · el pico sale del travesaño y corta la pierna derecha (va encima de ella)
const PICO_A = 'M248 55.5 C262 55 276 58.5 288 64 C276 69 262 72 248 71.5 C251 66 251 60 248 55.5 Z'
const PICO_A_SOMBRA = 'M250 64 L286 64 C276 69 262 71.5 249 71 C251 69 251 66 250 64 Z'
// Volumen: luz en el filo de arriba, contorno tostado abajo
const PICO_A_LUZ = 'M253 56.3 C264 56 276 59.2 285 63.4'
const PICO_A_CONTORNO = 'M250 71 C262 71.4 275 68.8 287 64.2'
// Cera: media luna en la base del pico (la franja carnosa de los pájaros) que lo une al travesaño
const PICO_A_CERA = 'M248 55.5 C251 60 251 66 248 71.5 L251.6 71.3 C255.4 66.4 255.4 60.2 251.6 55.7 Z'

// Y · el palo se abre en dos dedos del mismo grosor, como las patas de Taly
const Y_DEDOS = ['M388 88 C384 94 378 97 369 98', 'M388 88 C392 94 398 97 407 97']

// I · el copete de Taly (el mismo dibujo de taly-a-mano.svg)
const COPETE = 'M168 92 C156 70 160 52 174 42 C178 58 188 62 192 76 C198 62 206 58 214 56 C214 72 204 84 196 92 Z'

function logotipo(color, colA, colY) {
  const dx = l => (l === 'L' || l === 'Y' ? HUECO_PICO : 0)
  const trazos = (letras, col, ancho) => letras.map(l => `<g transform="translate(${dx(l)} 0)">${MANO_LETRA[l].map(i => `<path stroke="${col}" stroke-width="${ancho}" d="${MANO[i]}"/>`).join('')}${l === 'Y' ? Y_DEDOS.map(d => `<path stroke="${col}" stroke-width="${ancho}" d="${d}"/>`).join('') : ''}</g>`).join('')
  const capa = ancho => trazos(['C', 'I', 'T', 'L'], color, ancho) + trazos(['A'], colA, ancho) + trazos(['Y'], colY, ancho)
  const cera = `cera-${colA.slice(1)}`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -42 ${452 + HUECO_PICO} 154" role="img" aria-label="Citaly">
  <defs><filter id="pulso" x="-10%" y="-20%" width="120%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="r"/>
    <feDisplacementMap in="SourceGraphic" in2="r" scale="3.5" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <!-- degradado de la cera: tostado firme junto al travesaño, transparente hacia el pico -->
  <linearGradient id="${cera}" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${PICO_TOSTADO}"/><stop offset="1" stop-color="${PICO_TOSTADO}" stop-opacity=".2"/>
  </linearGradient></defs>
  <g filter="url(#pulso)" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <g>${capa(15)}</g>
    <!-- segunda pasada fina, como repasado a mano -->
    <g opacity=".35" transform="translate(-2.5 -2)">${capa(3)}</g>
    <!-- pico de la A -->
    <g transform="translate(-3 0)">
      <path fill="${TALY.mostaza}" d="${PICO_A}"/>
      <path fill="${SOMBRA_MOSTAZA}" d="${PICO_A_SOMBRA}"/>
      <path fill="url(#${cera})" d="${PICO_A_CERA}"/>
      <path stroke="#FFF3CF" stroke-width="1.8" opacity=".75" d="${PICO_A_LUZ}"/>
      <path stroke="${PICO_TOSTADO}" stroke-width="2.2" d="${PICO_A_CONTORNO}"/>
    </g>
    <!-- copete de la I -->
    <path transform="translate(102 2) scale(.62) translate(-182 -92)" fill="${TALY.mostaza}" d="${COPETE}"/>
  </g>
</svg>`
}

// ======================================================================
// ICONO: Taly grabado a dos tintas en un sello de correos
// ======================================================================

// Contorno troquelado: medias lunas mordidas en los cuatro bordes
function marcoSello(id, n, r) {
  const paso = 512 / n
  let agujeros = ''
  for (let i = 0; i <= n; i++) {
    const p = i * paso
    agujeros += `<circle cx="${p}" cy="0" r="${r}"/><circle cx="${p}" cy="512" r="${r}"/><circle cx="0" cy="${p}" r="${r}"/><circle cx="512" cy="${p}" r="${r}"/>`
  }
  return `<mask id="${id}-m"><rect width="512" height="512" fill="#fff"/><g fill="#000">${agujeros}</g></mask>`
}

function sello(id, interior, { matasellos = true, dientes = 11, mordida = 15 } = {}) {
  const x = 46, lado = 512 - x * 2
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Citaly">
  <defs>${marcoSello(id, dientes, mordida)}<clipPath id="${id}-v"><rect x="${x}" y="${x}" width="${lado}" height="${lado}" rx="6"/></clipPath></defs>
  <g mask="url(#${id}-m)">
    <rect width="512" height="512" fill="${TALY.crema}"/>
    <g clip-path="url(#${id}-v)">
      <rect x="${x}" y="${x}" width="${lado}" height="${lado}" fill="${VERDE_HOJA}"/>
      ${interior}
    </g>${matasellos ? `
    <g fill="none" stroke="#0E2E2A" stroke-width="6" stroke-linecap="round" opacity=".5">
      <circle cx="404" cy="108" r="54"/>
      <path d="M262 92 q16 -11 32 0 t32 0 t32 0 t32 0 t32 0 t32 0 M262 120 q16 -11 32 0 t32 0 t32 0 t32 0 t32 0 t32 0"/>
    </g>` : ''}
  </g>
</svg>`
}

// Taly de perfil (silueta de taly-a-mano.svg) grabado: papel y mostaza sobre verde, a rayas.
// simple: versión favicon (rayas el doble de gruesas, ojo más grande, sin matasellos ni filete)
function selloGrabado(id, { simple = false } = {}) {
  const k = simple ? 2 : 1
  const cuerpo = 'M175 85 C215 68 246 94 249 134 C252 166 286 186 304 226 C324 278 286 328 200 330 C114 334 78 282 98 226 C116 180 150 162 152 126 C152 106 160 92 175 85 Z'
  const ala = 'M134 204 C166 182 218 198 236 240 C220 284 160 290 128 256 C118 238 120 218 134 204 Z'
  const barriga = 'M205 214 C256 210 304 236 296 286 C288 328 236 336 190 326 C232 306 244 256 205 214 Z'
  const papel = TALY.crema
  const interior = `
  <svg x="46" y="56" width="420" height="420" viewBox="0 0 400 400">
    <defs>
      <pattern id="${id}-h" width="${9 * k}" height="${9 * k}" patternUnits="userSpaceOnUse"><rect width="${9 * k}" height="${3.4 * k}" fill="${papel}"/></pattern>
      <pattern id="${id}-d" width="${7 * k}" height="${7 * k}" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect width="${7 * k}" height="${3.6 * k}" fill="${papel}"/></pattern>
      <pattern id="${id}-f" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="1.6" fill="${papel}" opacity=".55"/></pattern>
      <clipPath id="${id}-c"><path d="${cuerpo}"/></clipPath>
    </defs>
    ${simple ? '' : `<rect width="400" height="400" fill="url(#${id}-f)"/>`}
    <g stroke-linecap="round" stroke-linejoin="round">
      <path d="M150 372 H262" stroke="${papel}" stroke-width="5"/>
      <g stroke="${TALY.mostaza}" stroke-width="8" fill="none"><path d="M178 326 L176 360 M176 360 L160 368 M176 360 L190 368 M226 327 L228 360 M228 360 L212 368 M228 360 L242 368"/></g>
      <path fill="${TALY.mostaza}" d="${COPETE}"/>
      <path d="${cuerpo}" fill="${VERDE_HOJA}"/>
      <path d="${cuerpo}" fill="url(#${id}-h)"/>
      <g clip-path="url(#${id}-c)"><path d="${barriga}" fill="${papel}"/></g>
      <path d="${ala}" fill="${VERDE_HOJA}"/>
      <path d="${ala}" fill="url(#${id}-d)"/>
      <path d="${cuerpo}" fill="none" stroke="${papel}" stroke-width="${6 * k}"/>
      <path d="${ala}" fill="none" stroke="${papel}" stroke-width="5"/>
      <path fill="${TALY.mostaza}" d="M246 112 C268 112 290 122 300 134 C282 146 262 150 247 146 Z"/>
      <path d="M250 134 H296" stroke="${VERDE_HOJA}" stroke-width="3"/>
      <circle cx="223" cy="117" r="${simple ? 20 : 15}" fill="${papel}"/>
      <circle cx="226" cy="118" r="${simple ? 11 : 8}" fill="${VERDE_HOJA}"/>
    </g>
  </svg>
  ${simple ? '' : `<rect x="62" y="62" width="388" height="388" rx="4" fill="none" stroke="${papel}" stroke-width="3" opacity=".7"/>`}`
  return sello(id, interior, simple ? { matasellos: false, dientes: 7, mordida: 24 } : {})
}

const anidar = (svg, x, y, t) => svg.replace(/^<svg[^>]*viewBox="([^"]+)"[^>]*>/, `<svg x="${x}" y="${y}" width="${t}" height="${t}" viewBox="$1">`)

// ======================================================================
// Escribir
// ======================================================================
const finales = {
  'citaly-logotipo-blanco.svg': logotipo('#FFFFFF', TALY.menta, TALY.mostaza),
  'citaly-logotipo-negro.svg': logotipo('#121413', TALY.ala, '#D99A2B'),
  'citaly-icono.svg': selloGrabado('ci'),
  'citaly-icono-redes.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Citaly">
  <circle cx="256" cy="256" r="256" fill="${VERDE_HONDO}"/>
  ${anidar(selloGrabado('cr'), 100, 100, 312)}
</svg>`,
  'citaly-favicon.svg': selloGrabado('cf', { simple: true }),
}
mkdirSync(FINAL, { recursive: true })
for (const [n, c] of Object.entries(finales)) writeFileSync(join(FINAL, n), c + '\n')

// Hoja de vista previa
const sv = (n, pre) => finales[n].replace(/id="pulso"/g, `id="${pre}-pulso"`).replace(/url\(#pulso\)/g, `url(#${pre}-pulso)`)
const ico = (n, t) => finales[n].replace('<svg ', `<svg width="${t}" height="${t}" `)
writeFileSync(join(DIR, 'index.html'), `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Citaly · Marca</title>
<style>
:root{--fondo:#121413;--sup:#1E2221;--texto:#f0f0f0;--debil:#bdbaba;--papel:#f6f2ea}
*{box-sizing:border-box}body{margin:0;background:var(--fondo);color:var(--texto);font-family:system-ui,sans-serif;padding:24px 16px 64px}
main{max-width:980px;margin:0 auto}h1{font-size:1.6rem;margin:0 0 4px}h2{font-size:1.15rem;margin:40px 0 4px}
.nota{color:var(--debil);margin:0 0 14px;font-size:.92rem;line-height:1.45}
.par{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:640px){.par{grid-template-columns:1fr}}
.caja{border-radius:18px;padding:36px 28px;display:grid;place-items:center}.oscura{background:var(--sup)}.clara{background:var(--papel)}
.grande{width:100%;max-width:340px}.grande svg{width:100%;height:auto;display:block}
.header-mock{margin-top:12px;background:var(--fondo);border:1px solid #ffffff14;border-radius:14px;padding:14px 18px}
.firma svg{height:14px;width:auto;display:block}.titulo{font-weight:700;font-size:1.5rem;margin-top:6px}
.iconos{display:flex;flex-wrap:wrap;gap:20px;align-items:flex-end}.iconos figure{margin:0;text-align:center;color:var(--debil);font-size:.8rem}
.iconos svg{display:block;margin-bottom:6px}
</style></head><body><main>
<h1>Citaly · Marca</h1>
<p class="nota">Archivos en brand/logo/final (SVG) y brand/logo/final/png.</p>
<section><h2>Logotipo</h2><p class="nota">Dibujado a mano. Copete de Taly en la I, pico con cera en la A y la Y apoyada en dos dedos.</p>
  <div class="par">
    <div class="caja oscura"><div class="grande">${sv('citaly-logotipo-blanco.svg', 'b')}</div></div>
    <div class="caja clara"><div class="grande">${sv('citaly-logotipo-negro.svg', 'n')}</div></div>
  </div>
  <div class="header-mock"><div class="firma">${sv('citaly-logotipo-blanco.svg', 'h')}</div><div class="titulo">Descubre</div></div>
</section>
<h2>Icono · sello grabado a dos tintas</h2>
<p class="nota">Para 48 px o menos se usa el favicon: rayas el doble de gruesas, ojo más grande, sin matasellos ni filete y con menos dientes.</p>
<div class="iconos">
  <figure>${ico('citaly-icono.svg', 260)}Icono</figure>
  <figure>${ico('citaly-icono-redes.svg', 160)}Redes</figure>
  <figure>${ico('citaly-favicon.svg', 64)}Favicon 64</figure>
  <figure>${ico('citaly-favicon.svg', 48)}48 px</figure>
  <figure>${ico('citaly-favicon.svg', 32)}32 px</figure>
  <figure>${ico('citaly-favicon.svg', 16)}16 px</figure>
</div>
</main></body></html>`)
console.log('ok:', Object.keys(finales).length, 'svg')
