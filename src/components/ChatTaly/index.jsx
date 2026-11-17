/* Chat con Taly (PROTOTIPO).
   Solo aparece si existe VITE_CHAT_TALY_URL (en .env.local, que no se sube).
   Sin esa variable no se renderiza nada y Vite ni siquiera incluye el chat en el build.

   Para quitarlo del todo: borrar esta carpeta y las dos líneas marcadas en src/layout/Layout.jsx. */
import { Suspense, lazy } from 'react'

const URL_CHAT = import.meta.env.VITE_CHAT_TALY_URL
const Chat = URL_CHAT ? lazy(() => import('./ChatTaly.jsx')) : null

export default function ChatTaly() {
  if (!Chat) return null
  return (
    <Suspense fallback={null}>
      <Chat url={URL_CHAT.replace(/\/$/, '')} />
    </Suspense>
  )
}
