import { useRef } from 'react'
import { TINTA as T, useHervor, useIdSvg } from './tinta.js'
import { FiltroPulso, Pieza } from './PiezasTinta.jsx'

/* Los objetos del mundo de Citaly dibujados a tinta, con la misma mano que
   Taly: relleno de su paleta corrido del contorno. Caja de 100 × 100. */

const DIBUJOS = {
  calendario: () => (
    <>
      <Pieza d="M18 28 C18 24 21 22 25 22 L76 21 C80 21 82 24 82 28 L83 78 C83 82 80 84 76 84 L24 85 C20 85 17 82 17 78 Z" relleno={T.crema} />
      <Pieza d="M18 28 C18 24 21 22 25 22 L76 21 C80 21 82 24 82 28 L82 38 L18 39 Z" relleno={T.mostaza} />
      <path d="M34 13 L34 30 M66 13 L66 30" stroke={T.tinta} strokeWidth="6" />
      <g fill={T.tinta}>
        {[30, 42, 54, 66].flatMap((x) => [50, 62, 74].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="2.6" />))}
      </g>
      <path d="M57 64 C56 55 72 54 74 63 C76 73 58 75 57 65" stroke={T.ala} strokeWidth="4" />
    </>
  ),
  reloj: () => (
    <>
      <path d="M38 10 L48 16 M62 10 L52 16" stroke={T.tinta} strokeWidth="5" />
      <Pieza d="M50 16 C72 16 86 31 86 51 C86 72 70 87 50 87 C29 87 14 71 14 51 C14 30 29 16 50 16 Z" relleno={T.barriga} />
      <path d="M50 23 L50 29 M79 51 L73 51 M50 80 L50 74 M21 51 L27 51" stroke={T.tinta} strokeWidth="4" />
      <path d="M50 51 L50 33 M50 51 L64 59" stroke={T.tinta} strokeWidth="5" />
      <circle cx="50" cy="51" r="5" fill={T.mostaza} stroke={T.tinta} strokeWidth="2.5" />
    </>
  ),
  sobre: () => (
    <>
      <Pieza d="M12 30 L88 27 L90 74 L12 77 Z" relleno={T.crema} />
      <path d="M12 30 L50 57 L88 27" stroke={T.tinta} strokeWidth="4" />
      <path d="M12 77 L40 53 M90 74 L62 53" stroke={T.tinta} strokeWidth="3" strokeOpacity=".6" />
      <Pieza d="M50 48 C55 48 58 52 58 56 C58 61 55 64 50 64 C45 64 42 61 42 56 C42 52 45 48 50 48 Z" relleno={T.mostaza} grosor={3} />
    </>
  ),
  pin: () => (
    <>
      <Pieza d="M50 90 C40 74 22 60 22 40 C22 24 35 12 50 12 C65 12 78 24 78 40 C78 60 60 74 50 90 Z" relleno={T.menta} />
      <Pieza d="M50 29 C57 29 61 34 61 40 C61 47 57 51 50 51 C43 51 39 47 39 40 C39 34 43 29 50 29 Z" relleno={T.crema} grosor={3.5} />
      <path d="M30 42 C30 30 38 22 46 20" stroke={T.barriga} strokeWidth="3" strokeOpacity=".8" />
    </>
  ),
  tijeras: () => (
    <>
      <Pieza d="M28 10 C34 10 58 50 60 60 L54 64 C48 56 26 16 28 10 Z" relleno={T.crema} />
      <Pieza d="M72 10 C66 10 42 50 40 60 L46 64 C52 56 74 16 72 10 Z" relleno={T.crema} />
      <Pieza d="M36 66 C44 66 49 71 49 78 C49 85 44 90 36 90 C28 90 23 85 23 78 C23 71 28 66 36 66 Z" relleno={T.mostaza} />
      <Pieza d="M64 66 C72 66 77 71 77 78 C77 85 72 90 64 90 C56 90 51 85 51 78 C51 71 56 66 64 66 Z" relleno={T.mostaza} />
      <circle cx="36" cy="78" r="5" fill={T.fondo} stroke={T.tinta} strokeWidth="2.5" />
      <circle cx="64" cy="78" r="5" fill={T.fondo} stroke={T.tinta} strokeWidth="2.5" />
      <circle cx="50" cy="52" r="3.5" fill={T.tinta} />
    </>
  ),
  taza: () => (
    <>
      <path d="M38 32 C34 26 42 22 38 14 M54 32 C50 26 58 22 54 12" stroke={T.barriga} strokeWidth="3.5" strokeOpacity=".85" />
      <path d="M72 46 C88 46 88 66 70 66" stroke={T.tinta} strokeWidth="6" />
      <Pieza d="M22 40 L74 40 C74 64 66 80 48 80 C30 80 22 64 22 40 Z" relleno={T.crema} />
      <path d="M25 43 C40 48 58 48 71 43" stroke={T.ala} strokeWidth="4" />
      <path d="M12 86 C30 94 68 94 88 86" stroke={T.tinta} strokeWidth="5" />
    </>
  ),
  campana: () => (
    <>
      <circle cx="50" cy="11" r="4.5" fill={T.mostaza} stroke={T.tinta} strokeWidth="3" />
      <Pieza d="M50 15 C66 15 72 29 72 47 C72 61 78 67 84 73 L16 73 C22 67 28 61 28 47 C28 29 34 15 50 15 Z" relleno={T.mostaza} />
      <path d="M36 32 C38 26 42 22 46 21" stroke={T.crema} strokeWidth="3" strokeOpacity=".8" />
      <Pieza d="M50 74 C55 74 58 77 58 81 C58 85 55 88 50 88 C45 88 42 85 42 81 C42 77 45 74 50 74 Z" relleno={T.crema} grosor={3} />
    </>
  ),
  plato: () => (
    <>
      <Pieza d="M50 24 C66 24 77 36 77 52 C77 68 66 80 50 80 C34 80 23 68 23 52 C23 36 34 24 50 24 Z" relleno={T.crema} />
      <path d="M50 36 C59 36 65 43 65 52 C65 61 59 68 50 68 C41 68 35 61 35 52 C35 43 41 36 50 36 Z" stroke={T.ala} strokeWidth="3" />
      <path d="M8 22 L8 38 M12 22 L12 38 M16 22 L16 38 M8 38 C8 46 16 46 16 38 M12 44 L12 86" stroke={T.tinta} strokeWidth="3.5" />
      <path d="M86 20 C95 30 95 48 88 54 L88 86" stroke={T.tinta} strokeWidth="4.5" />
    </>
  ),
  pluma: () => (
    <>
      <Pieza d="M82 12 C58 14 28 44 24 76 C42 72 72 46 82 12 Z" relleno={T.menta} />
      <path d="M64 30 L52 26 M56 40 L44 36 M48 50 L36 48 M62 40 L66 50 M54 52 L58 60" stroke={T.ala} strokeWidth="3" />
      <path d="M86 8 L16 90" stroke={T.tinta} strokeWidth="4" />
    </>
  ),
  ticket: () => (
    <>
      <Pieza d="M12 30 L88 28 L88 44 C81 44 81 56 88 56 L88 72 L12 72 L12 56 C19 56 19 44 12 44 Z" relleno={T.mostaza} />
      <path d="M66 32 L66 68" stroke={T.tinta} strokeWidth="3" strokeDasharray="4 5" />
      <path d="M22 44 L54 43 M22 56 L46 56" stroke={T.tinta} strokeWidth="3.5" />
    </>
  ),
}

function IconoTinta({ nombre, className = '', semilla = 3, hervir = false }) {
  const ref = useRef(null)
  const id = useIdSvg(`icono-${nombre}`)
  useHervor(ref, hervir, 140)
  const Dibujo = DIBUJOS[nombre]
  if (!Dibujo) return null
  return (
    <svg ref={ref} className={`icono-tinta ${className}`.trim()} viewBox="0 0 100 100" overflow="visible" aria-hidden="true" focusable="false">
      <defs>
        <FiltroPulso id={id} escala={3.2} frecuencia={0.06} semilla={semilla} />
      </defs>
      <g filter={`url(#${id})`} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <Dibujo />
      </g>
    </svg>
  )
}

export default IconoTinta
