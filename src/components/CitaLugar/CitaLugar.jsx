import '../CitaCard/citaCard.css'
import './citaLugar.css'
import MapaMesas from '../MapaMesas/MapaMesas.jsx'
import { MESAS_MAPA } from '../../data/mesasMapa.js'
import {
  ReciboEncabezado,
  ReciboEstado,
  ReciboFila,
  ReciboSeparador,
  ReciboTalon,
} from '../CitaCard/ReciboPartes.jsx'

/* Segmento de recibo para una reserva de mesa. El plano se imprime en tinta (ver .recibo-mapa). */
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
  fechaTexto,
  estadoTexto,
  consumoTexto,
  mapsHref,
  numero = 1,
  onVoyPaAlla,
  onCancelar,
  pasada = false,
}) {
  const mesaReservada =
    mesaId != null
      ? MESAS_MAPA.find((m) => m.id === mesaId) ?? null
      : MESAS_MAPA.find((m) => m.codigo === mesaCodigo) ?? null

  return (
    <article className="recibo cita-lugar" aria-label={`Reserva en ${lugar}`}>
      <ReciboEncabezado lugar={lugar} numero={numero} tipo="Mesa" />
      <ReciboSeparador doble />

      <dl className="recibo-filas">
        <ReciboFila etiqueta="Fecha">{fechaTexto}</ReciboFila>
        <ReciboFila etiqueta="Mesa">
          {`${mesaCodigo ?? '—'}${capacidad != null ? ` (${capacidad} pers.)` : ''}`}
        </ReciboFila>
        <ReciboFila etiqueta="Zona">{mesaUbicacion ?? '—'}</ReciboFila>
      </dl>

      {/* Plano térmico: la mesa reservada es la única rellena, no hace falta leyenda. */}
      <div className="recibo-mapa" role="img" aria-label={`Plano del local, mesa ${mesaCodigo ?? ''} marcada`}>
        <MapaMesas mesaSeleccionada={mesaReservada} onMesaClick={() => {}} soloLectura />
      </div>

      <ReciboSeparador />

      <dl className="recibo-filas">
        <ReciboFila etiqueta="Consumo">{consumoTexto ?? '—'}</ReciboFila>
        <ReciboFila etiqueta="Reserva" grande>
          {coste}
        </ReciboFila>
        <ReciboFila etiqueta="Estado">
          <ReciboEstado estadoReserva={estadoReserva} />
        </ReciboFila>
        <ReciboFila etiqueta="Falta">{estadoTexto}</ReciboFila>
      </dl>

      <ReciboSeparador doble />

      <ReciboTalon
        lugar={lugar}
        wasa={wasa}
        telefono={telefono}
        mapsHref={mapsHref}
        textoCancelar="Cancelar mesa"
        onVoyPaAlla={onVoyPaAlla}
        onCancelar={onCancelar}
        archivada={pasada}
        cancelada={estadoReserva === 3}
        estadoReserva={estadoReserva}
      />
    </article>
  )
}

export default CitaLugar
