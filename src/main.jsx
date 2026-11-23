import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { sembrarDemoExtra, seedCitasIfEmpty } from './services/storage.js'
import { citasDemo } from './data/citasDemo.js'
import { suscripcionesDemo } from './data/suscripcionesDemo.js'
import { recargarUnaVez } from './utils/recarga.js'
import { hayApi } from './services/api.js'

/* DEMO: siembra citas de ejemplo en localStorage. Con backend no: las citas
   de mentira se mezclarían con las de una cuenta de verdad. */
if (!hayApi) {
  seedCitasIfEmpty(citasDemo())
  sembrarDemoExtra(citasDemo(), suscripcionesDemo())
}

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
