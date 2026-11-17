import { useId, useLayoutEffect, useRef, useState } from 'react'
import './tinta.css'

/* Piezas dibujadas a tinta para la ficha del local, del mismo mundo que
   taly-a-mano.svg y el rincón de Taly: trazo con temblor de pluma
   (feTurbulence + feDisplacementMap) y la paleta de arte.js. Todas estáticas
   y ocultas a lectores de pantalla: son ambiente, no contenido.

   Nada de destellos ni chispitas: no son de la marca. */

function usePulso(prefijo, escala = 1.4) {
  const id = `${prefijo}-${useId().replace(/:/g, '')}`
  const defs = (
    <defs>
      <filter id={id} x="-5%" y="-40%" width="110%" height="180%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="r" />
        <feDisplacementMap in="SourceGraphic" in2="r" scale={escala} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  )
  return { defs, filtro: `url(#${id})` }
}

/* Separador cosido a puntadas, como las colinas del fondo de Descubre: una
   línea que ondula un poco, con un nudo en cada punta y una pluma suelta en
   medio. */
export function TrazoCosido({ pluma = true }) {
  const { defs, filtro } = usePulso('trazo')
  return (
    <svg className="tinta-trazo" viewBox="0 0 360 18" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {defs}
      <g filter={filtro} fill="none" strokeLinecap="round">
        <path
          d="M8 10 C60 6 110 13 160 9 M200 9 C250 6 300 13 352 9"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeDasharray="6 6"
        />
        <circle cx="6" cy="10" r="2" fill="currentColor" stroke="none" />
        <circle cx="354" cy="9" r="2" fill="currentColor" stroke="none" />
        {pluma ? (
          <g transform="translate(180 9) rotate(-18)">
            <path d="M-11 0 C-6 -4 4 -4 11 0 C4 4 -6 4 -11 0 Z" fill="var(--tinta-pluma)" stroke="none" />
            <path d="M-13 0 L11 0" stroke="var(--tinta-pluma-raquis)" strokeWidth="1" />
          </g>
        ) : null}
      </g>
    </svg>
  )
}

/* Borde de nubecitas: tapa el pie de la foto de cabecera con una fila de
   nubes pequeñas del color del fondo, así la foto se deshace en el mundo de
   Taly en vez de cortarse en recto. Dos capas: las de atrás un poco más
   altas y con el trazo más suave, las de delante encima tapando sus
   costuras. Se calculan para el ancho real: nunca se estiran. */
const NUBE_ALTO = 34
const NUBE_BASE = 30 // donde se apoyan las nubes de delante
const NUBE_ANCHOS = [44, 34, 40, 30, 46, 36] // ritmo fijo, sin azar

/* Una nube: bulto pequeño, bulto grande, bulto pequeño, base plana. */
function nube(x0, w, base) {
  const h = w * 0.52
  const p = (n) => n.toFixed(2)
  const x1 = x0 + w * 0.3
  const x2 = x0 + w * 0.72
  const filo =
    `M${p(x0)} ${base} ` +
    `A${p(w * 0.17)} ${p(w * 0.17)} 0 0 1 ${p(x1)} ${p(base - h * 0.48)} ` +
    `A${p(w * 0.23)} ${p(w * 0.23)} 0 0 1 ${p(x2)} ${p(base - h * 0.42)} ` +
    `A${p(w * 0.15)} ${p(w * 0.15)} 0 0 1 ${p(x0 + w)} ${base}`
  return { filo, relleno: `${filo} L${p(x0 + w)} ${NUBE_ALTO} L${p(x0)} ${NUBE_ALTO} Z` }
}

function filaDeNubes(ancho) {
  const nubes = []
  let x = -10
  for (let i = 0; x < ancho + 10; i++) {
    const w = NUBE_ANCHOS[i % NUBE_ANCHOS.length]
    /* Las grandes un pelín más abajo y las chicas más arriba: la fila respira. */
    nubes.push(nube(x, w, NUBE_BASE - (w < 38 ? 2 : 0)))
    x += w * 0.74
  }
  return nubes
}

