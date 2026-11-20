import { Link } from 'react-router-dom'
import { MapPin, Quote, Star } from 'lucide-react'
import BotonFavorito from '../Favorito/BotonFavorito.jsx'
import Foto from '../Foto/Foto.jsx'
import { useTurnoFoto } from '../Descubre/colaFotos.js'
import { comodidadesDe, desdeTexto, estadoApertura, fraseDeLocal, notaLocal } from '../../utils/descubre.js'
import './tarjetalocal.css'

/* Tarjeta de un lugar en Descubre. Cuenta CÓMO ES el sitio, no empuja a
   reservar: eso se decide dentro, en la ficha. Por eso el ancla es lo que dice
   quien ya fue, y el estado de puertas va como contexto de "puedo ir", no como
   urgencia de venta. */

function TarjetaLocal(local) {
  const { id, localName, categoria, metros, url, direccion } = local
  const { nota, cantidad, estimada } = notaLocal(local)
  const puertas = estadoApertura(local)
  const comodidades = comodidadesDe(local, 3)
  const frase = fraseDeLocal(local)
  const desde = desdeTexto(local)
  /* En Descubre la foto espera su turno (colaFotos.js); fuera, carga normal. */
  const turno = useTurnoFoto(id)

  /* Relleno proporcional de verdad. Antes estaba fijo en 85% para cualquier
     nota entre 4 y 5, así que un 4.0 y un 5.0 se pintaban iguales. */
  const relleno = `${(Math.min(5, Math.max(0, nota)) / 5) * 100}%`

  return (
    <article className="tarjeta-wrap">
      <Link to={`/local/${id}`} className="tarjeta-link" aria-label={`Ver ${localName}`}>
        <div className="tarjeta">
          <div className="tarjeta-foto tema-oscuro-fijo foto-marco">
            {/* Caja 16:11 de hasta 420 px de ancho. */}
            {turno.puede ? (
              <Foto
                src={url}
                anchos={[400, 640]}
                calidad={70}
                proporcion={11 / 16}
                sizes="(max-width: 452px) calc(100vw - 32px), 420px"
                carga={turno.carga}
                alListo={turno.alListo}
              />
            ) : null}
            <span className="tarjeta-velo foto-velo" aria-hidden="true" />

            <span className={`tarjeta-puertas${puertas.abierto ? ' tarjeta-puertas--abierto' : ''}`}>
              <span className="tarjeta-puertas-punto" aria-hidden="true" />
              {puertas.texto}
              {puertas.detalle ? <small>{puertas.detalle}</small> : null}
            </span>

            <div className="tarjeta-titulo">
              <h2>{localName}</h2>
              <p className="tarjeta-meta">
                <span>{categoria}</span>
                {metros ? (
                  <>
                    <span className="tarjeta-punto" aria-hidden="true" />
                    <span className="tarjeta-lejos">
                      <MapPin size={12} strokeWidth={2.4} aria-hidden="true" />A {metros} m
                    </span>
                  </>
                ) : null}
              </p>
            </div>
          </div>

          <div className="tarjeta-cuerpo">
            <div className="tarjeta-nota">
              <span className="tarjeta-estrellas" aria-hidden="true">
                <span className="tarjeta-estrellas-fondo">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} size={13} strokeWidth={2} />
                  ))}
                </span>
                <span className="tarjeta-estrellas-relleno" style={{ width: relleno }}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} size={13} strokeWidth={2} />
                  ))}
                </span>
              </span>
              <strong>{nota ? nota.toFixed(1) : '—'}</strong>
              <small>
                {cantidad > 0
                  ? `${cantidad} ${cantidad === 1 ? 'opinión' : 'opiniones'}`
                  : estimada
                    ? 'sin opiniones aún'
                    : 'todavía sin notas'}
              </small>
              {desde ? <span className="tarjeta-desde">{desde}</span> : null}
            </div>

            {frase ? (
              <blockquote className="tarjeta-frase">
                <Quote size={13} strokeWidth={2.4} aria-hidden="true" />
                <p>
                  {frase.texto}
                  <cite>{frase.autor}</cite>
                </p>
              </blockquote>
            ) : (
              <p className="tarjeta-direccion">{direccion}</p>
            )}

            {comodidades.length > 0 ? (
              <ul className="tarjeta-comodidades">
                {comodidades.map(({ id: cid, label, Icono }) => (
                  <li key={cid}>
                    <Icono size={13} strokeWidth={2.2} aria-hidden="true" />
                    {label}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </Link>
      <BotonFavorito id={id} className="boton-favorito--tarjeta" />
    </article>
  )
}

export default TarjetaLocal
