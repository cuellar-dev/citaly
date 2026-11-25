import { useEffect, useState } from 'react'
import { Bell, BellRing } from 'lucide-react'
import {
  AVISOS_APERTURA_EVENTO,
  pedirAvisoApertura,
  quitarAvisoApertura,
  tieneAvisoApertura,
} from '../../services/avisosApertura.js'

/* Junto al «Cerrado» de la ficha: «Avísame cuando abra». Al tocarlo se
   apunta y cambia a «Te avisaremos»; otro toque lo quita. El aviso llega a
   Notificaciones a la hora de apertura (de momento, en este navegador). */
function BotonAvisoApertura({ local }) {
  const [activo, setActivo] = useState(() => tieneAvisoApertura(local.id))

  useEffect(() => {
    const repintar = () => setActivo(tieneAvisoApertura(local.id))
    repintar()
    window.addEventListener(AVISOS_APERTURA_EVENTO, repintar)
    return () => window.removeEventListener(AVISOS_APERTURA_EVENTO, repintar)
  }, [local.id])

  const alternar = () => {
    if (activo) quitarAvisoApertura(local.id)
    else pedirAvisoApertura(local)
  }

  const Icono = activo ? BellRing : Bell
  return (
    <button
      type="button"
      className={`local-hero-avisame${activo ? ' local-hero-avisame--activo' : ''}`}
      aria-pressed={activo}
      aria-label={activo ? 'Te avisaremos cuando abra. Tocar para quitar el aviso' : 'Avísame cuando abra'}
      onClick={alternar}
    >
      <Icono size={13} strokeWidth={2.4} aria-hidden="true" />
      <span aria-live="polite">{activo ? 'Te avisaremos' : 'Avísame'}</span>
    </button>
  )
}

export default BotonAvisoApertura
