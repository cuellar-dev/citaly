import { useEffect, useRef } from 'react'

/**
 * Scroll infinito: avisa cuando la persona se acerca al final de la lista
 * para que se pinte (o se pida) el siguiente trozo.
 *
 * Devuelve una ref para un elemento "centinela" que se pone DESPUÉS del
 * último elemento. Cuando el centinela entra en el margen (por defecto,
 * 800 px antes de verse), se llama a `alLlegar`.
 *
 * - `hayMas`: si es false, no se observa nada (se acabó la lista).
 * - `cargando`: mientras es true no se vuelve a pedir (para cuando el
 *   siguiente trozo venga del servidor y tarde).
 * - `clave`: cambia cada vez que llega un trozo (p. ej. cuántos hay). Hace
 *   falta porque IntersectionObserver solo avisa al CAMBIAR de estado: si
 *   tras pintar el trozo nuevo el centinela sigue dentro del margen (pantalla
 *   alta, trozo corto), sin volver a observar no llegaría el siguiente aviso.
 *
 * Hoy Descubre tiene todos los datos en memoria y solo dosifica lo que
 * pinta. Con backend, `alLlegar` pedirá la página siguiente del feed: ver
 * docs/pendientes-backend.md, "Descubre: feed paginado".
 */
export function useScrollInfinito({ hayMas, cargando = false, alLlegar, clave, margen = '800px' }) {
  const centinelaRef = useRef(null)
  const alLlegarRef = useRef(alLlegar)

  useEffect(() => {
    alLlegarRef.current = alLlegar
  }, [alLlegar])

  useEffect(() => {
    const nodo = centinelaRef.current
    if (!nodo || !hayMas || cargando) return undefined

    /* Sin IntersectionObserver (navegadores muy viejos): se pinta todo. */
    if (typeof IntersectionObserver === 'undefined') {
      alLlegarRef.current?.()
      return undefined
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) alLlegarRef.current?.()
      },
      { rootMargin: `0px 0px ${margen} 0px` },
    )
    observador.observe(nodo)
    return () => observador.disconnect()
  }, [hayMas, cargando, clave, margen])

  return centinelaRef
}
