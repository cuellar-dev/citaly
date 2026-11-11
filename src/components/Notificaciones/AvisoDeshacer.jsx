import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import './avisoDeshacer.css'

/* "Borraste tal aviso · Deshacer", con una línea que se consume en 10 s.

   El reloj es la propia animación de la línea: cuando termina, el aviso se
   va. Así pausarla es pausar el tiempo, sin setTimeout que cuadrar:
   - si la pestaña se oculta, se para (nadie lo está viendo);
   - con ratón encima, también, para que dé tiempo a leer y pulsar. */

export const SEGUNDOS_DESHACER = 10

function AvisoDeshacer({ noti, onDeshacer, onFin }) {
  const [oculta, setOculta] = useState(() => document.hidden)
  const [encima, setEncima] = useState(false)

  useEffect(() => {
    const alCambiar = () => setOculta(document.hidden)
    document.addEventListener('visibilitychange', alCambiar)
    return () => document.removeEventListener('visibilitychange', alCambiar)
  }, [])

  const pausado = oculta || encima

  return createPortal(
    <div
      className="aviso-deshacer"
      role="status"
      onPointerEnter={(e) => e.pointerType === 'mouse' && setEncima(true)}
      onPointerLeave={() => setEncima(false)}
    >
      <p className="aviso-deshacer-texto">
        Borraste <strong>{noti.titulo}</strong>
      </p>
      <button type="button" className="aviso-deshacer-boton" onClick={onDeshacer}>
        Deshacer
      </button>
      <span
        className="aviso-deshacer-tiempo"
        aria-hidden="true"
        style={{
          animationDuration: `${SEGUNDOS_DESHACER}s`,
          animationPlayState: pausado ? 'paused' : 'running',
        }}
        onAnimationEnd={onFin}
      />
    </div>,
    document.body,
  )
}

export default AvisoDeshacer
