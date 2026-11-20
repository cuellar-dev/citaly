import { useState } from 'react'
import { LocateFixed } from 'lucide-react'
import { pedirUbicacion } from '../../services/ubicacion.js'
import talyAMano from '../Taly/taly-a-mano.svg'
import './llamadaCerca.css'

/* En el sitio de la fila "Cerca de ti" mientras no sabemos dónde estás. La
   ubicación se pide SOLO al tocar el botón (nunca al abrir la app) y se queda
   en este dispositivo (services/ubicacion.js). */

const ERRORES = {
  'sin-permiso': 'No nos diste permiso. Puedes activarlo en los ajustes del navegador.',
  'sin-gps': 'No pudimos saber dónde estás. Prueba otra vez en un momento.',
}

function LlamadaCerca({ titulo = 'Cerca de ti', taly }) {
  const [estado, setEstado] = useState('quieto') // quieto | buscando | error
  const [error, setError] = useState('')

  const activar = () => {
    setEstado('buscando')
    setError('')
    pedirUbicacion()
      .then(() => setEstado('quieto'))
      .catch((e) => {
        setEstado('error')
        setError(ERRORES[e.message] ?? ERRORES['sin-gps'])
      })
  }

  return (
    <section className="llamada-cerca" aria-labelledby="llamada-cerca-titulo">
      <img className="llamada-cerca-taly" src={talyAMano} alt="" aria-hidden="true" />
      <div className="llamada-cerca-textos">
        <h2 id="llamada-cerca-titulo">{titulo}</h2>
        <p>{taly ?? 'Te enseño lo que te queda más cerca.'} Tu ubicación no sale de este móvil.</p>
        {error ? (
          <p className="llamada-cerca-error" role="alert">
            {error}
          </p>
        ) : null}
        <button type="button" className="llamada-cerca-boton" onClick={activar} disabled={estado === 'buscando'}>
          <LocateFixed size={16} strokeWidth={2.4} aria-hidden="true" />
          {estado === 'buscando' ? 'Buscando…' : 'Ver lo que tengo cerca'}
        </button>
      </div>
    </section>
  )
}

export default LlamadaCerca
