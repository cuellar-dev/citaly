import { useId } from 'react'
import { COPETE, LETRAS, PICO, VIEWBOX } from './trazos.js'
import './logotipo.css'

/* El logotipo de Citaly: CITALY a pincel, con el copete de Taly en la I, el
   pico en la A y las patas en la Y.

   Va en línea (no como <img>) para que la tinta siga al tema: blanca en el
   oscuro y casi negra sobre el papel del claro.

   variante: 'auto' sigue al tema (y se queda en blanco dentro de las zonas
             .tema-oscuro-fijo); 'blanco' y 'negro' lo fijan. */

const VB = `${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.ancho} ${VIEWBOX.alto}`

/* useId da algo como «r3» o _r_3_; url(#...) solo se fía de letras y números. */
function idLimpio(id) {
  return `logo${id.replace(/[^a-zA-Z0-9]/g, '')}`
}

function Defs({ id }) {
  return (
    <defs>
      {/* La región va en coordenadas del dibujo entero: así el temblor del
          pulso es el mismo con el logotipo junto que con las letras sueltas. */}
      <filter id={`${id}-pulso`} filterUnits="userSpaceOnUse" x={VIEWBOX.x} y={VIEWBOX.y} width={VIEWBOX.ancho} height={VIEWBOX.alto}>
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="r" />
        <feDisplacementMap in="SourceGraphic" in2="r" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <linearGradient id={`${id}-cera`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#C98A1E" />
        <stop offset="1" stopColor="#C98A1E" stopOpacity=".2" />
      </linearGradient>
    </defs>
  )
}

/* Una letra: el trazo grueso, la segunda pasada fina (repasado a mano) y,
   si toca, el pico o el copete. */
function Trazos({ letra, id }) {
  const clase = `logotipo-${letra.tono}`
  return (
    <>
      <g transform={`translate(${letra.dx} 0)`}>
        {letra.trazos.map((d) => (
          <path key={d} className={clase} strokeWidth="15" d={d} />
        ))}
      </g>
      <g opacity=".35" transform={`translate(${letra.dx - 2.5} -2)`}>
        {letra.trazos.map((d) => (
          <path key={d} className={clase} strokeWidth="3" d={d} />
        ))}
      </g>
      {letra.pico && (
        <g transform="translate(-3 0)">
          <path fill="#FFD166" d={PICO.forma} />
          <path fill="#E9A93A" d={PICO.sombra} />
          <path fill={`url(#${id}-cera)`} d={PICO.cera} />
          <path stroke="#FFF3CF" strokeWidth="1.8" opacity=".75" d={PICO.luz} />
          <path stroke="#C98A1E" strokeWidth="2.2" d={PICO.contorno} />
        </g>
      )}
      {letra.copete && <path transform="translate(102 2) scale(.62) translate(-182 -92)" fill="#FFD166" d={COPETE} />}
    </>
  )
}

function Logotipo({ variante = 'auto', className = '', titulo = 'Citaly' }) {
  const id = idLimpio(useId())
  return (
    <svg
      className={`logotipo logotipo--${variante} ${className}`.trim()}
      viewBox={VB}
      role="img"
      aria-label={titulo}
      focusable="false"
    >
      <Defs id={id} />
      <g filter={`url(#${id}-pulso)`} fill="none" strokeLinecap="round" strokeLinejoin="round">
        {LETRAS.map((l) => (
          <Trazos key={l.id} letra={l} id={id} />
        ))}
      </g>
    </svg>
  )
}

/* Una sola letra, en su caja, para animarlas por separado. Se coloca con
   cajaLetra() dentro de un contenedor con la proporción del logotipo
   (.logotipo-letras). */
export function LetraLogotipo({ letra, variante = 'auto', className = '' }) {
  const id = idLimpio(useId())
  const [x0, x1] = letra.caja
  return (
    <svg
      className={`logotipo logotipo-letra logotipo--${variante} ${className}`.trim()}
      viewBox={`${x0} ${VIEWBOX.y} ${x1 - x0} ${VIEWBOX.alto}`}
      aria-hidden="true"
      focusable="false"
    >
      <Defs id={id} />
      <g filter={`url(#${id}-pulso)`} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <Trazos letra={letra} id={id} />
      </g>
    </svg>
  )
}

export default Logotipo
