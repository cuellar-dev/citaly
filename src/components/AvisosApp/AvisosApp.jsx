import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CloudOff, Wifi } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useEnLinea } from '../../hooks/useEnLinea.js'
import { actualizacionPermitida, anotarActualizacion, puedeActualizarAhora } from '../../utils/momentoActualizar.js'
import './avisosApp.css'

/* Avisos de la app como tal (no de una página): van arriba, como AvisoBreve.

   1. Versión nueva: SIN aviso ni botón. El service worker (vite.config.js,
      registerType 'prompt') descarga la versión nueva en segundo plano y aquí
      se aplica sola, pero solo en un buen momento (utils/momentoActualizar.js:
      fuera de reservas, alta de local, sesión, perfil…, sin campo enfocado ni
      diálogo abierto):
        · al cambiar de pantalla (la página ya iba a cambiar),
        · al sacar la app a segundo plano,
        · al abrirla, si aún no se ha tocado nada.
      Si nada de eso ocurre, la versión nueva entra sola en la próxima visita.
   2. Sin conexión. Aparece al perder la red y, al volver, dice "Conexión
      recuperada" un momento. Hoy los datos son locales y todo sigue
      funcionando; con backend, aquí se dirá qué no se puede hacer sin red
      (ver docs/pwa.md). */

/* Cada cuánto se pregunta al servidor si hay versión nueva (con la app abierta). */
const REVISAR_CADA_MS = 60 * 60 * 1000
const RECUPERADA_MS = 2500

function AvisosApp() {
  const {
    needRefresh: [hayVersionNueva],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registro) {
      if (!registro) return
      window.setInterval(() => {
        if (navigator.onLine) registro.update().catch(() => {})
      }, REVISAR_CADA_MS)
    },
  })

  /* Aplicar la versión nueva en un buen momento (ver arriba). */
  const { pathname } = useLocation()
  const rutaAnterior = useRef(pathname)
  const huboToque = useRef(false)

  useEffect(() => {
    const marcar = () => {
      huboToque.current = true
    }
    const eventos = ['pointerdown', 'keydown', 'touchstart']
    eventos.forEach((e) => window.addEventListener(e, marcar, { once: true, passive: true }))
    return () => eventos.forEach((e) => window.removeEventListener(e, marcar))
  }, [])

  useEffect(() => {
    const cambioDePantalla = rutaAnterior.current !== pathname
    rutaAnterior.current = pathname
    if (!hayVersionNueva) return undefined

    const aplicar = () => {
      if (!puedeActualizarAhora(pathname, document) || !actualizacionPermitida()) return
      anotarActualizacion()
      updateServiceWorker(true)
    }
    if (cambioDePantalla || !huboToque.current) aplicar()

    const alOcultar = () => {
      if (document.visibilityState === 'hidden') aplicar()
    }
    document.addEventListener('visibilitychange', alOcultar)
    return () => document.removeEventListener('visibilitychange', alOcultar)
  }, [hayVersionNueva, pathname, updateServiceWorker])

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
    </div>,
    document.body,
  )
}

export default AvisosApp
