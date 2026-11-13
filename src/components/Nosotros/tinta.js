import { createContext, useContext, useEffect, useId } from 'react'

/* Piezas compartidas del mundo a tinta de Sobre nosotros: la paleta de Taly,
   el filtro de pulso (el temblor de mano de taly-a-mano.svg) y el "hervor",
   que es ese temblor vivo de los dibujos animados a mano: la línea cambia
   de semilla unas ocho veces por segundo y parece que se está dibujando. */

export const TINTA = {
  menta: '#4fd8c4',
  ala: '#2aa795',
  alaOscura: '#1d8576',
  barriga: '#bdf4e8',
  puntada: '#8fe0d0',
  mostaza: '#ffd166',
  tinta: '#0e2e2a',
  crema: '#f2ebdd',
  fondo: '#121413',
}

/* useId de React trae caracteres que no valen en url(#id). */
export function useIdSvg(prefijo) {
  return `${prefijo}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
}

/* Modo ligero de Sobre nosotros: papel en vez de 3D y sin temblor vivo. */
export const ModoLigero = createContext(false)

/* Hervor de línea: rota la semilla del feTurbulence entre tres valores.
   Solo mientras el dibujo está en pantalla y nunca con movimiento reducido;
   un SVG con filtro repintándose fuera de vista es gasto puro. */
export function useHervor(svgRef, activo = true, ms = 125) {
  /* En modo ligero no hierve nada: decenas de filtros repintándose a 8 fps
     es justo lo que ese modo quiere ahorrarse. */
  const ligero = useContext(ModoLigero)
  useEffect(() => {
    const svg = svgRef.current
    if (!svg || !activo || ligero) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const turbs = svg.querySelectorAll('feTurbulence')
    if (!turbs.length) return undefined
    const bases = Array.from(turbs, (t) => Number(t.getAttribute('seed')) || 1)
    let n = 0
    let intervalo = null
    const tick = () => {
      n = (n + 1) % 3
      turbs.forEach((t, i) => t.setAttribute('seed', bases[i] + n * 11))
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !intervalo) intervalo = setInterval(tick, ms)
      if (!e.isIntersecting && intervalo) {
        clearInterval(intervalo)
        intervalo = null
      }
    })
    io.observe(svg)
    return () => {
      io.disconnect()
      if (intervalo) clearInterval(intervalo)
    }
  }, [svgRef, activo, ms, ligero])
}

