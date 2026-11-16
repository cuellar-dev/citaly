// Exporta a PNG el icono final (brand/logo/final/*.svg) a varios tamaños, con fondo transparente.
// Usa el script de render de la mascota (Playwright + Chrome del sistema).
// Uso: node brand/logo/exportar.mjs
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const FINAL = join(DIR, 'final')
const RENDER = join(DIR, '../mascota/render-png.mjs')

const TRABAJOS = [
  ['citaly-icono.svg', [512, 1024, 2048, 4096]],
  ['citaly-icono-redes.svg', [400, 1024, 2048]],
  ['citaly-favicon.svg', [16, 32, 48, 64, 180, 192, 512]],
]

for (const [svg, tamanos] of TRABAJOS) {
  for (const t of tamanos) {
    // viewport pequeño y escala alta: el SVG se rasteriza a la resolución final, no se amplía un PNG
    const base = Math.min(t, 512)
    const out = join(FINAL, 'png', `${svg.replace('.svg', '')}-${t}.png`)
    execFileSync('node', [RENDER, '--input', join(FINAL, svg), '--out', out,
      '--width', String(base), '--height', String(base), '--scale', String(t / base), '--transparent', '--wait', '150'], { stdio: 'inherit' })
  }
}

// Logotipo (no es cuadrado: viewBox 464 × 154). Se exporta a 1x, 2x y 4x de 928 px de ancho.
for (const color of ['blanco', 'negro']) {
  for (const escala of [1, 2, 4]) {
    const svg = `citaly-logotipo-${color}.svg`
    const out = join(FINAL, 'png', `citaly-logotipo-${color}-${928 * escala}.png`)
    execFileSync('node', [RENDER, '--input', join(FINAL, svg), '--out', out,
      '--width', '928', '--height', '308', '--scale', String(escala), '--transparent', '--wait', '150'], { stdio: 'inherit' })
  }
}
