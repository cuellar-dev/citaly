import { useEffect, useRef } from 'react'
import gsap from 'gsap'

/* Arrastrar una hoja inferior hacia abajo para cerrarla, como en las apps.
   El gesto empieza en cualquier elemento con `data-arrastre` dentro de la
   hoja (el asa y la cabecera). La hoja sigue al dedo 1:1; hacia arriba se
   resiste. Al soltar se cierra si bajó lo bastante o si se lanzó rápido; si
   no, vuelve a su sitio.

   - hojaRef: la hoja que se mueve.
   - veloRef: (opcional) el oscurecido, que se aclara según se baja.
   - animarSalida: si la hoja no tiene animación de salida propia, el hook la
     saca de pantalla antes de llamar a onCerrar. */

const ARRANQUE = 6 // px antes de decidir que es un arrastre y no un toque
const CIERRE = 0.28 // fracción de la altura que basta para cerrar
const LANZAMIENTO = 0.55 // px/ms hacia abajo que cierran aunque se baje poco

export function useArrastrarParaCerrar({ hojaRef, veloRef, onCerrar, activo = true, animarSalida = false }) {
  const onCerrarRef = useRef(onCerrar)
  useEffect(() => {
    onCerrarRef.current = onCerrar
  })

  useEffect(() => {
    const hoja = hojaRef.current
    if (!activo || !hoja) return undefined

    let gesto = null

    const mover = (dy) => {
      /* Hacia arriba no se va: cede un poco y frena. */
      const y = dy >= 0 ? dy : -Math.sqrt(-dy) * 2
      gsap.set(hoja, { y })
      if (veloRef?.current) {
        gsap.set(veloRef.current, { opacity: 1 - Math.min(1, Math.max(0, y) / hoja.offsetHeight) * 0.85 })
      }
    }

    const alBajar = (e) => {
      if (e.button > 0 || !e.isPrimary) return
      if (!e.target.closest('[data-arrastre]')) return
      gsap.killTweensOf(hoja, 'y')
      gesto = {
        id: e.pointerId,
        inicio: e.clientY,
        dy: 0,
        arrastrando: false,
        muestras: [{ y: e.clientY, t: e.timeStamp }],
      }
    }

    const alMover = (e) => {
      if (!gesto || e.pointerId !== gesto.id) return
      const dy = e.clientY - gesto.inicio
      if (!gesto.arrastrando) {
        if (Math.abs(dy) < ARRANQUE) return
        gesto.arrastrando = true
        gesto.inicio = e.clientY - Math.sign(dy) * ARRANQUE
        hoja.setPointerCapture?.(e.pointerId)
        hoja.classList.add('hoja--arrastrando')
      }
      gesto.dy = e.clientY - gesto.inicio
      gesto.muestras.push({ y: e.clientY, t: e.timeStamp })
      if (gesto.muestras.length > 5) gesto.muestras.shift()
      mover(gesto.dy)
    }

    const alSoltar = (e) => {
      if (!gesto || e.pointerId !== gesto.id) return
      const { arrastrando, dy, muestras } = gesto
      gesto = null
      if (!arrastrando) return
      hoja.classList.remove('hoja--arrastrando')

      /* Que el soltar no cuente como toque en la X o en otro botón. */
      const tragarClick = (ev) => {
        ev.stopPropagation()
        ev.preventDefault()
      }
      window.addEventListener('click', tragarClick, { capture: true, once: true })
      setTimeout(() => window.removeEventListener('click', tragarClick, { capture: true }), 0)

      const a = muestras[0]
      const b = muestras[muestras.length - 1]
      const velocidad = b.t > a.t ? (b.y - a.y) / (b.t - a.t) : 0
      const cierra = e.type !== 'pointercancel' && (dy > hoja.offsetHeight * CIERRE || (dy > 20 && velocidad > LANZAMIENTO))

      if (!cierra) {
        gsap.to(hoja, { y: 0, duration: 0.36, ease: 'power3.out' })
        if (veloRef?.current) gsap.to(veloRef.current, { opacity: 1, duration: 0.25 })
        return
      }

      if (!animarSalida) {
        onCerrarRef.current?.()
        return
      }
      /* Sale con la velocidad que llevaba el dedo, no con una duración fija. */
      const resto = hoja.offsetHeight - dy
      const duracion = Math.min(0.32, Math.max(0.14, resto / Math.max(velocidad, 1.2) / 1000))
      gsap.to(hoja, {
        y: hoja.offsetHeight + 24,
        duration: duracion,
        ease: 'power1.out',
        onComplete: () => onCerrarRef.current?.(),
      })
    }

    hoja.addEventListener('pointerdown', alBajar)
    hoja.addEventListener('pointermove', alMover)
    hoja.addEventListener('pointerup', alSoltar)
    hoja.addEventListener('pointercancel', alSoltar)
    return () => {
      hoja.removeEventListener('pointerdown', alBajar)
      hoja.removeEventListener('pointermove', alMover)
      hoja.removeEventListener('pointerup', alSoltar)
      hoja.removeEventListener('pointercancel', alSoltar)
    }
  }, [hojaRef, veloRef, activo, animarSalida])
}