export function NubeBorde() {
  const ref = useRef(null)
  const [ancho, setAncho] = useState(360)

  useLayoutEffect(() => {
    const svg = ref.current
    if (!svg) return undefined
    const medir = () => setAncho(Math.round(svg.getBoundingClientRect().width) || 360)
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(svg)
    return () => ro.disconnect()
  }, [])

  const nubes = filaDeNubes(ancho)
  const fondo = 'var(--fondo-pagina, var(--background-color))'

  return (
    <svg
      ref={ref}
      className="tinta-nube"
      viewBox={`0 0 ${ancho} ${NUBE_ALTO}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* Cada nube se rellena y luego se perfila: la siguiente tapa el trazo
          de la anterior donde se montan, así no se cruzan líneas por dentro. */}
      {nubes.map(({ filo, relleno }, i) => (
        <g key={i}>
          <path d={relleno} fill={fondo} />
          <path d={filo} className="tinta-nube-filo" />
        </g>
      ))}
      {/* Tapa el pie de las nubes: se ven las copas, no las patas. */}
      <rect x="0" y={NUBE_BASE - 6} width={ancho} height={NUBE_ALTO - NUBE_BASE + 6} fill={fondo} />
    </svg>
  )
}

/* Barrio dibujado a mano para "Cómo llegar". No hay coordenadas del local,
   así que no finge ser un mapa real: calles a tinta, un parque, la ruta a
   puntadas desde "tú" y el pin del local en mostaza. */
export function MapaTinta() {
  const { defs, filtro } = usePulso('mapa', 1.8)
  return (
    <svg className="tinta-mapa" viewBox="0 0 320 112" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      {defs}
      <g filter={filtro}>
        {/* manzanas */}
        <g fill="var(--tinta-manzana)">
          <rect x="18" y="12" width="70" height="34" rx="6" />
          <rect x="110" y="10" width="86" height="30" rx="6" />
          <rect x="222" y="14" width="80" height="38" rx="6" />
          <rect x="22" y="68" width="62" height="34" rx="6" />
          <rect x="226" y="72" width="74" height="30" rx="6" />
        </g>
        {/* parque */}
        <path d="M112 62 C130 54 176 56 196 64 C204 78 196 96 176 100 C150 104 120 100 112 88 C106 80 106 68 112 62 Z" fill="var(--tinta-parque)" />
        <g fill="var(--tinta-arbol)">
          <circle cx="132" cy="76" r="5" />
          <circle cx="150" cy="86" r="6" />
          <circle cx="174" cy="74" r="5" />
        </g>
        {/* calles */}
        <g fill="none" stroke="var(--tinta-calle)" strokeLinecap="round">
          <path d="M-4 56 C80 54 160 60 324 56" strokeWidth="5" />
          <path d="M100 -4 C98 40 104 80 100 116" strokeWidth="4" />
          <path d="M210 -4 C214 40 208 80 212 116" strokeWidth="4" />
        </g>
        {/* ruta a puntadas */}
        <path
          d="M40 100 C60 80 80 64 100 58 C140 50 180 58 212 52 C226 48 236 42 248 38"
          fill="none"
          stroke="var(--primary-color)"
          strokeWidth="2"
          strokeDasharray="5 5"
          strokeLinecap="round"
        />
        {/* tú */}
        <circle cx="40" cy="100" r="6" fill="var(--primary-color)" opacity="0.25" />
        <circle cx="40" cy="100" r="3" fill="var(--primary-color)" />
        {/* pin del local */}
        <g transform="translate(250 36)">
          <ellipse cx="0" cy="2" rx="7" ry="2.4" fill="#000" opacity="0.35" />
          <path d="M0 0 C-4 -8 -11 -12 -11 -20 C-11 -27 -6 -31 0 -31 C6 -31 11 -27 11 -20 C11 -12 4 -8 0 0 Z" fill="var(--yellow-color)" stroke="var(--tinta-oscura)" strokeWidth="1.5" />
          <circle cx="0" cy="-20" r="4" fill="var(--tinta-oscura)" />
        </g>
      </g>
    </svg>
  )
}
