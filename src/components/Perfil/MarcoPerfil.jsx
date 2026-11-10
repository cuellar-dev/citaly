import './marcoPerfil.css'

/* La tinta de Perfil. Antes la cabecera se apoyaba en un resplandor radial
   teal y un corte recto: eso no es de Citaly, es de cualquier app.

   Dos piezas, las dos con el trazo temblado de feTurbulence que usa el fondo
   de Descubre:

   - las chispas de Taly repartidas por arriba;
   - abajo, una loma dibujada a mano que cierra la cabecera, para que el corte
     no sea una línea recta de CSS.

   Todo chispa, ningún punto. Antes había estrellitas sueltas (círculos
   perfectos) conviviendo con las chispas: dos vocabularios a la vez y ninguno
   claro. Ahora solo hay uno, el de Taly, en dos tintas y varios tamaños.

   Es estático: se pinta una vez y no cuesta nada. Va detrás del contenido. */

/* [x, y, tamaño, tinta] — m: mostaza (el copete de Taly), p: menta pálida. */
const CHISPAS = [
  [332, 50, 1.35, 'm'],
  [58, 84, 1, 'p'],
  [288, 116, 0.8, 'm'],
  [368, 146, 0.72, 'p'],
  [150, 42, 0.62, 'p'],
  [238, 68, 0.95, 'm'],
  [96, 150, 0.68, 'm'],
  [196, 158, 0.55, 'p'],
  [354, 196, 0.85, 'p'],
  [26, 132, 0.6, 'm'],
  [128, 104, 0.48, 'p'],
  [300, 180, 0.5, 'm'],
]

/* La chispa de cuatro puntas del mundo de Taly: las puntas se estrechan con
   curvas, no con rectas, así que tiene el filo de una pluma y no de un icono. */
function chispa(x, y, s) {
  return `M${x} ${y - 9 * s} C${x + 1.5 * s} ${y - 2.5 * s} ${x + 2.5 * s} ${y - 1.5 * s} ${x + 9 * s} ${y} C${x + 2.5 * s} ${y + 1.5 * s} ${x + 1.5 * s} ${y + 2.5 * s} ${x} ${y + 9 * s} C${x - 1.5 * s} ${y + 2.5 * s} ${x - 2.5 * s} ${y + 1.5 * s} ${x - 9 * s} ${y} C${x - 2.5 * s} ${y - 1.5 * s} ${x - 1.5 * s} ${y - 2.5 * s} ${x} ${y - 9 * s} Z`
}

const TINTA = {
  m: 'var(--yellow-color, #ffd166)',
  p: 'var(--ink-pale, #bdf4e8)',
}

/* La loma: sube a la izquierda, baja a la derecha. Irregular a propósito. */
const LOMA = 'M0 30 C52 12 96 20 148 30 C206 41 248 18 300 12 C340 7 372 16 400 26 L400 60 L0 60 Z'
const LOMA_FILO = 'M0 30 C52 12 96 20 148 30 C206 41 248 18 300 12 C340 7 372 16 400 26'

function MarcoPerfil() {
  return (
    <div className="marco-perfil" aria-hidden="true">
      <svg className="marco-perfil-chispas" viewBox="0 0 400 220" preserveAspectRatio="xMidYMin slice" focusable="false">
        <defs>
          <filter id="marco-perfil-pulso" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="11" result="r" />
            <feDisplacementMap in="SourceGraphic" in2="r" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          {/* Un halo muy suave detrás de cada chispa: separa el trazo de la
              foto cuando la foto es clara, sin llegar a ser un resplandor. */}
          <filter id="marco-perfil-halo" x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
        </defs>

        <g filter="url(#marco-perfil-halo)" opacity="0.4">
          {CHISPAS.map(([x, y, s, t]) => (
            <path key={`h-${x}-${y}`} d={chispa(x, y, s * 0.9)} fill={TINTA[t]} />
          ))}
        </g>

        <g filter="url(#marco-perfil-pulso)">
          {CHISPAS.map(([x, y, s, t]) => (
            <path
              key={`${x}-${y}`}
              d={chispa(x, y, s)}
              fill={TINTA[t]}
              fillOpacity={t === 'm' ? 0.92 : 0.7}
            />
          ))}
        </g>
      </svg>

      <svg className="marco-perfil-loma" viewBox="0 0 400 60" preserveAspectRatio="none" focusable="false">
        <defs>
          <filter id="marco-perfil-pulso-loma" x="-4%" y="-20%" width="108%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="3" result="r" />
            <feDisplacementMap in="SourceGraphic" in2="r" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g filter="url(#marco-perfil-pulso-loma)">
          <path d={LOMA} fill="var(--background-color, #121413)" />
          <path
            d={LOMA_FILO}
            fill="none"
            stroke="var(--ink-light, #2aa795)"
            strokeOpacity="0.4"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  )
}

export default MarcoPerfil
