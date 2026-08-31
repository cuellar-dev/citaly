import { Link } from 'react-router-dom'
import './tarjetalocal.css'

import { Clock, Star } from 'lucide-react'

function TarjetaLocal({ id, localName, categoria, metros, url, horario, points, close, direccion }) {
  const rating = Math.min(5, Math.max(0, Number(points) || 0))
  let fillPercent = (rating / 5) * 100
  if (rating >= 4 && rating <= 5) {
    fillPercent =85 
  }
  if(rating <= 3.5) {
    fillPercent += 10
  }
  const horarioClassName = close ? 'horario-close' : 'horario-open'
  const clockColor = close ? 'var(--close-color)' : 'var(--fonts-color-primary-alternative)'
  return (
    <Link to={`/local/${id}`} className="tarjeta-link">
      <article className="tarjeta">
        <div
          className="img-container"
          style={{
            backgroundImage: `
              linear-gradient(to top, rgba(0, 0, 0, 0.99) 0%, transparent 55%),
              url(${url})
            `,
          }}
        >
          <div className="points-container">
            <p className="points">{points}</p>
            <div className="star-rating">
              <div className="star-fill" style={{ width: `${fillPercent}%` }}>
                <Star size={20} strokeWidth={1} className="icono-estrella-rellena" />
              </div>
              <Star size={20} strokeWidth={1} className="icono-estrella-vacia" />
            </div>
          </div>
          <h2>{localName}</h2>
        </div>
        <div className="info-container">
          <div className="info-container-first">
            <p className="categoria">{categoria}</p>
            <p className="distancia">A {metros} m</p>
          </div>
          <div className="info-container-second">
            <div className="horario-container">
              <Clock
                size={20}
                color={clockColor}
                strokeWidth={2}
                className="icono-reloj"
              />
              <p className={horarioClassName}>{horario}</p>
            </div>
          </div>
          <div className="info-container-third">
            <p className="direccion">{direccion}</p>
            <span className="boton-reservar">Reservar</span>
          </div>
        </div>
      </article>
    </Link>
  )
}

export default TarjetaLocal
