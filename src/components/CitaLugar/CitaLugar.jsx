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
        <ReciboFila etiqueta="Mesa">{mesaCodigo ?? '—'}</ReciboFila>
        <ReciboFila etiqueta="Zona">{mesaUbicacion ?? '—'}</ReciboFila>
        <ReciboFila etiqueta="Asientos">{capacidad ?? '—'}</ReciboFila>
      </dl>

      <div className="recibo-mapa" role="img" aria-label={`Plano del local, mesa ${mesaCodigo ?? ''} marcada`}>
        <MapaMesas mesaSeleccionada={mesaReservada} onMesaClick={() => {}} soloLectura />
      </div>
      <p className="recibo-nota">Tu mesa aparece rellena en el plano</p>

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

      <ReciboTalon lugar={lugar} wasa={wasa} telefono={telefono} mapsHref={mapsHref} textoCancelar="Cancelar mesa" />
    </article>
  )
}

export default CitaLugar
