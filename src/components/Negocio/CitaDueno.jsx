import { Phone } from 'lucide-react'
import './citaDueno.css'

/* Una cita en el panel del dueño. La misma pieza vale para la de ahora y las de más abajo. */
function CitaDueno({
  hora,
  relativo,
  etiqueta,
  cliente,
  telefono,
  linea,
  detalle,
  estado = 'pendiente',
  destacada = false,
  onConfirmar,
  onRechazar,
}) {
  const estadoTexto = {
    pendiente: 'Pendiente',
    confirmada: 'Confirmada',
    cancelada: 'Cancelada',
  }[estado] ?? 'Pendiente'

  const paso = relativo === 'ya pasó'

  return (
    <article
      className={`cita-dueno cita-dueno--${estado}${destacada ? ' cita-dueno--destacada' : ''}${paso ? ' cita-dueno--pasada' : ''}`}
    >
      <div className="cita-dueno-layout">
        <div className="cita-dueno-tiempo">
          <time dateTime={hora}>{hora}</time>
          {relativo && <span className="cita-dueno-relativo">{relativo}</span>}
          {etiqueta && <span className="cita-dueno-etiqueta">{etiqueta}</span>}
        </div>

        <div className="cita-dueno-cuerpo">
          <header className="cita-dueno-fila-top">
            <h3 className="cita-dueno-cliente">{cliente}</h3>
            <span className="cita-dueno-estado">{estadoTexto}</span>
          </header>

          <div className="cita-dueno-grid">
            <div className="cita-dueno-celda">
              <span className="cita-dueno-label">Contacto</span>
              {telefono ? (
                <p className="cita-dueno-valor cita-dueno-valor--tel">
                  <Phone size={12} strokeWidth={2} aria-hidden="true" />
                  {telefono}
                </p>
              ) : (
                <p className="cita-dueno-valor cita-dueno-valor--muted">Sin teléfono</p>
              )}
            </div>
            <div className="cita-dueno-celda">
              <span className="cita-dueno-label">Reserva</span>
              <p className="cita-dueno-valor">{linea}</p>
            </div>
            {detalle && (
              <div className="cita-dueno-celda cita-dueno-celda--ancho">
                <span className="cita-dueno-label">Detalle</span>
                <p className="cita-dueno-valor">{detalle}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {estado === 'pendiente' && (onConfirmar || onRechazar) && (
        <div className="cita-dueno-acciones">
          {onRechazar && (
            <button type="button" className="cita-dueno-rechazar" onClick={onRechazar}>
              Rechazar
            </button>
          )}
          {onConfirmar && (
            <button type="button" className="cita-dueno-confirmar" onClick={onConfirmar}>
              Confirmar
            </button>
          )}
        </div>
      )}
    </article>
  )
}

export default CitaDueno
