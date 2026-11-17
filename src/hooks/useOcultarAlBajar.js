import { useEffect, useState } from 'react'

/* Como la barra de direcciones del navegador en el móvil: al bajar se
   esconde, al subir vuelve. Arriba del todo siempre se ve. `fijo` la deja
   visible (por ejemplo, mientras se escribe o hay sugerencias abiertas). */

const UMBRAL = 8 // px de recorrido antes de decidir: evita parpadeos con el temblor del dedo
const ZONA_ARRIBA = 96 // px desde arriba donde nunca se esconde

export function useOcultarAlBajar({ fijo = false } = {}) {
  const [oculto, setOculto] = useState(false)

  useEffect(() => {
    if (fijo) return undefined
    let ultimo = window.scrollY
    let pendiente = false

    const revisar = () => {
      pendiente = false
      const y = window.scrollY
      if (y <= ZONA_ARRIBA) {
        setOculto(false)
        ultimo = y
        return
      }
      const delta = y - ultimo
      if (Math.abs(delta) < UMBRAL) return
      setOculto(delta > 0)
      ultimo = y
    }

    const alScroll = () => {
      if (pendiente) return
      pendiente = true
      requestAnimationFrame(revisar)
    }

    window.addEventListener('scroll', alScroll, { passive: true })
    return () => window.removeEventListener('scroll', alScroll)
  }, [fijo])

  return oculto && !fijo
}
