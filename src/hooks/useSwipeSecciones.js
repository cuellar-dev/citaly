import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/* Deslizar en horizontal cambia de pestaña, como en Instagram.

   Solo con el dedo (el ratón arrastra para seleccionar texto) y solo en las
   cuatro pestañas de la barra. No se activa si el gesto empieza:
   - en algo que ya se mueve en horizontal por sí mismo (carruseles, filtros,
     el selector de fecha…), detectado por su scroll real, no por una lista;
   - en algo marcado con data-sin-swipe (filas que se deslizan para borrar);
   - en campos de texto, o con un modal abierto;
   - pegado a los bordes, que en iOS son el gesto de "atrás" del sistema.

   Mientras el dedo arrastra, la página se asoma un poco hacia ese lado (con
   freno, no 1:1: es una pista, no un carrusel). Al soltar, si se pasó del
   umbral o fue un gesto rápido, cambia de pestaña. */

export const SECCIONES = ['/', '/citas', '/negocio', '/perfil']

const BORDE = 24
const ZONA_MUERTA = 10
const UMBRAL = 0.22
const VELOCIDAD = 0.45
const MIN_RAPIDO = 48
const FRENO = 0.32

function bloqueado(objetivo, raiz) {
  /* Con un modal abierto el gesto es suyo (cerrar, arrastrar la hoja…). */
  if (document.body.style.overflow === 'hidden') return true
  if (document.querySelector('[aria-modal="true"], [role="dialog"]')) return true
  for (let el = objetivo; el && el !== raiz && el !== document.body; el = el.parentElement) {
    if (el.matches('[data-sin-swipe], input, textarea, select, [contenteditable="true"]')) return true
    const estilo = getComputedStyle(el)
    if (estilo.position === 'fixed') return true
    const desborda = el.scrollWidth > el.clientWidth + 1
    if (desborda && /(auto|scroll)/.test(estilo.overflowX)) return true
  }
  return false
}

export function useSwipeSecciones(raizRef, paginaRef) {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const raiz = raizRef.current
    const indice = SECCIONES.indexOf(pathname)
    if (!raiz || indice === -1) return undefined

    let g = null

    const pagina = () => paginaRef.current
    const soltarPagina = (animar) => {
      const p = pagina()
      if (!p) return
      p.style.transition = animar ? 'transform 0.22s var(--ease-out), opacity 0.22s var(--ease-out)' : ''
      p.style.transform = ''
      p.style.opacity = ''
    }

    const alTocar = (e) => {
      g = null
      if (e.touches.length !== 1) return
      const t = e.touches[0]
      if (t.clientX < BORDE || t.clientX > window.innerWidth - BORDE) return
      if (bloqueado(e.target, raiz)) return
      g = { x: t.clientX, y: t.clientY, t: performance.now(), eje: null, dx: 0 }
    }

    const alMover = (e) => {
      if (!g) return
      const t = e.touches[0]
      const dx = t.clientX - g.x
      const dy = t.clientY - g.y

      if (!g.eje) {
        if (Math.abs(dx) < ZONA_MUERTA && Math.abs(dy) < ZONA_MUERTA) return
        /* Hace falta que sea claramente horizontal: un scroll un poco torcido
           no debe cambiarte de pestaña. */
        if (Math.abs(dx) > Math.abs(dy) * 1.4) {
          g.eje = 'x'
          g.x = t.clientX
          g.t = performance.now()
          const p = pagina()
          if (p) p.style.transition = 'none'
        } else {
          g = null
          return
        }
      }

      /* Con el eje decidido, el scroll vertical se queda quieto. */
      e.preventDefault()
      g.dx = t.clientX - g.x
      const destino = indice + (g.dx < 0 ? 1 : -1)
      const hayDestino = destino >= 0 && destino < SECCIONES.length
      /* Sin pestaña a ese lado, el freno es mucho mayor: se nota la pared. */
      const x = hayDestino ? g.dx * FRENO : Math.sign(g.dx) * Math.sqrt(Math.abs(g.dx)) * 2
      const p = pagina()
      if (p) {
        p.style.transform = `translateX(${x}px)`
        p.style.opacity = String(1 - Math.min(Math.abs(x) / window.innerWidth, 0.3))
      }
    }

    const alSoltar = () => {
      if (!g || g.eje !== 'x') {
        g = null
        return
      }
      const { dx } = g
      const tiempo = Math.max(performance.now() - g.t, 1)
      g = null
      const destino = indice + (dx < 0 ? 1 : -1)
      const rapido = Math.abs(dx) > MIN_RAPIDO && Math.abs(dx) / tiempo > VELOCIDAD
      if (destino >= 0 && destino < SECCIONES.length && (Math.abs(dx) > window.innerWidth * UMBRAL || rapido)) {
        /* La página vieja NO se devuelve a su sitio: se queda desplazada y
           medio apagada hasta que React la quita. Si se limpiara aquí, se
           vería entera un frame antes de que llegue la nueva (el parpadeo).
           La nueva es otro elemento (key por ruta) y entra limpia. */
        navigate(SECCIONES[destino])
        return
      }
      soltarPagina(true)
    }

    const alCancelar = () => {
      if (g?.eje === 'x') soltarPagina(true)
      g = null
    }

    raiz.addEventListener('touchstart', alTocar, { passive: true })
    raiz.addEventListener('touchmove', alMover, { passive: false })
    raiz.addEventListener('touchend', alSoltar)
    raiz.addEventListener('touchcancel', alCancelar)
    return () => {
      raiz.removeEventListener('touchstart', alTocar)
      raiz.removeEventListener('touchmove', alMover)
      raiz.removeEventListener('touchend', alSoltar)
      raiz.removeEventListener('touchcancel', alCancelar)
    }
  }, [pathname, navigate, raizRef, paginaRef])
}
