import { useRef } from 'react'
import { TINTA as T, useHervor, useIdSvg } from './tinta.js'
import { FiltroPulso } from './PiezasTinta.jsx'
import { ORIGEN } from './talyMovimientos.js'

/* Taly a tinta, en grande y por piezas.

   Es el dibujo de taly-a-mano.svg partido para poder moverlo: patas, torso,
   ala, ojo... cada pieza lleva data-parte="..." y las animaciones de la
   página la buscan por ahí. Encima, poses nuevas que no existían:

     posado    el de siempre
     volando   patas recogidas, ala alzada y la segunda ala asomando detrás
     dormido   ojo cerrado (con 'zz' y 'nido' en extras queda en su nido)
     feliz     ojo en arco, de contento

   extras: 'sobre' (una cita en el pico), 'lupa', 'zz', 'nido'.

   Las piezas ocultas por pose se renderizan igual, solo escondidas: así una
   animación puede despertar a Taly o hacerle alzar el vuelo sin re-render. */

const CUERPO =
  'M175 85 C215 68 246 94 249 134 C252 166 286 186 304 226 C324 278 286 328 200 330 C114 334 78 282 98 226 C116 180 150 162 152 126 C152 106 160 92 175 85 Z'
const BARRIGA = 'M205 214 C256 210 304 236 296 286 C288 328 236 336 190 326 C232 306 244 256 205 214 Z'
const ALA = 'M134 204 C166 182 218 198 236 240 C220 284 160 290 128 256 C118 238 120 218 134 204 Z'
const ALA_TRASERA =
  'M168 196 C150 150 118 112 70 96 C86 124 84 136 100 152 C78 152 70 164 86 180 C112 200 142 210 166 214 Z'
const COPETE = 'M168 92 C156 70 160 52 174 42 C178 58 188 62 192 76 C198 62 206 58 214 56 C214 72 204 84 196 92 Z'
const PICO = 'M246 112 C268 112 290 122 300 134 C282 146 262 150 247 146 Z'
const PATA_IZQ = 'M178 326 L176 358 M176 358 L158 365 M176 358 L192 366'
const PATA_DER = 'M226 327 L228 358 M228 358 L210 366 M228 358 L244 365'

