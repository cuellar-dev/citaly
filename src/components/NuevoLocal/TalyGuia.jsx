import { useEffect, useRef } from 'react'
import TalyPixel from '../Ayuda/TalyPixel.jsx'

/* Taly acompaña los formularios de crear y completar el local desde la
   barra de abajo, junto al botón de seguir. Habla en una nube:
     tono 'consejo' → una pista del paso (lápiz en alto y guiño)
     tono 'duda'    → algo que conviene pensar (cara pensativa)
     tono 'error'   → algo está mal escrito (de árbitro, con tarjeta roja; la nube tiembla)
     tono 'bien'    → paso hecho (orgulloso, con las llaves del local)
   El texto de error se anuncia a los lectores de pantalla; el resto, no,
   para no hablar encima de cada campo. */

const CARA = { consejo: 'apunte', duda: 'pregunta', error: 'tarjeta', bien: 'llave' }

function TalyGuia({ tono = 'consejo', children, id, vez = 0 }) {
  const nubeRef = useRef(null)

  /* `vez` cambia en cada intento fallido: aunque el mensaje sea el mismo,
     la nube vuelve a temblar para que se note que lo ha dicho otra vez. */
  useEffect(() => {
    if (tono !== 'error' || !vez) return
    const nube = nubeRef.current
    if (!nube?.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    nube.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-5px)' },
        { transform: 'translateX(4px)' },
        { transform: 'translateX(-3px)' },
        { transform: 'translateX(0)' },
      ],
      { duration: 320, easing: 'ease-out' },
    )
  }, [vez, tono])

  return (
    <div className={`taly-guia taly-guia--${tono}`}>
      <span className="taly-guia-taly" aria-hidden="true">
        <TalyPixel estado={CARA[tono] ?? 'apunte'} />
      </span>
      <div
        ref={nubeRef}
        id={id}
        className="taly-guia-nube"
        role={tono === 'error' ? 'alert' : undefined}
        key={tono === 'error' ? `e-${vez}` : 'n'}
      >
        {children}
      </div>
    </div>
  )
}

export default TalyGuia
