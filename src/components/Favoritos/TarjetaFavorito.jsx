import { Link } from 'react-router-dom'
import { MapPin, Star } from 'lucide-react'
import BotonFavorito from '../Favorito/BotonFavorito.jsx'
import { estadoApertura, fraseDeLocal, notaLocal } from '../../utils/descubre.js'
import './tarjetaFavorito.css'

/* Tarjeta de un favorito: una polaroid pegada con cinta.

   Las tarjetas de Descubre son oscuras y cuentan cómo es un sitio que aún no
   conoces. Esta es otra cosa: un sitio que ya es tuyo. Por eso va en papel
   crema, girada como una foto pegada a mano, con su trozo de cinta mostaza y
   un sello de estrella en la esquina. La frase de la gente va abajo, escrita
   como una nota al pie de la foto.

   Si la quitas de favoritos no desaparece al momento: se queda apagada, sin
   cinta, hasta que te vayas. Así un toque sin querer se arregla con otro. */

function TarjetaFavorito({ local, indice = 0, quitada = false }) {
  const { id, localName, categoria, metros, url } = local
  const { nota, cantidad } = notaLocal(local)
  const puertas = estadoApertura(local)
  const frase = fraseDeLocal(local)

  /* Giro alterno pero no simétrico: si todas fueran ±1° se vería un patrón. */
  const giros = [-1.6, 1.2, -0.7, 1.7, -1.1, 0.6]
  const giro = giros[indice % giros.length]

  return (
    <article
      className={`fav${quitada ? ' fav--quitada' : ''}`}
      style={{ '--giro': `${giro}deg`, '--orden': indice }}
    >
      <span className="fav-cinta" aria-hidden="true" />

      <Link to={`/local/${id}`} className="fav-link" aria-label={`Ver ${localName}`}>
        <div className="fav-foto">
          <img src={url} alt="" loading="lazy" decoding="async" />
          <span className={`fav-puertas${puertas.abierto ? ' fav-puertas--abierto' : ''}`}>
            <span className="fav-puertas-punto" aria-hidden="true" />
            {puertas.texto}
            {puertas.detalle ? <small>· {puertas.detalle}</small> : null}
          </span>
        </div>

        <div className="fav-pie">
          {/* Sello de favorito: una pegatina redonda que muerde el borde de la foto. */}
          <span className="fav-sello" aria-hidden="true">
            <Star size={15} strokeWidth={2.4} fill="currentColor" />
          </span>

          <div className="fav-pie-arriba">
            <h2 className="fav-nombre">{localName}</h2>
            <span className="fav-nota">
              <Star size={13} strokeWidth={2.2} fill="currentColor" aria-hidden="true" />
              {nota ? nota.toFixed(1) : '—'}
              {cantidad > 0 && <small>({cantidad})</small>}
            </span>
          </div>

          <p className="fav-meta">
            <span>{categoria}</span>
            <span className="fav-meta-punto" aria-hidden="true" />
            <span className="fav-meta-lejos">
              <MapPin size={12} strokeWidth={2.4} aria-hidden="true" />A {metros} m
            </span>
          </p>

          {quitada ? (
            <p className="fav-aviso">Lo quitaste. Toca el corazón si quieres guardarlo otra vez.</p>
          ) : frase ? (
            <p className="fav-frase">
              “{frase.texto}” <cite>— {frase.autor}</cite>
            </p>
          ) : null}
        </div>
      </Link>

      <BotonFavorito id={id} className="boton-favorito--polaroid" tamano={18} />
    </article>
  )
}

export default TarjetaFavorito
