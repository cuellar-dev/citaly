import { useId } from 'react'
import {
  ALA,
  BARRIGA,
  COPETE,
  COPETE_AJUSTE,
  CUERPO,
  PATA_DER,
  PATA_IZQ,
  PICO,
  TALY_COLORES as C,
  TALY_VIEWBOX,
} from './talyPluma.js'

/* El Taly pequeño del header, pero quieto: para posarlo en el borde de una
   tarjeta o de una barra. Mismo dibujo, mismo temblor de pluma. Es adorno,
   así que va oculto a los lectores de pantalla. */
function TalyPluma({ tamano = 34, mirando = 'derecha', className = '' }) {
  const filtro = `taly-pluma-${useId().replace(/:/g, '')}`
  return (
    <svg
      className={className}
      viewBox={TALY_VIEWBOX}
      width={tamano}
      height={(tamano * 58) / 52}
      aria-hidden="true"
      focusable="false"
      style={mirando === 'izquierda' ? { transform: 'scaleX(-1)' } : undefined}
    >
      <defs>
        <filter id={filtro} x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="23" result="r" />
          <feDisplacementMap in="SourceGraphic" in2="r" scale="1.6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g filter={`url(#${filtro})`}>
        <g fill="none" stroke={C.mostaza} strokeWidth="2" strokeLinecap="round">
          <path d={PATA_IZQ} />
          <path d={PATA_DER} />
        </g>
        <path d={COPETE} fill={C.mostaza} transform={COPETE_AJUSTE} />
        <path d={CUERPO} fill={C.menta} />
        <path d={BARRIGA} fill={C.barriga} />
        <path d={ALA} fill={C.ala} />
        <path d={PICO} fill={C.mostaza} />
        <circle cx="33" cy="19" r="2.4" fill={C.tinta} />
        <circle cx="33.8" cy="18.2" r="0.7" fill={C.crema} />
      </g>
    </svg>
  )
}

export default TalyPluma
