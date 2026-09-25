import './citaDueno.css'

/* Una cita en el panel del dueño. La misma pieza vale para la de ahora y las de más abajo. */
function CitaDueno({
  hora,
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

  return (
    <article
      className={`cita-dueno cita-dueno--${estado}${destacada ? ' cita-dueno--destacada' : ''}`}
    >
      <header className="cita-dueno-hora">
        <time>{hora}</time>
        {etiqueta && <span>{etiqueta}</span>}
        <span className="cita-dueno-estado">{estadoTexto}</span>
      </header>

      <p className="cita-dueno-cliente">{cliente}</p>
      {telefono && <p className="cita-dueno-telefono">{telefono}</p>}
      <p className="cita-dueno-linea">{linea}</p>
      {detalle && <p className="cita-dueno-detalle">{detalle}</p>}

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
