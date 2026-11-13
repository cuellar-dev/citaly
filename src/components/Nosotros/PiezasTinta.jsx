import { TINTA } from './tinta.js'

export function FiltroPulso({ id, escala = 4, frecuencia = 0.03, semilla = 7 }) {
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency={frecuencia} numOctaves="2" seed={semilla} result="r" />
      <feDisplacementMap in="SourceGraphic" in2="r" scale={escala} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  )
}

/* Una pieza a tinta: el relleno va desplazado un pelo del contorno, como
   pintado a mano después de entintar (el mismo truco de taly-a-mano). */
export function Pieza({ d, relleno, grosor = 4, desfase = '2.5 2' }) {
  return (
    <>
      {relleno && <path d={d} fill={relleno} transform={`translate(${desfase})`} />}
      <path d={d} fill="none" stroke={TINTA.tinta} strokeWidth={grosor} />
    </>
  )
}
