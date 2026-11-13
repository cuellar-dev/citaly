import './switchTema.css'

/* Interruptor de tema, dibujado a mano como el resto del cartel.

   Es solo el dibujo: quien habla con el lector de pantalla es la tabla que
   lo contiene (role="menuitemcheckbox"), por eso va aria-hidden.

   De noche el astro es una luna: un disco crema al que le "muerde" un círculo
   del color de la pista. Al pasar a claro, el mordisco se escapa hacia arriba
   y se encoge, el disco se vuelve mostaza y le salen los rayos: la luna se
   convierte en sol en vez de cambiarse por otro dibujo. La pista pasa de
   tinta de noche al menta claro de la barriga de Taly, con una nube. */

const RAYOS = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4
  const r1 = 9.6
  const r2 = 11.9
  return {
    x1: 13 + Math.cos(a) * r1,
    y1: 13 + Math.sin(a) * r1,
    x2: 13 + Math.cos(a) * r2,
    y2: 13 + Math.sin(a) * r2,
  }
})

function SwitchTema({ claro }) {
  return (
    <svg
      className={`switch-tema${claro ? ' switch-tema--claro' : ''}`}
      viewBox="0 0 46 26"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id="switch-tema-pulso" x="-10%" y="-20%" width="120%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="11" result="r" />
          <feDisplacementMap in="SourceGraphic" in2="r" scale="1.6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      {/* Pista: tiembla como la madera. */}
      <g filter="url(#switch-tema-pulso)">
        <rect className="switch-tema-pista" x="2" y="3.5" width="42" height="19" rx="9.5" />
        <path
          className="switch-tema-nube"
          d="M7.6 17.4 C6.2 17.4 5.6 15.6 7 15 C6.9 13.4 8.9 12.7 9.8 13.9 C10.6 12.6 12.9 13 12.9 14.7 C14.3 14.7 14.6 17.4 13 17.4 Z"
        />
      </g>

      {/* El astro viaja entero; dentro, cada pieza hace su parte del cambio. */}
      <g className="switch-tema-astro">
        <g className="switch-tema-rayos">
          {RAYOS.map((r, i) => (
            <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} />
          ))}
        </g>
        <circle className="switch-tema-disco" cx="13" cy="13" r="7.4" />
        <circle className="switch-tema-crater" cx="10.4" cy="14.6" r="1.25" />
        <circle className="switch-tema-crater" cx="13.4" cy="17.2" r="0.85" />
        <circle className="switch-tema-mordisco" cx="16.6" cy="9.8" r="6.1" />
      </g>
    </svg>
  )
}

export default SwitchTema
