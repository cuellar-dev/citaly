import { useCallback, useEffect, useRef } from 'react'
import { admiteCors, fotoSrcSet, fotoUrl } from '../../utils/fotos.js'
import './foto.css'

/* <img> con lo que toda foto de la app necesita:

   - Tamaño justo: con `anchos` + `sizes` el navegador elige del srcset; con
     `ancho` se pide una sola versión. Si el proveedor no sabe de tamaños
     (fotos subidas, data:), se usa la URL tal cual.
   - Prioridad: `prioridad` solo para LA foto grande de arriba (la que mide
     Lighthouse como LCP): eager + fetchpriority=high. El resto, lazy.
   - Esqueleto: mientras carga, el contenedor con clase .foto-marco brilla;
     la foto entra con un fundido. data-estado="lista" | "error" lo pone el
     propio <img>, sin re-render de React.
   - CORS: a los hosts que lo admiten se les pide sin cookies (ver fotos.js).
   - `alListo`: se llama UNA vez cuando la foto termina (cargada o con error),
     también si ya estaba en caché. Lo usa la cola de Descubre (colaFotos.js). */

function marcar(img, estado) {
  if (img && img.dataset.estado !== estado) img.dataset.estado = estado
}

/* Avisa a quien espera esta foto, una sola vez por elemento. */
function avisarUnaVez(img, alListo) {
  if (!img || img.dataset.avisada) return
  img.dataset.avisada = ''
  alListo?.()
}

function Foto({
  src,
  alt = '',
  ancho,
  anchos,
  sizes,
  proporcion,
  calidad,
  caras = false,
  prioridad = false,
  /* 'eager' para fotos fuera de pantalla que se quieren ya, sin prioridad
     alta (p. ej. la siguiente diapositiva de un carrusel: está recortada por
     overflow y con lazy no se pediría hasta verse). */
  carga = 'lazy',
  className = '',
  onLoad,
  onError,
  alListo,
  ...resto
}) {
  const alListoRef = useRef(alListo)
  useEffect(() => {
    alListoRef.current = alListo
  })

  /* Si la foto ya estaba en caché, `load` pudo dispararse antes de que React
     enganchara el evento: se mira al montar. */
  const alMontar = useCallback((img) => {
    if (!img?.complete) return
    marcar(img, img.naturalWidth > 0 ? 'lista' : 'error')
    avisarUnaVez(img, alListoRef.current)
  }, [])

  if (!src) return null

  const srcSet = anchos ? fotoSrcSet(src, anchos, { calidad, proporcion, caras }) : undefined
  const url = ancho ? fotoUrl(src, { ancho, alto: proporcion ? ancho * proporcion : undefined, calidad, caras }) : src

  return (
    <img
      ref={alMontar}
      src={url}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      loading={prioridad ? 'eager' : carga}
      /* Las demás, baja: que no le quiten ancho de banda a la principal (el
         navegador sube por su cuenta las primeras fotos que ve en pantalla). */
      fetchPriority={prioridad ? 'high' : 'low'}
      decoding="async"
      crossOrigin={admiteCors(src) ? 'anonymous' : undefined}
      className={`foto ${className}`.trim()}
      onLoad={(e) => {
        marcar(e.currentTarget, 'lista')
        avisarUnaVez(e.currentTarget, alListoRef.current)
        onLoad?.(e)
      }}
      onError={(e) => {
        marcar(e.currentTarget, 'error')
        avisarUnaVez(e.currentTarget, alListoRef.current)
        onError?.(e)
      }}
      {...resto}
    />
  )
}

export default Foto
