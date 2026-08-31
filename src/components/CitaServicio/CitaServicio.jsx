import '../CitaCard/citaCard.css'
import './citaServicio.css'
import { Scissors, Phone, MapPin } from 'lucide-react'
import IconoWhatsApp from '../IconoWhatsApp/IconoWhatsApp.jsx'

function CitaServicio({
  lugar,
  fecha,
  hora,
  wasa,
  coste,
  telefono,
  profesional,
  servicios,
  estadoReserva = 'CONFIRMADO',
  fechaTexto,
  estadoTexto,
}) {
  return (
    <article className="cita-card cita-servicio">
      <div className="cita-card-header">
        <div className="cita-card-header-princ">
          <h2 className="cita-card-lugar">{lugar}</h2>
          <div className="cita-card-state-container">
            <div className="cita-card-state-cosi" />
            <p className="cita-card-state">{estadoReserva}</p>
          </div>
        </div>
        <div className="cita-card-icon-container">
          <Scissors size={25} color="currentColor" className="cita-card-icon" />
        </div>
      </div>

      <div className="cita-card-info-grid">
        <div className="cita-card-info-elemento">
          <span className="cita-card-info-span">Servicio</span>
          <p className="cita-card-info-contenido">{servicios}</p>
        </div>
        <div className="cita-card-info-elemento">
          <span className="cita-card-info-span">Profesional</span>
          <p className="cita-card-info-contenido">{profesional}</p>
        </div>
        <div className="cita-card-info-elemento">
          <span className="cita-card-info-span">Fecha</span>
          <p className="cita-card-info-contenido">
            {fechaTexto ?? 'Mañana, 9:30 AM'}
          </p>
        </div>
        <div className="cita-card-info-elemento">
          <span className="cita-card-info-span">Estado</span>
          <p className="cita-card-info-contenido">
            {estadoTexto ?? 'Quedan 45 min'}
          </p>
        </div>
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
            <a href={`https://wa.me/${wasa}`} className="cita-card-link">
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
            Cancelar Cita
          </button>
        </div>
      </div>
    </article>
  )
}

export default CitaServicio
