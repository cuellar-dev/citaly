import { useEffect, useRef } from 'react'
import { crearEscena } from './escenaFogata.js'

/* El lienzo de la escena. Todo el dibujo y la animación viven en
   escenaFogata.js; aquí solo se monta, se desmonta y se avisa cuando la
   hoguera termina de prender (para que aparezca la frase). */
function EscenaFogata({ onEncendida }) {
  const lienzoRef = useRef(null)
  const avisoRef = useRef(onEncendida)

  useEffect(() => {
    avisoRef.current = onEncendida
  }, [onEncendida])

  useEffect(() => {
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const escena = crearEscena(lienzoRef.current, {
      reducido,
      alEncender: () => avisoRef.current?.(),
    })
    return () => escena.destruir()
  }, [])

  return <canvas ref={lienzoRef} className="pie-lienzo" aria-hidden="true" />
}

export default EscenaFogata
