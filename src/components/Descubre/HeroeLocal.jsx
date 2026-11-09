import { Link } from 'react-router-dom'
import { MapPin, Star } from 'lucide-react'
import BotonFavorito from '../Favorito/BotonFavorito.jsx'
import { comodidadesDe, estadoApertura, fraseDeLocal, notaLocal } from '../../utils/descubre.js'
import './heroeLocal.css'

/* El lugar que abre la página. Foto a sangre y pocos datos, grandes: rompe el
   ritmo de la lista y le da a Descubre un punto de entrada en vez de empezar
   con trece tarjetas iguales. */

function HeroeLocal({ local, etiqueta = 'El de hoy' }) {
  if (!local) return null

  const { nota, cantidad } = notaLocal(local)
  const puertas = estadoApertura(local)
  const comodidades = comodidadesDe(local, 2)
  const frase = fraseDeLocal(local)

  return (
    <article className="heroe-local">
      <Link to={`/local/${local.id}`} className="heroe-local-link" aria-label={`Ver ${local.localName}`}>
        <img src={local.url} alt="" className="heroe-local-foto" loading="eager" decoding="async" />
        <span className="heroe-local-velo" aria-hidden="true" />

        <div className="heroe-local-arriba">
          <span className="heroe-local-etiqueta">{etiqueta}</span>
          <span className={`heroe-local-puertas${puertas.abierto ? ' heroe-local-puertas--abierto' : ''}`}>
            <span className="heroe-local-punto" aria-hidden="true" />
            {puertas.texto}
            {puertas.detalle ? <small>{puertas.detalle}</small> : null}
          </span>
        </div>

        <div className="heroe-local-abajo">
          <h2>{local.localName}</h2>

          <p className="heroe-local-meta">
            <span className="heroe-local-nota">
              <Star size={13} strokeWidth={2.4} aria-hidden="true" />
              {nota ? nota.toFixed(1) : '—'}
              {cantidad > 0 ? <small>({cantidad})</small> : null}
            </span>
            <span>{local.categoria}</span>
            <span className="heroe-local-lejos">
              <MapPin size={12} strokeWidth={2.4} aria-hidden="true" />A {local.metros} m
            </span>
          </p>

          {frase ? <p className="heroe-local-frase">“{frase.texto}”</p> : null}

          {comodidades.length > 0 ? (
            <ul className="heroe-local-comodidades">
              {comodidades.map(({ id, label, Icono }) => (
                <li key={id}>
                  <Icono size={12} strokeWidth={2.2} aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Link>
      <BotonFavorito id={local.id} className="heroe-local-favorito" />
    </article>
  )
}

export default HeroeLocal
