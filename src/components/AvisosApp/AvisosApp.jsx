import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CloudOff, RefreshCw, Wifi, X } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useEnLinea } from '../../hooks/useEnLinea.js'
import './avisosApp.css'

/* Avisos de la app como tal (no de una página): van arriba, como AvisoBreve.

   1. Versión nueva. El service worker (vite.config.js, registerType
      'prompt') descarga la versión nueva en segundo plano pero NO la
      activa: se pregunta. "Actualizar" la activa y recarga; "Luego" la deja
      para la próxima vez que se abra la app. Nunca se recarga sin avisar:
      alguien puede estar a mitad de una reserva.
   2. Sin conexión. Aparece al perder la red y, al volver, dice "Conexión
      recuperada" un momento. Hoy los datos son locales y todo sigue
      funcionando; con backend, aquí se dirá qué no se puede hacer sin red
      (ver docs/pwa.md). */

/* Cada cuánto se pregunta al servidor si hay versión nueva (con la app abierta). */
const REVISAR_CADA_MS = 60 * 60 * 1000
const RECUPERADA_MS = 2500

function AvisosApp() {
  const {
    needRefresh: [hayVersionNueva, setHayVersionNueva],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registro) {
      if (!registro) return
      window.setInterval(() => {
        if (navigator.onLine) registro.update().catch(() => {})
      }, REVISAR_CADA_MS)
    },
  })

  const enLinea = useEnLinea()
  const [recuperada, setRecuperada] = useState(false)
  const [estuvoSinRed, setEstuvoSinRed] = useState(!enLinea)
  if (!enLinea && !estuvoSinRed) setEstuvoSinRed(true)
  if (enLinea && estuvoSinRed) {
    setEstuvoSinRed(false)
    setRecuperada(true)
  }

  useEffect(() => {
    if (!recuperada) return undefined
    const id = window.setTimeout(() => setRecuperada(false), RECUPERADA_MS)
    return () => window.clearTimeout(id)
  }, [recuperada])

  return createPortal(
    <div className="avisos-app" role="status" aria-live="polite">
      {!enLinea ? (
        <div className="aviso-app aviso-app--sin-red" key="sin-red">
          <CloudOff size={16} aria-hidden="true" />
          <span>Sin conexión · lo que ya viste sigue aquí</span>
        </div>
      ) : recuperada ? (
        <div className="aviso-app" key="recuperada">
          <Wifi size={16} aria-hidden="true" />
          <span>Conexión recuperada</span>
        </div>
      ) : null}

      {hayVersionNueva ? (
        <div className="aviso-app aviso-app--version" key="version">
          <RefreshCw size={16} aria-hidden="true" />
          <span>Hay una versión nueva de Citaly</span>
          <button type="button" className="aviso-app-accion" onClick={() => updateServiceWorker(true)}>
            Actualizar
          </button>
          <button
            type="button"
            className="aviso-app-cerrar"
            onClick={() => setHayVersionNueva(false)}
            aria-label="Actualizar luego"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>,
    document.body,
  )
}

export default AvisosApp
