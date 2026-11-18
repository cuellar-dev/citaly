import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Link } from 'react-router-dom'
import { ArrowLeft, Share2, Star } from 'lucide-react'
import BotonFavorito from '../Favorito/BotonFavorito.jsx'
import Foto from '../Foto/Foto.jsx'
import { NubeBorde } from './Tinta.jsx'
import './heroLocal.css'

/* Cabecera de la ficha: las fotos del local se pasan deslizando aquí mismo
   (ya no hay sección "Fotos" aparte) y al tocar una se abre en grande.

   La primera foto es una <img> de verdad, con prioridad alta: es lo primero
   que se ve, y como fondo CSS el navegador la descubría tarde y no tenía
   texto alternativo. Las demás se cargan cuando hace falta.

   Que se puede deslizar se enseña de dos maneras: puntitos abajo (todo el
   mundo los lee como «hay más») y, las primeras veces, un asomo: la foto se
   corre sola un poco, enseña la siguiente y vuelve. Si la persona ya
   deslizó alguna vez, no vuelve a hacerlo. */
const ASOMO_KEY = 'citaly_asomo_fotos'
const ASOMOS_MAX = 3
const PUNTOS_MAX = 8

function leerAsomos() {
  try {
    return Number(localStorage.getItem(ASOMO_KEY)) || 0
  } catch {
    return ASOMOS_MAX
  }
}

function guardarAsomos(n) {
  try {
    localStorage.setItem(ASOMO_KEY, String(n))
  } catch {
    /* sin almacenamiento: da igual, como mucho se repite */
  }
}

function HeroLocal({ local, fotos, estado, nota, cantidad, onCompartir, onAbrirFoto }) {
  const pistaRef = useRef(null)
  const [indice, setIndice] = useState(0)
  const asomoRef = useRef(null)

  useEffect(() => {
    const pista = pistaRef.current
    if (!pista || fotos.length < 2) return undefined
    if (leerAsomos() >= ASOMOS_MAX) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const fotosEl = pista.querySelectorAll('.local-hero-foto')
    /* Si toca o desliza antes (o durante), se corta y no se repite más:
       ya sabe que se puede. */
    const cortar = () => {
      asomoRef.current?.kill()
      gsap.set(fotosEl, { clearProps: 'transform' })
      guardarAsomos(ASOMOS_MAX)
    }
    pista.addEventListener('pointerdown', cortar, { once: true })

    asomoRef.current = gsap
      .timeline({
        delay: 1.1,
        onStart: () => guardarAsomos(leerAsomos() + 1),
        onComplete: () => gsap.set(fotosEl, { clearProps: 'transform' }),
      })
      .to(fotosEl, { xPercent: -24, duration: 0.55, ease: 'power2.inOut' })
      .to(fotosEl, { xPercent: 0, duration: 0.7, ease: 'back.out(1.6)' }, '+=0.35')

    return () => {
      pista.removeEventListener('pointerdown', cortar)
      asomoRef.current?.kill()
      gsap.set(fotosEl, { clearProps: 'transform' })
    }
  }, [fotos.length])

  function alDeslizar() {
    const pista = pistaRef.current
    if (!pista) return
    const i = Math.round(pista.scrollLeft / pista.clientWidth)
    if (i !== indice) {
      setIndice(i)
      guardarAsomos(ASOMOS_MAX)
    }
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
            {/* Caja casi cuadrada en el móvil (ancho completo × 320–440 px de
                alto): se pide recortada 1:1 para que no se vea borrosa al
                cubrir la altura. */}
            <Foto
              src={url}
              alt={i === 0 ? `Foto de ${local.localName}` : ''}
              /* Tope 720: en un móvil de densidad 2.6 pedía la de 960 (147 KB)
                 y era lo que más tardaba. A ~400 px de ancho, 720 va nítida. */
              anchos={[480, 720]}
              calidad={70}
              proporcion={1}
              sizes="100vw"
              prioridad={i === 0}
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

      {fotos.length > 1 && fotos.length <= PUNTOS_MAX ? (
        <span className="local-hero-puntos" aria-hidden="true">
          {fotos.map((url, i) => (
            <span key={url} className={i === indice ? 'local-hero-punto local-hero-punto--activo' : 'local-hero-punto'} />
          ))}
        </span>
      ) : fotos.length > PUNTOS_MAX ? (
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
          {local.metros ? (
            <>
              <span aria-hidden="true">·</span>
              <span>A {local.metros} m</span>
            </>
          ) : null}
        </p>
      </div>

      <NubeBorde />
    </header>
  )
}

export default HeroLocal
