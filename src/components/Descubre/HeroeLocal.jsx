import { Link } from 'react-router-dom'
import { MapPin, Star } from 'lucide-react'
import BotonFavorito from '../Favorito/BotonFavorito.jsx'
import Foto from '../Foto/Foto.jsx'
import { comodidadesDe, estadoApertura, fraseDeLocal, notaLocal } from '../../utils/descubre.js'
import './heroeLocal.css'

/* El lugar que abre la página. Foto a sangre y pocos datos, grandes: rompe el
   ritmo de la lista y le da a Descubre un punto de entrada en vez de empezar
   con trece tarjetas iguales.

   `prioridad`: es la foto más grande de la primera pantalla (la que Lighthouse
   mide como LCP); se pide antes que nada. `cargar`: en el carrusel, las
   diapositivas que aún no tocan no piden su foto (ver CarruselHeroe). */

function HeroeLocal({ local, etiqueta = 'El de hoy', prioridad = false, cargar = true }) {
  if (!local) return null

  const { nota, cantidad } = notaLocal(local)
  const puertas = estadoApertura(local)
  const comodidades = comodidadesDe(local, 2)
  const frase = fraseDeLocal(local)

  return (
    <article className="heroe-local tema-oscuro-fijo">
      <Link to={`/local/${local.id}`} className="heroe-local-link foto-marco" aria-label={`Ver ${local.localName}`}>
        {/* Caja vertical 4:5 de hasta 420 px: la foto llega ya recortada así. */}
        {cargar ? (
          <Foto
            src={local.url}
            className="heroe-local-foto"
            /* Tope 640 px y calidad 70: en un móvil de densidad 2.6 el
               navegador pedía la de 840 (183 KB) y era la foto que más
               tardaba en pintarse. A 380 px de ancho, 640 sigue nítida. */
            anchos={[420, 640]}
            calidad={70}
            proporcion={5 / 4}
            sizes="(max-width: 452px) calc(100vw - 32px), 420px"
            prioridad={prioridad}
            carga="eager"
          />
        ) : null}
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
            {local.metros ? (
              <span className="heroe-local-lejos">
                <MapPin size={12} strokeWidth={2.4} aria-hidden="true" />A {local.metros} m
              </span>
            ) : null}
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
        <BotonFavorito id={local.id} className="heroe-local-favorito" />

      </Link>
    </article>
  )
}

export default HeroeLocal
