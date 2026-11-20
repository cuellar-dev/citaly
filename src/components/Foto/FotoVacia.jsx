import { useEffect } from 'react'
import { ImageOff } from 'lucide-react'
import './foto.css'

/* Lo que se ve en el hueco de una foto cuando el local NO tiene ninguna.

   No es un esqueleto: el esqueleto brilla porque la foto está en camino, y
   aquí no va a llegar nada. Un fondo quieto con un icono dice "no hay foto".

   `alListo` se llama una vez al montar, igual que en <Foto>: así la cola de
   Descubre (colaFotos.js) no se queda esperando una foto que no existe. */

function FotoVacia({ alListo, tamano = 26 }) {
  useEffect(() => {
    alListo?.()
    // Solo al montar: es una sola vez por tarjeta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <span className="foto-vacia" role="img" aria-label="Este local aún no tiene fotos">
      <ImageOff size={tamano} strokeWidth={1.7} aria-hidden="true" />
    </span>
  )
}

export default FotoVacia
