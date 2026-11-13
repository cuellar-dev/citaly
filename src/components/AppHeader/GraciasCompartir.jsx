import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import Taly from '../Taly/Taly.jsx'
import './graciasCompartir.css'

/* Notita de papel que sale al volver del menú de compartir: Taly canta las
   gracias y la nota se va sola a los 10 s.

   Como en el aviso de deshacer, el reloj es la animación de la línea de
   abajo: si la pestaña se oculta o el ratón está encima, se pausa ella y se
   pausa el tiempo. */

export const SEGUNDOS_GRACIAS = 10

function GraciasCompartir({ copiado = false, onFin }) {
  const [oculta, setOculta] = useState(() => document.hidden)
  const [encima, setEncima] = useState(false)

  useEffect(() => {
    const alCambiar = () => setOculta(document.hidden)
    document.addEventListener('visibilitychange', alCambiar)
    return () => document.removeEventListener('visibilitychange', alCambiar)
  }, [])

  return createPortal(
    <div
      className="gracias-compartir"
      role="status"
      onPointerEnter={(e) => e.pointerType === 'mouse' && setEncima(true)}
      onPointerLeave={() => setEncima(false)}
    >
      <span className="gracias-compartir-taly" aria-hidden="true">
        <Taly escena="recordatorio" tamano={30} encuadre="compacto" />
      </span>

      <div className="gracias-compartir-textos">
        <p className="gracias-compartir-titulo">¡Gracias por compartir Citaly!</p>
        <p className="gracias-compartir-detalle">
          {copiado
            ? 'Enlace copiado. Pégalo donde quieras.'
            : 'Cada persona que llega hace Citaly un poco más grande.'}
        </p>
      </div>

      <button type="button" className="gracias-compartir-cerrar" onClick={onFin} aria-label="Cerrar">
        <X size={16} strokeWidth={2.4} aria-hidden="true" />
      </button>

      <span
        className="gracias-compartir-tiempo"
        aria-hidden="true"
        style={{
          animationDuration: `${SEGUNDOS_GRACIAS}s`,
          animationPlayState: oculta || encima ? 'paused' : 'running',
        }}
        onAnimationEnd={onFin}
      />
    </div>,
    document.body,
  )
}

export default GraciasCompartir
