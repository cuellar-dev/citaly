import { Armchair, Link2, MapPin } from 'lucide-react'
import { RASGOS } from './modelo.js'
import './fichaMesa.css'

/* Lo que ve el cliente de la mesa que eligió: una ficha FIJA debajo del
   plano (antes era un recuadro flotante que se descolocaba al cambiar el
   tamaño del mapa). Nunca enseña los rangos de capacidad: eso es del dueño.

   `mesas`: una mesa, o varias si van juntas. */

const NOMBRE_RASGO = new Map(RASGOS.map((r) => [r.id, r.nombre]))

export default function FichaMesa({ mesas, zona, nota, personas }) {
  if (!mesas?.length) return null
  const juntas = mesas.length > 1
  const rasgos = [...new Set(mesas.flatMap((m) => m.rasgos ?? []))]

  return (
    <div className={`ficha-mesa${juntas ? ' ficha-mesa--juntas' : ''}`} role="status" aria-live="polite">
      <span className="ficha-mesa-icono" aria-hidden="true">
        {juntas ? <Link2 size={18} strokeWidth={2.3} /> : <Armchair size={18} strokeWidth={2.3} />}
      </span>
      <div className="ficha-mesa-cuerpo">
        <p className="ficha-mesa-nombre">{mesas.map((m) => m.nombre).join(' + ')}</p>
        <p className="ficha-mesa-linea">
          {zona && (
            <span>
              <MapPin size={12} strokeWidth={2.4} aria-hidden="true" />
              {zona}
            </span>
          )}
          {personas ? <span>Para {personas} {personas === 1 ? 'persona' : 'personas'}</span> : null}
        </p>
        {juntas && <p className="ficha-mesa-nota">Te las tienen juntas cuando llegues.</p>}
        {nota && <p className="ficha-mesa-nota">{nota}</p>}
        {rasgos.length > 0 && (
          <ul className="ficha-mesa-rasgos" aria-label="Cómo es">
            {rasgos.map((r) => (
              <li key={r}>{NOMBRE_RASGO.get(r)}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/** Lista de opciones de mesas juntas para el grupo (accesible, sin depender del dibujo). */
export function OpcionesJuntas({ juntas, porId, elegida, onElegir, zonaDe }) {
  return (
    <div className="opciones-juntas" role="radiogroup" aria-label="Mesas que se pueden juntar">
      {juntas.map((j) => {
        const mesas = j.mesas.map((id) => porId.get(id)).filter(Boolean)
        const zona = zonaDe(mesas[0])
        return (
          <button
            key={j.id}
            type="button"
            role="radio"
            aria-checked={elegida === j.id}
            className={`opcion-junta${elegida === j.id ? ' opcion-junta--elegida' : ''}`}
            onClick={() => onElegir(j.id)}
          >
            <Link2 size={15} strokeWidth={2.3} aria-hidden="true" />
            <span className="opcion-junta-nombre">{mesas.map((m) => m.nombre).join(' + ')}</span>
            {zona && <span className="opcion-junta-zona">{zona}</span>}
          </button>
        )
      })}
    </div>
  )
}
