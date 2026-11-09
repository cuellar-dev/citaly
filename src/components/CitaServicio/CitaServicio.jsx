import TarjetaCita, { DatoCita } from '../CitaCard/TarjetaCita.jsx'
import { duracionAMinutos, duracionTexto } from '../../utils/fichaLocal.js'

/* Tarjeta de una cita de servicio (peluquería, barbería, etc.). */
function CitaServicio({
  lugar,
  wasa,
  telefono,
  coste,
  profesional,
  servicios,
  lineas = [],
  estadoReserva = 0,
  diaTexto,
  horaTexto,
  estadoTexto,
  mapsHref,
  onVoyPaAlla,
  onCancelar,
  pasada = false,
  proxima = false,
}) {
  return (
    <TarjetaCita
      lugar={lugar}
      tipo="Servicio"
      diaTexto={diaTexto}
      horaTexto={horaTexto}
      estadoReserva={estadoReserva}
      estadoTexto={estadoTexto}
      coste={coste}
      costeEtiqueta="Total"
      wasa={wasa}
      telefono={telefono}
      mapsHref={mapsHref}
      textoCancelar="Cancelar cita"
      onVoyPaAlla={onVoyPaAlla}
      onCancelar={onCancelar}
      pasada={pasada}
      proxima={proxima}
      etiquetaAria={`Cita en ${lugar}`}
    >
      <dl className="tarjeta-cita-datos">
        <DatoCita etiqueta="Profesional">{profesional}</DatoCita>
      </dl>

      {lineas.length > 0 ? (
        <ul className="tarjeta-cita-lista" aria-label="Servicios">
          {lineas.map((linea) => (
            <li key={linea.id ?? linea.nombre}>
              <span className="tarjeta-cita-lista-nombre">
                {linea.nombre}
                {linea.duracion ? ` (${duracionTexto(duracionAMinutos(linea.duracion))})` : ''}
              </span>
              <span className="tarjeta-cita-lista-precio">
                {linea.precio === 0 ? 'GRATIS' : `${linea.precio} CUP`}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="tarjeta-cita-nota">{servicios}</p>
      )}
    </TarjetaCita>
  )
}

export default CitaServicio
