import { UsersRound } from 'lucide-react'
import TarjetaCita, { DatoCita } from '../CitaCard/TarjetaCita.jsx'
import MapaMesas from '../MapaMesas/MapaMesas.jsx'
import { MESAS_MAPA } from '../../data/mesasMapa.js'

/* Tarjeta de una reserva de mesa. Lleva el plano del local con la mesa marcada,
   salvo que sea una reserva de grupo: ahí no hay mesa que marcar todavía. */
function CitaLugar({
  lugar,
  wasa,
  telefono,
  coste,
  estadoReserva = 0,
  mesaId,
  mesaCodigo,
  mesaUbicacion,
  capacidad,
  diaTexto,
  horaTexto,
  estadoTexto,
  consumoTexto,
  mapsHref,
  grupoGrande = false,
  minimoPersonas,
  onVoyPaAlla,
  onCancelar,
  pasada = false,
  proxima = false,
}) {
  const mesaReservada =
    mesaId != null
      ? MESAS_MAPA.find((m) => m.id === mesaId) ?? null
      : MESAS_MAPA.find((m) => m.codigo === mesaCodigo) ?? null

  return (
    <TarjetaCita
      lugar={lugar}
      tipo={grupoGrande ? 'Grupo' : 'Mesa'}
      diaTexto={diaTexto}
      horaTexto={horaTexto}
      estadoReserva={estadoReserva}
      estadoTexto={estadoTexto}
      coste={coste}
      costeEtiqueta="Reserva"
      wasa={wasa}
      telefono={telefono}
      mapsHref={mapsHref}
      textoCancelar="Cancelar mesa"
      onVoyPaAlla={onVoyPaAlla}
      onCancelar={onCancelar}
      pasada={pasada}
      proxima={proxima}
      etiquetaAria={grupoGrande ? `Reserva de grupo en ${lugar}` : `Reserva en ${lugar}`}
    >
      {grupoGrande ? (
        <>
          <dl className="tarjeta-cita-datos">
            <DatoCita etiqueta="Grupo" ancho>
              {minimoPersonas ? `Más de ${minimoPersonas} personas` : 'Grupo grande'}
            </DatoCita>
          </dl>
          <p className="tarjeta-cita-grupo">
            <UsersRound size={16} strokeWidth={2} aria-hidden="true" />
            Juntan las mesas al llegar. Si quieres adelantarlo, escríbeles.
          </p>
        </>
      ) : (
        <>
          <dl className="tarjeta-cita-datos">
            <DatoCita etiqueta="Mesa">
              {`${mesaCodigo ?? '—'}${capacidad != null ? ` (${capacidad} pers.)` : ''}`}
            </DatoCita>
            <DatoCita etiqueta="Zona">{mesaUbicacion ?? '—'}</DatoCita>
            <DatoCita etiqueta="Consumo" ancho>
              {consumoTexto ?? '—'}
            </DatoCita>
          </dl>

          <div
            className="tarjeta-cita-mapa"
            role="img"
            aria-label={`Plano del local, mesa ${mesaCodigo ?? ''} marcada`}
          >
            <MapaMesas mesaSeleccionada={mesaReservada} onMesaClick={() => {}} soloLectura />
          </div>
        </>
      )}
    </TarjetaCita>
  )
}

export default CitaLugar
