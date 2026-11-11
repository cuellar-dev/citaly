import './escenaTendedero.css'

/* La cabecera de Notificaciones: un tendedero a pluma cruzando la pantalla.
   De él cuelgan sobres con pinzas, uno por cada aviso nuevo (hasta cuatro), y
   a la derecha está Taly posado en el cable con un sobre en el pico: es el que
   trae los avisos.

   Cuando lo lees todo, los sobres se descuelgan y quedan las pinzas solas.
   El número de sobres es la información, el dibujo no es solo adorno.

   El cable es una Bézier cúbica: (-10,70) (100,100) (300,100) (410,64). Los
   puntos de las pinzas y las patas de Taly están calculados sobre esa curva,
   si se toca el cable hay que recalcularlos. */

const CABLE = 'M-10 70 C100 100 300 100 410 64'
const CABLE_REPASO = 'M-10 73 C110 101 290 102 410 67'

/* [x, y, giro]: tres a la izquierda, lejos de la foto, y uno pasado Taly. */
const PINZAS = [
  [33, 79.5, -7],
  [82, 86.3, 4],
  [134, 90.3, -3],
  [374, 73.8, 6],
]

/* El sobre se dibuja colgando desde la pinza, con (0,0) en el cable. */
const SOBRE = 'M-11 4.2 C-4 3.8 4 4.4 11 4 L10.7 19.2 C4 19.6 -4 19 -10.8 19.4 Z'
const SOBRE_SOLAPA = 'M-10.8 4.6 C-6 8 -3 10.4 0 12.4 C3 10.4 6 8 10.8 4.4'

/* Taly: los mismos trazos que TalyPosado (caja de 0 a 50). */
const CUERPO =
  'M27 9 C34 9 38 14 39 20 C42 24 43 30 41 35 C38 40 32 43 27 43 C22 43 16 40 13 35 C11 30 12 24 15 20 C16 14 20 9 27 9 Z'
const BARRIGA = 'M27 24 C33 24 37 29 37 34 C37 39 32 42 27 42 C22 42 17 39 17 34 C17 29 21 24 27 24 Z'
const ALA = 'M19 24 C24 23 28 27 28 32 C28 36 25 39 21 38 C17 37 15 32 16 28 C17 26 18 24 19 24 Z'
const COPETE = 'M20 11 C21 5 23 1 26 0 C27 3 28 6 30 9 C31 4 33 -2 37 -3 C39 1 39 6 38 11 C33 13 25 13 20 11 Z'
const PICO = 'M39 19 C43 19 46 21 46 22 C46 23 43 25 39 25 Z'
/* Patas agarradas al cable: los dedos se cierran hacia abajo, no se abren
   en el aire como cuando está en el suelo. */
const PATAS = 'M22 42 L22 48 M19.5 50.5 C20.5 48.5 23.5 48.5 24.5 50.5 M32 42 L32 48 M29.5 50.5 C30.5 48.5 33.5 48.5 34.5 50.5'

/* Patas en (27,50) de Taly → cable en (309,55+30). Escala 1.3. */
const TALY = 'translate(274 20) scale(1.3)'

function Sobre({ x, y, giro, visible, indice }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${giro})`}>
      <g
        className={`escena-sobre${visible ? '' : ' escena-sobre--fuera'}`}
        style={{ transitionDelay: visible ? `${indice * 50}ms` : '0ms' }}
      >
        <path d={SOBRE} className="escena-sobre-papel" />
        <path d={SOBRE_SOLAPA} className="escena-sobre-solapa" />
      </g>
      <rect x="-1.7" y="-4.5" width="3.4" height="10" rx="1.2" className="escena-pinza" />
    </g>
  )
}

function EscenaTendedero({ sobres = 0 }) {
  return (
    <svg
      className="escena-tendedero"
      viewBox="0 0 400 170"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id="escena-pulso" x="-5%" y="-20%" width="110%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="17" result="r" />
          <feDisplacementMap in="SourceGraphic" in2="r" scale="2.6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      <g filter="url(#escena-pulso)">
        <path d={CABLE} className="escena-cable" />
        <path d={CABLE_REPASO} className="escena-cable escena-cable--repaso" />

        {PINZAS.map(([x, y, giro], i) => (
          <Sobre key={x} x={x} y={y} giro={giro} visible={i < sobres} indice={i} />
        ))}

        <g transform={TALY}>
          <path d={PATAS} stroke="#ffd166" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d={COPETE} fill="#ffd166" transform="translate(-2.4 0)" />
          <path d={CUERPO} fill="#4fd8c4" />
          <path d={BARRIGA} fill="#bdf4e8" />
          <path d={ALA} fill="#2aa795" />
          {/* El sobre que trae, cogido por la esquina con el pico. */}
          <g transform="translate(44 21) rotate(16)">
            <path d="M0 0 C4 -0.3 9 0.2 13 0 L12.8 9 C8.8 9.3 4 8.8 0.2 9.1 Z" fill="#f2ebdd" />
            <path d="M0.3 0.4 C3 2.6 5 4 6.6 5 C8.4 4 10.4 2.6 12.8 0.3" fill="none" stroke="#b9ad97" strokeWidth="0.8" strokeLinecap="round" />
          </g>
          <path d={PICO} fill="#ffd166" />
          <circle cx="33" cy="19" r="2.4" fill="#0e2e2a" />
          <circle cx="33.8" cy="18.2" r="0.7" fill="#f2ebdd" />
        </g>
      </g>
    </svg>
  )
}

export default EscenaTendedero
