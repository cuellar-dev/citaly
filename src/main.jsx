import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { seedCitasIfEmpty } from './services/storage.js'
import { citasDemo } from './data/citasDemo.js'

seedCitasIfEmpty(citasDemo())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
