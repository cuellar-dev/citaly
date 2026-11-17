import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { sembrarDemoExtra, seedCitasIfEmpty } from './services/storage.js'
import { citasDemo } from './data/citasDemo.js'
import { suscripcionesDemo } from './data/suscripcionesDemo.js'

seedCitasIfEmpty(citasDemo())
sembrarDemoExtra(citasDemo(), suscripcionesDemo())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
