import '../CitaCard/citaCard.css'
import './citaServicio.css'
import {
  ReciboEncabezado,
  ReciboEstado,
  ReciboFila,
  ReciboSeparador,
  ReciboTalon,
} from '../CitaCard/ReciboPartes.jsx'
import { tinta } from '../CitaCard/tinta.js'

/* Segmento de recibo para una cita de servicio (peluquería, barbería, etc.). */
function CitaServicio({
  lugar,
  wasa,
  telefono,
  coste,
  profesional,
  servicios,
  lineas = [],
  estadoReserva = 0,
  fechaTexto,
  estadoTexto,
  mapsHref,
  numero = 1,
  onVoyPaAlla,
  onCancelar,
  pasada = false,
}) {
  return (
    <article className="recibo cita-servicio" aria-label={`Cita en ${lugar}`}>
      <ReciboEncabezado lugar={lugar} numero={numero} tipo="Servicio" />
      <ReciboSeparador doble />

      <dl className="recibo-filas">
        <ReciboFila etiqueta="Fecha">{fechaTexto}</ReciboFila>
        <ReciboFila etiqueta="Profesional">{profesional}</ReciboFila>
      </dl>

      <ReciboSeparador />

      {lineas.length > 0 ? (
        <ul className="recibo-lista" aria-label="Servicios">
          {lineas.map((linea) => (
            <li key={linea.id ?? linea.nombre}>
              <span>{tinta(`${linea.nombre}${linea.duracion ? ` (${linea.duracion})` : ''}`)}</span>
              <span className="recibo-lista-precio">
                {linea.precio === 0 ? 'GRATIS' : `${linea.precio} CUP`}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="recibo-nota">{tinta(servicios)}</p>
      )}

      <ReciboSeparador />

      <dl className="recibo-filas">
        <ReciboFila etiqueta="Total" grande>
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
        textoCancelar="Cancelar cita"
        onVoyPaAlla={onVoyPaAlla}
        onCancelar={onCancelar}
        archivada={pasada}
        cancelada={estadoReserva === 3}
        estadoReserva={estadoReserva}
      />
    </article>
  )
}

export default CitaServicio
