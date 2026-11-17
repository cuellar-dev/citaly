import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import TalyPixel from './TalyPixel.jsx'
import './llamadaOpinion.css'

/* Citaly está empezando y lo que más falta es saber qué piensa la gente.
   Esta tarjeta lleva a la página de Opinión desde el final de Descubre y
   desde arriba de las preguntas frecuentes.

   Con `to` es un enlace; con `onClick`, un botón (en la misma página). */
function LlamadaOpinion({ to = '/opinion', onClick, compacta = false }) {
  const contenido = (
    <>
      <span className="llamada-opinion-taly" aria-hidden="true">
        <TalyPixel estado="sugerencia" />
      </span>
      <span className="llamada-opinion-textos">
        <span className="llamada-opinion-sello">Versión temprana</span>
        <strong>Citaly está en pañales</strong>
        <span>{compacta ? 'Dinos qué le falta o qué te molesta.' : 'Dinos qué le falta, qué te gustó o qué te molesta. Lo leemos todo y decide lo próximo que hacemos.'}</span>
      </span>
      <span className="llamada-opinion-boton">
        Opinar
        <ArrowRight size={16} strokeWidth={2.6} aria-hidden="true" />
      </span>
    </>
  )

  const clase = `llamada-opinion${compacta ? ' llamada-opinion--compacta' : ''}`
  return onClick ? (
    <button type="button" className={clase} onClick={onClick}>
      {contenido}
    </button>
  ) : (
    <Link to={to} className={clase}>
      {contenido}
    </Link>
  )
}

export default LlamadaOpinion
