import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Share2, Star } from 'lucide-react'
import BotonFavorito from '../Favorito/BotonFavorito.jsx'
import { fotoAncho } from '../../utils/fichaLocal.js'
import { NubeBorde } from './Tinta.jsx'
import './heroLocal.css'

/* Cabecera de la ficha: las fotos del local se pasan deslizando aquí mismo
   (ya no hay sección "Fotos" aparte) y al tocar una se abre en grande.

   La primera foto es una <img> de verdad, con prioridad alta: es lo primero
   que se ve, y como fondo CSS el navegador la descubría tarde y no tenía
   texto alternativo. Las demás se cargan cuando hace falta. */
function HeroLocal({ local, fotos, estado, nota, cantidad, onCompartir, onAbrirFoto }) {
  const pistaRef = useRef(null)
  const [indice, setIndice] = useState(0)

  function alDeslizar() {
    const pista = pistaRef.current
    if (!pista) return
    const i = Math.round(pista.scrollLeft / pista.clientWidth)
    if (i !== indice) setIndice(i)
  }

  return (
    <header className="local-hero tema-oscuro-fijo">
      <div
        className="local-hero-pista"
        ref={pistaRef}
        onScroll={alDeslizar}
        role="region"
        aria-roledescription="carrusel"
        aria-label={`Fotos de ${local.localName}`}
      >
        {fotos.map((url, i) => (
          <button
            key={url}
            type="button"
            className="local-hero-foto"
            onClick={() => onAbrirFoto(url)}
            aria-label={`Ver foto ${i + 1} de ${fotos.length} en grande`}
          >
            <img
              src={i === 0 ? url : fotoAncho(url, 900)}
              alt={i === 0 ? `Foto de ${local.localName}` : ''}
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : 'auto'}
              decoding="async"
              draggable={false}
            />
          </button>
        ))}
      </div>

      <div className="local-hero-velo" aria-hidden="true" />

      <div className="local-hero-barra">
        <Link to="/" className="local-hero-volver">
          <ArrowLeft size={20} />
          Descubre
        </Link>
        <div className="local-hero-acciones">
          <BotonFavorito id={local.id} className="boton-favorito--hero" tamano={22} />
          <button type="button" className="local-hero-redondo" onClick={onCompartir} aria-label="Compartir local">
            <Share2 size={21} />
          </button>
        </div>
      </div>

      {fotos.length > 1 ? (
        <span className="local-hero-contador" aria-hidden="true">
          {indice + 1}/{fotos.length}
        </span>
      ) : null}

      <div className="local-hero-texto">
        <div className="local-hero-chips">
          <span className={`local-hero-estado${estado.abierto ? ' local-hero-estado--abierto' : ''}`}>
            {estado.texto}
            {estado.detalle ? <span className="local-hero-estado-detalle"> · {estado.detalle}</span> : null}
          </span>
          {local.categoria ? <span className="local-hero-categoria">{local.categoria}</span> : null}
        </div>
        <h1 className="local-hero-nombre">{local.localName}</h1>
        <p className="local-hero-meta">
          {cantidad ? (
            <span className="local-hero-nota">
              <Star size={15} className="local-hero-estrella" aria-hidden="true" />
              <strong>{nota}</strong>
              <span className="local-hero-cantidad">
                ({cantidad}
                <span className="sr-only"> opiniones</span>)
              </span>
            </span>
          ) : (
            <span className="local-hero-nuevo">Nuevo en Citaly</span>
          )}
          <span aria-hidden="true">·</span>
          <span>A {local.metros} m</span>
        </p>
      </div>

      <NubeBorde />
    </header>
  )
}

export default HeroLocal
