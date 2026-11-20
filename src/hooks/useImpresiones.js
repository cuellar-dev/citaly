import { useEffect, useRef } from 'react'
import { enviarPendientes, getImpresiones, registrarEventos } from '../services/impresiones.js'

/* Registra qué tarjetas de Descubre se ven y cuáles se tocan.

   UN solo IntersectionObserver para toda la página (no uno por tarjeta). Cada
   tarjeta se marca con atributosImpresion(): data-imp-local, -bloque, -pos.
   Cuenta como vista si está al menos al 50 % en pantalla durante 1 segundo:
   pasar volando con el scroll no es haberla visto. Cada tarjeta cuenta una
   vez por visita a Descubre.

   Los eventos se juntan y se guardan de golpe cada pocos segundos y al salir
   de la pestaña, no uno a uno. */

const UMBRAL = 0.5
const TIEMPO_VISTA_MS = 1000
const CADA_MS = 4000
/* Con backend: se manda en cuanto se juntan estos, o al salir de la página. */
const ENVIAR_A_PARTIR_DE = 20

/** Atributos para la raíz de una tarjeta. `imp` = { bloque, posicion } o nada. */
export function atributosImpresion(id, imp) {
  if (!imp) return {}
  return { 'data-imp-local': id, 'data-imp-bloque': imp.bloque, 'data-imp-pos': imp.posicion }
}

const datosDe = (el) => ({
  localId: el.dataset.impLocal,
  bloque: el.dataset.impBloque,
  posicion: Number(el.dataset.impPos),
})

/** `clave` cambia cuando entran tarjetas nuevas (scroll infinito): se re-observa.
    `semilla` (la del día) viaja con cada evento para poder analizar el orden. */
export function useImpresiones(raizRef, clave, { semilla } = {}) {
  /* Lo ya contado en esta visita a Descubre. Vive fuera del efecto: el efecto
     se rehace cada vez que el scroll infinito trae tarjetas nuevas y, con el
     Set dentro, volvía a contar como vistas nuevas las que ya estaban en
     pantalla. */
  const vistasRef = useRef(new Set())
  useEffect(() => {
    const raiz = raizRef.current
    if (!raiz || typeof IntersectionObserver === 'undefined') return undefined

    const cola = []
    const vistas = vistasRef.current
    const relojes = new Map()
    const vaciar = () => {
      registrarEventos(cola.splice(0))
      if (getImpresiones().filter((e) => !e.enviado).length >= ENVIAR_A_PARTIR_DE) enviarPendientes()
    }
    /* Lo que quedó sin mandar de la visita anterior. */
    enviarPendientes()

    const observer = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          const el = entrada.target
          const datos = datosDe(el)
          const llave = `${datos.bloque}|${datos.localId}`
          if (vistas.has(llave)) continue
          if (entrada.isIntersecting && entrada.intersectionRatio >= UMBRAL) {
            if (relojes.has(el)) continue
            relojes.set(
              el,
              window.setTimeout(() => {
                relojes.delete(el)
                vistas.add(llave)
                cola.push({ tipo: 'vista', semilla, ...datos })
                observer.unobserve(el)
              }, TIEMPO_VISTA_MS),
            )
          } else if (relojes.has(el)) {
            window.clearTimeout(relojes.get(el))
            relojes.delete(el)
          }
        }
      },
      { threshold: [0, UMBRAL] },
    )

    raiz.querySelectorAll('[data-imp-local]').forEach((el) => observer.observe(el))

    const alTocar = (evento) => {
      const el = evento.target.closest?.('[data-imp-local]')
      if (el && raiz.contains(el)) cola.push({ tipo: 'toque', semilla, ...datosDe(el) })
      vaciar()
    }
    const alOcultar = () => {
      if (document.visibilityState !== 'hidden') return
      vaciar()
      enviarPendientes()
    }

    raiz.addEventListener('click', alTocar)
    document.addEventListener('visibilitychange', alOcultar)
    const intervalo = window.setInterval(vaciar, CADA_MS)

    return () => {
      observer.disconnect()
      relojes.forEach((id) => window.clearTimeout(id))
      raiz.removeEventListener('click', alTocar)
      document.removeEventListener('visibilitychange', alOcultar)
      window.clearInterval(intervalo)
      vaciar()
      enviarPendientes()
    }
  }, [raizRef, clave, semilla])
}
