import { useState } from 'react'
import Plano from '../../plano/Plano.jsx'
import { PestanasPisos } from '../../plano/VisorPlano.jsx'
import { planoLegado } from '../../plano/local.js'
import './mapaMesas.css'

/* El plano de mesas para las pantallas de siempre (Mi Negocio, la sala del
   turno, el recibo de la cita, el alta del local).

   Antes era un único dibujo fijo de 7 mesas. Ahora dibuja el plano del
   local (src/plano/) y acepta las mismas props que antes, así que esas
   pantallas no cambian:
     mesas             lista con `estado` por mesa (disponible | ocupado | no-cabe | calle)
     mesaSeleccionada  la mesa marcada (o varias, con `ids`; `junta: true` si van juntas)
     onMesaClick       tocar una mesa
     soloLectura       solo para mirar (recibo, vistas previas)
     editable          modo dueño: se puede tocar cualquier mesa */

const ESTADO = { disponible: 'libre', ocupado: 'ocupada', 'no-cabe': 'nocabe', calle: 'local' }

export default function MapaMesas({
  plano: planoProp,
  mesas,
  mesaSeleccionada,
  onMesaClick,
  soloLectura = false,
  editable = false,
  titulo = 'Plano del local',
}) {
  const plano = planoProp ?? planoLegado()
  const elegidas = mesaSeleccionada?.ids ?? (mesaSeleccionada?.id ? [mesaSeleccionada.id] : [])
  const pisoInicial = plano.piezas.find((p) => p.id === elegidas[0])?.piso ?? plano.pisos[0].id
  const [piso, setPiso] = useState(pisoInicial)

  const estados = new Map()
  for (const m of mesas ?? []) {
    /* En modo dueño todas se pueden tocar: se pintan libres o "en el local". */
    const estado = ESTADO[m.estado] ?? (m.online === false ? 'local' : 'libre')
    /* En modo dueño no hay "ocupada": se pinta libre o "en el local". */
    estados.set(m.id, editable && estado !== 'local' ? 'libre' : estado)
  }

  const porId = new Map((mesas ?? []).map((m) => [m.id, m]))
  const tocar =
    soloLectura || !onMesaClick
      ? undefined
      : (id) => {
          const mesa = porId.get(id) ?? { id }
          onMesaClick(mesa)
        }

  return (
    <div className="mapa-mesas">
      <PestanasPisos plano={plano} piso={piso} onPiso={setPiso} />
      <Plano
        plano={plano}
        piso={piso}
        estados={estados}
        elegidas={elegidas}
        unir={Boolean(mesaSeleccionada?.junta)}
        onMesa={tocar}
        /* El dueño toca cualquier mesa, también las "solo en el local". */
        tocarTodas={editable}
        titulo={soloLectura ? undefined : titulo}
      />
    </div>
  )
}
