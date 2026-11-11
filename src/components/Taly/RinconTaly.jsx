/* El rincón de Taly en el header: una lomita con su yerba, un par de flores,
   dos piedras y, muy al fondo, dos nubes de plumón casi transparentes. Es el
   mismo mundo del fondo de Descubre en pequeño.

   Va en dos capas para que haya profundidad:
   - RinconTaly, detrás del pájaro: cielo, loma, matas y flor;
   - YerbaDelante, encima: dos briznas cortas que le tapan un poco las patas
     cuando pasa, como si anduviera DENTRO de la yerba y no sobre un dibujo.

   Todo estático: se pinta una vez. El viewBox mide 150 × 46 y se ancla abajo
   a la derecha (xMaxYMax slice): si el header deja menos sitio, se recorta
   por la izquierda y lo que queda siempre es el suelo donde anda Taly. */

/* Brizna afinada: base ancha, punta fina, un poco curvada hacia `lado`. */
function brizna(x, y, alto, lado) {
  const tx = x + lado
  const ty = y - alto
  return `M${x - 0.9} ${y} C${x - 0.6} ${y - alto * 0.5} ${x + lado * 0.5} ${y - alto * 0.82} ${tx} ${ty} C${x + lado * 0.5 + 0.7} ${y - alto * 0.72} ${x + 0.7} ${y - alto * 0.42} ${x + 0.9} ${y} Z`
}

/* Mata: cuatro briznas de alturas distintas abriéndose desde el mismo pie. */
function mata(x, y, escala = 1) {
  const e = escala
  return [
    brizna(x - 1.2, y, 7 * e, -4 * e),
    brizna(x, y, 10.5 * e, -1.2 * e),
    brizna(x + 0.8, y, 8.6 * e, 2.4 * e),
    brizna(x + 1.6, y, 5.6 * e, 4.4 * e),
  ]
}

/* [x, y, escala, tinta]: claras delante, oscuras detrás. */
const MATAS = [
  [8, 35.8, 0.9, 'oscura'],
  [26, 32.6, 1.15, 'clara'],
  [38, 32.4, 0.7, 'oscura'],
  [56, 35.6, 1, 'clara'],
  [74, 41.6, 0.8, 'oscura'],
  [96, 45.6, 0.9, 'clara'],
]

const TINTAS = {
  clara: 'var(--ink-light, #2aa795)',
  oscura: 'var(--primary-color-weak, #077a6f)',
}

/* La loma: sube a la izquierda y se aplana a la derecha, donde anda Taly. */
const LOMA_FILO = 'M-2 38 C18 32 40 31 60 37 C72 41 80 45.4 96 45.6 L152 45.6'
const LOMA = `${LOMA_FILO} L152 47 L-2 47 Z`

/* La nube de plumón del fondo de Descubre, la misma forma en chico. */
const NUBE =
  'M44 196 C26 196 21 176 39 171 C38 151 69 147 78 162 C91 145 123 150 124 171 C144 168 151 189 130 194 Z'

/* Flor de cuatro pétalos con su tallo. */
function Flor({ x, y, alto, color }) {
  const cy = y - alto - 1.6
  return (
    <g>
      <path
        d={`M${x} ${y} C${x - 1.2} ${y - alto * 0.5} ${x + 1} ${y - alto * 0.8} ${x} ${y - alto}`}
        fill="none"
        stroke="var(--ink-light, #2aa795)"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <circle cx={x - 1.6} cy={cy} r="1.6" fill={color} />
      <circle cx={x + 1.6} cy={cy} r="1.6" fill={color} />
      <circle cx={x} cy={cy - 1.6} r="1.6" fill={color} />
      <circle cx={x} cy={cy + 1.6} r="1.6" fill={color} />
      <circle cx={x} cy={cy} r="1" fill="#c9952f" />
    </g>
  )
}

function RinconTaly() {
  return (
    <svg className="rincon-taly" viewBox="0 0 150 46" preserveAspectRatio="xMaxYMax slice" focusable="false">
      <defs>
        <filter id="rincon-taly-pulso" x="-5%" y="-20%" width="110%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="9" result="r" />
          <feDisplacementMap in="SourceGraphic" in2="r" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      {/* Nubes: apenas se ven. Están para que el rincón tenga cielo, no para
          que se miren. */}
      <g fill="var(--ink-pale, #bdf4e8)" fillOpacity="0.06">
        <path d={NUBE} transform="translate(8 -39.2) scale(0.28)" />
        <path d={NUBE} transform="translate(93.8 -29.4) scale(0.2)" />
      </g>

      <g filter="url(#rincon-taly-pulso)">
        <path d={LOMA} fill="var(--ink-light, #2aa795)" fillOpacity="0.07" />
        <path
          d={LOMA_FILO}
          fill="none"
          stroke="var(--ink-light, #2aa795)"
          strokeOpacity="0.42"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        <ellipse cx="65" cy="39.4" rx="2.3" ry="1.3" fill="#2b3230" />
        <ellipse cx="69.4" cy="40.8" rx="1.4" ry="0.9" fill="#323a37" />

        {MATAS.map(([x, y, e, t]) => (
          <g key={x} fill={TINTAS[t]} fillOpacity={t === 'clara' ? 0.75 : 0.85}>
            {mata(x, y, e).map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
        ))}

        <Flor x={45} y={33.4} alto={8.5} color="var(--yellow-color, #ffd166)" />
      </g>
    </svg>
  )
}

export function YerbaDelante() {
  return (
    <svg
      className="rincon-taly rincon-taly--delante"
      viewBox="0 0 150 46"
      preserveAspectRatio="xMaxYMax slice"
      focusable="false"
    >
      <defs>
        <filter id="rincon-taly-pulso-delante" x="-5%" y="-20%" width="110%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="4" result="r" />
          <feDisplacementMap in="SourceGraphic" in2="r" scale="1.4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g filter="url(#rincon-taly-pulso-delante)">
        <g fill="var(--ink-light, #2aa795)" fillOpacity="0.9">
          {mata(124, 46.2, 0.5).map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <Flor x={143} y={46} alto={5.5} color="var(--ink-pale, #bdf4e8)" />
      </g>
    </svg>
  )
}

export default RinconTaly