function TalyTinta({
  pose = 'posado',
  extras = [],
  className = '',
  semilla = 7,
  hervir = true,
  titulo,
  ...resto
}) {
  const ref = useRef(null)
  const id = useIdSvg('taly-tinta')
  useHervor(ref, hervir)

  const volando = pose === 'volando'
  const dormido = pose === 'dormido'
  const feliz = pose === 'feliz'
  const ojoAbierto = !dormido && !feliz
  const tiene = (x) => extras.includes(x)
  const oculto = (si) => (si ? undefined : { visibility: 'hidden', opacity: 0 })

  return (
    <svg
      ref={ref}
      className={`taly-tinta ${className}`.trim()}
      viewBox="0 0 400 400"
      overflow="visible"
      role={titulo ? 'img' : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
      focusable="false"
      {...resto}
    >
      <defs>
        <FiltroPulso id={id} escala={5} frecuencia={0.035} semilla={semilla} />
        <clipPath id={`${id}-dentro`}>
          <path d={CUERPO} />
        </clipPath>
      </defs>

      <g filter={`url(#${id})`} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Sombrita a garabato. Al volar se va. */}
        <g data-parte="sombra" style={oculto(!volando && !tiene('nido'))}>
          <path d="M120 372 C160 380 250 380 292 371" stroke={T.tinta} strokeOpacity=".35" strokeWidth="5" />
          <path d="M140 380 C180 386 235 386 270 380" stroke={T.tinta} strokeOpacity=".2" strokeWidth="4" />
        </g>

        {/* La segunda ala, la del otro lado, solo asoma en vuelo. */}
        <g data-parte="ala-trasera" style={oculto(volando)}>
          <path d={ALA_TRASERA} fill={T.alaOscura} transform="translate(4 3)" />
          <path d={ALA_TRASERA} stroke={T.tinta} strokeWidth="4" />
          <path d="M150 190 C130 160 110 140 90 128 M140 200 C120 184 104 176 96 172" stroke={T.menta} strokeOpacity=".6" strokeWidth="3" />
        </g>

        <g data-parte="patas">
          <g data-parte="pata-izq" transform={volando ? `rotate(38 ${ORIGEN.caderaIzq})` : undefined}>
            <path d={PATA_IZQ} stroke={T.tinta} strokeWidth="13" />
            <path d={PATA_IZQ} stroke={T.mostaza} strokeWidth="6" />
          </g>
          <g data-parte="pata-der" transform={volando ? `rotate(32 ${ORIGEN.caderaDer})` : undefined}>
            <path d={PATA_DER} stroke={T.tinta} strokeWidth="13" />
            <path d={PATA_DER} stroke={T.mostaza} strokeWidth="6" />
          </g>
        </g>

        <g data-parte="torso">
          {/* Rellenos, corridos del contorno como pintados a mano. */}
          <g transform="translate(4 3)">
            <path d={CUERPO} fill={T.menta} />
            <g clipPath={`url(#${id}-dentro)`}>
              <path d={BARRIGA} fill={T.barriga} />
              <g stroke={T.puntada} strokeWidth="4">
                <path d="M240 250 l9 3 M254 266 l9 2 M232 276 l9 3 M250 289 l9 1 M232 300 l9 2 M262 248 l8 4" />
              </g>
              <g stroke="#2fbda8" strokeWidth="4">
                <path d="M120 232 l-3 9 M108 255 l-2 9 M118 282 l2 8 M136 304 l4 7" />
                <path d="M176 100 l8 3 M194 90 l9 1 M212 94 l8 3 M170 124 l7 -2 M168 148 l4 7 M188 168 l7 3" />
                <path d="M268 206 l-4 8 M284 228 l-6 6 M292 252 l-8 4" />
              </g>
            </g>
            <path d={COPETE} fill={T.mostaza} />
            <path d={PICO} fill={T.mostaza} />
          </g>

          {/* Contornos: dos pasadas, como repasado. */}
          <path d={CUERPO} stroke={T.tinta} strokeWidth="5" />
          <path d={CUERPO} stroke={T.tinta} strokeWidth="2" strokeOpacity=".45" transform="translate(-2 -2) rotate(.6 200 200)" />
          <path d="M168 92 C156 70 160 52 174 42 C178 58 188 62 192 76 C198 62 206 58 214 56 C214 72 204 84 196 92" stroke={T.tinta} strokeWidth="4" />
          <path d="M246 112 C268 112 290 122 300 134 C282 146 262 150 247 146" stroke={T.tinta} strokeWidth="4" />
          <path d="M250 134 C266 134 282 134 298 134" stroke={T.tinta} strokeWidth="3" />

          {/* Ojos: abierto, cerrado (dormido) y en arco (feliz). */}
          <g data-parte="ojo" style={oculto(ojoAbierto)}>
            <g data-parte="pupila">
              <ellipse cx="224" cy="116" rx="8" ry="9" fill={T.tinta} />
              <circle cx="227" cy="112" r="2.6" fill={T.crema} />
            </g>
            <path d="M212 100 C220 94 232 95 238 101" stroke={T.tinta} strokeWidth="3" />
          </g>
          <g data-parte="ojo-cerrado" style={oculto(dormido)}>
            <path d="M212 116 C219 124 231 124 238 116" stroke={T.tinta} strokeWidth="5" />
            <path d="M214 104 C221 100 231 100 237 104" stroke={T.tinta} strokeWidth="2.5" strokeOpacity=".6" />
          </g>
          <g data-parte="ojo-feliz" style={oculto(feliz)}>
            <path d="M212 120 C217 106 233 106 238 120" stroke={T.tinta} strokeWidth="5" />
          </g>

          {/* El ala va encima del cuerpo y gira desde el hombro. */}
          <g data-parte="ala" transform={volando ? `rotate(-62 ${ORIGEN.hombro})` : undefined}>
            <path d={ALA} fill={T.ala} transform="translate(4 3)" />
            <g stroke={T.menta} strokeWidth="4" transform="translate(4 3)">
              <path d="M148 218 C172 208 200 214 216 232" />
              <path d="M142 236 C168 228 194 234 214 248" />
              <path d="M144 254 C166 250 188 256 202 266" />
            </g>
            <path d={ALA} stroke={T.tinta} strokeWidth="4" />
            <path d="M160 246 C176 244 192 250 204 260" stroke={T.tinta} strokeWidth="2.5" strokeOpacity=".5" />
          </g>

          {/* Una cita en el pico: el sobre, con su sello de mostaza. */}
          <g data-parte="sobre" style={oculto(tiene('sobre'))} transform="translate(326 146) rotate(12)">
            <path d="M-36 -24 L36 -26 L38 22 L-36 24 Z" fill={T.crema} transform="translate(3 2)" />
            <path d="M-36 -24 L36 -26 L38 22 L-36 24 Z" stroke={T.tinta} strokeWidth="4" />
            <path d="M-36 -24 L1 4 L36 -26" stroke={T.tinta} strokeWidth="3.5" />
            <circle cx="1" cy="4" r="8" fill={T.mostaza} stroke={T.tinta} strokeWidth="3" />
          </g>

          {/* La lupa de buscar sitio, sujeta con el ala. */}
          <g data-parte="lupa" style={oculto(tiene('lupa'))}>
            <path d="M262 262 L222 306" stroke={T.tinta} strokeWidth="18" />
            <path d="M262 262 L222 306" stroke={T.mostaza} strokeWidth="9" />
            <circle cx="296" cy="226" r="40" fill={T.barriga} fillOpacity=".35" stroke={T.tinta} strokeWidth="9" />
            <circle cx="296" cy="226" r="40" stroke={T.crema} strokeWidth="3" strokeOpacity=".9" />
            <path d="M276 206 C284 198 296 196 306 200" stroke={T.crema} strokeWidth="4" />
          </g>
        </g>

        <g data-parte="zz" style={oculto(tiene('zz'))}>
          <path data-z d="M290 78 L314 78 L290 102 L314 102" stroke={T.barriga} strokeWidth="5" />
          <path data-z d="M326 40 L344 40 L326 58 L344 58" stroke={T.barriga} strokeWidth="4" />
        </g>

        {/* El nido, delante de las patas: Taly se hunde en él. */}
        <g data-parte="nido" style={oculto(tiene('nido'))}>
          <path d="M70 312 C78 396 322 396 332 312 C276 340 128 340 70 312 Z" fill="#c99a3a" transform="translate(4 3)" />
          <path d="M70 312 C78 396 322 396 332 312 C276 340 128 340 70 312 Z" stroke={T.tinta} strokeWidth="5" />
          <g stroke={T.tinta} strokeWidth="3" strokeOpacity=".7">
            <path d="M96 340 C150 356 250 358 306 338" />
            <path d="M110 362 C170 374 236 374 290 360" />
            <path d="M84 326 L118 352 M140 334 L170 366 M200 338 L216 372 M262 334 L250 368 M312 324 L290 352" />
          </g>
          <path d="M66 314 C50 300 60 290 76 302 M336 314 C352 300 344 290 326 302" stroke={T.tinta} strokeWidth="4" />
        </g>
      </g>
    </svg>
  )
}

export default TalyTinta
