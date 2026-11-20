import { Suspense, lazy, useState } from 'react'
import { Maximize2 } from 'lucide-react'
import Plano from './Plano.jsx'
import { mesasDe } from './modelo.js'
import './visorPlano.css'

/* El plano tal como lo ve quien reserva (y el dueño en Mi Negocio).

   - Ocupa todo el ancho y la altura que pide su forma (hasta ~60 % de la
     pantalla), en vez de una caja fija de 200 px.
   - Con más de un piso, unas pestañas pequeñas arriba ("Planta baja ·
     Arriba · 3 libres"). Cambiar de piso desliza el plano hacia arriba o
     hacia abajo con un fundido corto, para que se sienta "subir".
   - "Ver en grande" abre el plano a pantalla completa con pellizco para
     acercar: para locales grandes en un móvil. Se descarga al abrirlo. */

const VistaGrande = lazy(() => import('./VistaGrande.jsx'))

export function PestanasPisos({ plano, piso, onPiso, estados }) {
  if (plano.pisos.length < 2) return null
  return (
    <div className="visor-pisos" role="tablist" aria-label="Pisos del local">
      {plano.pisos.map((p) => {
        const libres = estados
          ? mesasDe(plano).filter((m) => m.piso === p.id && ['libre', 'opcion'].includes(estados.get(m.id))).length
          : null
        return (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={piso === p.id}
            className={`visor-piso${piso === p.id ? ' visor-piso--activo' : ''}`}
            onClick={() => onPiso(p.id)}
          >
            {p.nombre}
            {libres != null && (
              <span className="visor-piso-libres">
                {libres === 0 ? 'nada libre' : `${libres} ${libres === 1 ? 'libre' : 'libres'}`}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function VisorPlano({ plano, estados, elegidas = [], unir = false, onMesa, titulo = 'Plano del local', apagado = false, conGrande = true, children }) {
  const pisoDeElegida = plano.piezas.find((p) => p.id === elegidas[0])?.piso
  const [piso, setPiso] = useState(pisoDeElegida ?? plano.pisos[0].id)
  const [direccion, setDireccion] = useState('sube')
  const [grande, setGrande] = useState(false)

  const cambiarPiso = (id) => {
    const antes = plano.pisos.findIndex((p) => p.id === piso)
    const despues = plano.pisos.findIndex((p) => p.id === id)
    setDireccion(despues >= antes ? 'sube' : 'baja')
    setPiso(id)
  }

  /* La escalera lleva al piso siguiente (o vuelve al primero). */
  const subir = () => {
    const i = plano.pisos.findIndex((p) => p.id === piso)
    cambiarPiso(plano.pisos[(i + 1) % plano.pisos.length].id)
  }

  return (
    <div className={`visor-plano${apagado ? ' visor-plano--apagado' : ''}`}>
      <PestanasPisos plano={plano} piso={piso} onPiso={cambiarPiso} estados={estados} />
      <div className="visor-plano-marco">
        <div key={piso} className={`visor-plano-lienzo visor-plano-lienzo--${direccion}`}>
          <Plano
            plano={plano}
            piso={piso}
            estados={estados}
            elegidas={elegidas}
            unir={unir}
            onMesa={apagado ? undefined : onMesa}
            onEscalera={plano.pisos.length > 1 ? subir : undefined}
            titulo={plano.pisos.length > 1 ? `${titulo}, ${plano.pisos.find((p) => p.id === piso)?.nombre}` : titulo}
          />
        </div>
        {conGrande && (
          <button type="button" className="visor-plano-grande" onClick={() => setGrande(true)} aria-label="Ver el plano en grande">
            <Maximize2 size={16} strokeWidth={2.3} aria-hidden="true" />
          </button>
        )}
      </div>
      {children}
      {grande && (
        <Suspense fallback={null}>
          <VistaGrande
            plano={plano}
            pisoInicial={piso}
            estados={estados}
            elegidas={elegidas}
            unir={unir}
            onMesa={
              apagado || !onMesa
                ? undefined
                : (id) => {
                    onMesa(id)
                    setGrande(false)
                  }
            }
            titulo={titulo}
            onCerrar={() => setGrande(false)}
          />
        </Suspense>
      )}
    </div>
  )
}

export default VisorPlano

/** Leyenda de colores bajo el plano. */
export function LeyendaPlano({ items }) {
  return (
    <ul className="visor-leyenda" aria-label="Qué significa cada color">
      {items.map((it) => (
        <li key={it.id}>
          <span className={`visor-leyenda-muestra visor-leyenda-muestra--${it.id}`} aria-hidden="true" />
          {it.texto}
        </li>
      ))}
      <li className="visor-leyenda-sillas">
        <span className="visor-leyenda-silla" aria-hidden="true" />
        Cada silla, una persona
      </li>
    </ul>
  )
}
