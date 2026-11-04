import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Home } from 'lucide-react'
import taly404 from '../components/Taly/taly-404-animado.svg'
import './NotFound.css'

function NotFound() {
  const navigate = useNavigate()

  return (
    <section className="not-found" aria-labelledby="not-found-titulo">
      <div className="not-found-ilustracion">
        <img src={taly404} alt="Taly buscando una página perdida" />
      </div>
      <div className="not-found-contenido">
        <span className="not-found-codigo">404</span>
        <h1 id="not-found-titulo">Esta página se perdió</h1>
        <p>El enlace que buscas no existe o ya cambió de lugar.</p>
        <Link to="/" className="not-found-boton">
          <Home size={18} aria-hidden="true" />
          Volver a Descubre
        </Link>
        <button type="button" className="not-found-volver" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} aria-hidden="true" />
          Volver atrás
        </button>
      </div>
    </section>
  )
}

export default NotFound
