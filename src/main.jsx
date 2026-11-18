import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { sembrarDemoExtra, seedCitasIfEmpty } from './services/storage.js'
import { citasDemo } from './data/citasDemo.js'
import { suscripcionesDemo } from './data/suscripcionesDemo.js'
import { recargarUnaVez } from './utils/recarga.js'

/* DEMO: siembra citas de ejemplo en localStorage. Se va con el backend
   (ver docs/pendientes-backend.md, "Datos de demo"). */
seedCitasIfEmpty(citasDemo())
sembrarDemoExtra(citasDemo(), suscripcionesDemo())

/* Vite avisa con este evento cuando no puede bajar el trozo de una página
   (típico tras un deploy: la pestaña abierta busca un archivo que ya no
   existe). Una recarga trae la versión nueva. Si ya se recargó una vez en
   esta sesión, se deja seguir y lo recoge ErrorPagina con un aviso. */
window.addEventListener('vite:preloadError', (event) => {
  if (navigator.onLine === false) return
  if (recargarUnaVez()) event.preventDefault()
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
