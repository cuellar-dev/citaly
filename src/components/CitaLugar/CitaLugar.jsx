import '../CitaCard/citaCard.css'
import './citaLugar.css'
import { UtensilsCrossed, Phone, MapPin } from 'lucide-react'
import IconoWhatsApp from '../IconoWhatsApp/IconoWhatsApp.jsx'
import MapaMesas from '../MapaMesas/MapaMesas.jsx'
import { MESAS_MAPA } from '../../data/mesasMapa.js'

function CitaLugar({
  lugar,
  wasa,
  telefono,
  coste,
  estadoReserva = 'CONFIRMADO',
  mesaId,
  mesaCodigo,
  mesaUbicacion,
  capacidad,
  fechaTexto,
  estadoTexto,
  consumoTexto,
  mapsHref,
}) {
  const mesaReservada =
    mesaId != null
      ? MESAS_MAPA.find((m) => m.id === mesaId) ?? null
      : MESAS_MAPA.find((m) => m.codigo === mesaCodigo) ?? null

  return (
    <article className="cita-card cita-lugar">
      <div className="cita-card-header">
        <div className="cita-card-header-princ">
          <h2 className="cita-card-lugar">{lugar}</h2>
          <div className="cita-card-state-container">
            <div className="cita-card-state-cosi" />
            <p className="cita-card-state">{estadoReserva}</p>
          </div>
        </div>
        <div className="cita-card-icon-container">
          <UtensilsCrossed size={25} color="currentColor" className="cita-card-icon" />
        </div>
      </div>

      <div className="mapa-mesas-container mapa-mesas-container--card">
        <div className="mapa-mesas-viewport">
          <MapaMesas
            mesaSeleccionada={mesaReservada}
            onMesaClick={() => {}}
          />
        </div>
      </div>

      <div className="cita-card-info-grid">
        <div className="cita-card-info-elemento">
          <span className="cita-card-info-span">Mesa</span>
          <p className="cita-card-info-contenido">{mesaCodigo}</p>
        </div>
        <div className="cita-card-info-elemento">
          <span className="cita-card-info-span">Ubicación</span>
          <p className="cita-card-info-contenido">{mesaUbicacion}</p>
        </div>
        <div className="cita-card-info-elemento">
          <span className="cita-card-info-span">Fecha</span>
          <p className="cita-card-info-contenido">{fechaTexto}</p>
        </div>
        <div className="cita-card-info-elemento">
          <span className="cita-card-info-span">Estado</span>
          <p className="cita-card-info-contenido">{estadoTexto}</p>
        </div>
      </div>

      {/* Extra mesa: capacidad / consumo — opcional */}
      <div className="cita-lugar-extra">
        <p className="cita-lugar-extra-linea">
          <span className="cita-card-info-span">Asientos</span>
          <span className="cita-lugar-extra-valor">{capacidad ?? '—'}</span>
        </p>
        <p className="cita-lugar-extra-linea">
          <span className="cita-card-info-span">Consumo</span>
          <span className="cita-lugar-extra-valor">{consumoTexto ?? '—'}</span>
        </p>
      </div>

      <div className="cita-card-footer">
        <div className="cita-card-otros-datos">
          <span className="cita-card-otros-datos-span">{coste}</span>
          <div className="cita-card-links">
            <a href={`https://wa.me/${wasa}`} className="cita-card-link">
              <IconoWhatsApp size={20} className="cita-card-link-icon" />
            </a>
            <a href={`tel:${telefono ?? wasa}`} className="cita-card-link">
              <Phone size={20} className="cita-card-link-icon" strokeWidth={2} />
            </a>
            <a
              href={mapsHref ?? '#'}
              className="cita-card-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MapPin
                size={20}
                className="cita-card-link-icon cita-card-map-pin"
                strokeWidth={2}
              />
            </a>
          </div>
        </div>
        <div className="cita-card-boton-container">
          <button type="button" className="cita-card-boton cita-card-boton-confirmar">
            Voy pa alla
          </button>
          <button type="button" className="cita-card-boton cita-card-boton-cancelar">
            Cancelar reserva
          </button>
        </div>
      </div>
    </article>
  )
}

export default CitaLugar
