import { Link } from 'react-router-dom'
import { Check, MapPin, Plus, Store } from 'lucide-react'
import Foto from '../../Foto/Foto.jsx'
import './miLocal.css'

/* Al final del panel, antes de «Tu local en Citaly»: los locales que el
   usuario ha creado, cada uno en su tarjeta con la portada, el tipo, dónde
   está y en qué punto anda; y una tarjeta más para crear otro. Si no tiene
   ninguno, una invitación a poner el suyo.

   Va abajo y no arriba a propósito: el panel abre con la portada del local
   que se está viendo, y cambiar de local es lo menos frecuente. */

function estadoDe(local) {
  if (local.estado === 'revision') return { texto: 'En revisión', tono: 'amarillo' }
  if (!local.completado) return { texto: 'Falta completar', tono: 'amarillo' }
  if (local.oculto) return { texto: 'Oculto', tono: 'gris' }
  return { texto: 'En Citaly', tono: 'verde' }
}

/* De la dirección completa, lo último (municipio, provincia) es lo que dice
   algo de un vistazo. */
function zonaDe(direccion = '') {
  const partes = String(direccion).split(',').map((p) => p.trim()).filter(Boolean)
  return partes.length > 1 ? partes.slice(-2).join(', ') : partes[0] ?? ''
}

function SelectorMisLocales({ locales, activo, onElegir }) {
  if (!locales.length) {
    return (
      <Link to="/negocio/nuevo" className="mis-locales-invita">
        <span className="mis-locales-invita-icono" aria-hidden="true">
          <Store size={20} strokeWidth={2.2} />
        </span>
        <span className="mis-locales-invita-textos">
          <strong>¿Tienes un negocio? Ponlo en Citaly</strong>
          <span>Dos minutos y lo revisamos. Gratis.</span>
        </span>
        <span className="mis-locales-invita-boton">Crear</span>
      </Link>
    )
  }

  return (
    <section className="mis-locales" aria-labelledby="mis-locales-titulo">
      <header className="mis-locales-cabecera">
        <h2 id="mis-locales-titulo" className="mis-locales-titulo">
          <Store size={16} strokeWidth={2.3} aria-hidden="true" />
          Tus locales
        </h2>
        <span className="mis-locales-cuenta">{locales.length}</span>
      </header>

      <div className="mis-locales-fila" role="radiogroup" aria-label="Elige qué local ver">
        {locales.map((l) => {
          const estado = estadoDe(l)
          const elegido = activo === l.id
          const portada = l.url || l.urls?.[0]
          const zona = zonaDe(l.direccion)
          return (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={elegido}
              className="mis-locales-tarjeta"
              onClick={() => !elegido && onElegir(l.id)}
            >
              <span className={`mis-locales-portada${portada ? ' foto-marco' : ''}`}>
                {portada ? (
                  <Foto src={portada} ancho={320} proporcion={10 / 16} />
                ) : (
                  <span className="mis-locales-inicial" aria-hidden="true">
                    {(l.localName || '?').trim().charAt(0).toUpperCase()}
                  </span>
                )}
                <span className={`mis-locales-estado mis-locales-estado--${estado.tono}`}>{estado.texto}</span>
                {elegido && (
                  <span className="mis-locales-viendo">
                    <Check size={12} strokeWidth={3} aria-hidden="true" />
                    Viendo
                  </span>
                )}
              </span>
              <span className="mis-locales-datos">
                <span className="mis-locales-nombre">{l.localName}</span>
                {l.categoria && <span className="mis-locales-categoria">{l.categoria}</span>}
                {zona && (
                  <span className="mis-locales-zona">
                    <MapPin size={12} strokeWidth={2.4} aria-hidden="true" />
                    {zona}
                  </span>
                )}
              </span>
            </button>
          )
        })}

        <Link to="/negocio/nuevo" className="mis-locales-tarjeta mis-locales-tarjeta--nuevo">
          <span className="mis-locales-mas" aria-hidden="true">
            <Plus size={22} strokeWidth={2.4} />
          </span>
          <span className="mis-locales-nuevo-textos">
            <strong>Añadir otro local</strong>
            <span>Lo revisamos y sale en Citaly</span>
          </span>
        </Link>
      </div>
    </section>
  )
}

export default SelectorMisLocales
